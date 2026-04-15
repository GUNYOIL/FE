"use client"

import { ApiError } from "@/lib/api-client"
import { deleteMyPushToken, registerMyPushToken } from "@/lib/api"
import { recordFcmDebugEntry } from "@/lib/fcm-debug"
import { deleteBrowserFcmToken, getFcmRegistrationToken, getNotificationPermissionStatus, isPushMessagingSupported } from "@/lib/fcm"
import { isFirebaseMessagingConfigured } from "@/lib/firebase"

const PUSH_TOKEN_STORAGE_KEY = "gunyoil-fcm-token-v1"
const PUSH_TOKEN_SYNC_MODE_STORAGE_KEY = "gunyoil-fcm-token-sync-mode-v1"
const PUSH_ENABLED_STORAGE_KEY = "gunyoil-fcm-enabled-v1"
const FCM_LOG_PREFIX = "[FCM]"

type PushTokenSyncMode = "server" | "local"

function createTimestampDetails() {
  const now = new Date()

  return {
    at: now.toISOString(),
    epoch_ms: now.getTime(),
    perf_ms: typeof performance !== "undefined" ? Number(performance.now().toFixed(1)) : null,
  }
}

function logFcm(event: string, details: Record<string, unknown> = {}) {
  const payload = {
    ...createTimestampDetails(),
    ...details,
  }

  console.info(FCM_LOG_PREFIX, event, payload)
  recordFcmDebugEntry({
    prefix: FCM_LOG_PREFIX,
    event,
    details: payload,
    source: "page",
  })
}

function describeToken(token: string | null) {
  if (!token) {
    return {
      token_present: false,
    }
  }

  return {
    token_present: true,
    token_length: token.length,
    token_tail: token.slice(-12),
  }
}

export function canUsePushNotifications() {
  return isFirebaseMessagingConfigured() && isPushMessagingSupported()
}

export function readStoredPushToken() {
  if (typeof window === "undefined") {
    return null
  }

  return window.localStorage.getItem(PUSH_TOKEN_STORAGE_KEY)
}

export function isPushNotificationsEnabled() {
  if (typeof window === "undefined") {
    return false
  }

  return window.localStorage.getItem(PUSH_ENABLED_STORAGE_KEY) === "true"
}

function writeStoredPushToken(token: string) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token)
}

function writePushNotificationsEnabled(enabled: boolean) {
  if (typeof window === "undefined") {
    return
  }

  if (!enabled) {
    window.localStorage.removeItem(PUSH_ENABLED_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(PUSH_ENABLED_STORAGE_KEY, "true")
}

export function clearStoredPushToken() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(PUSH_TOKEN_STORAGE_KEY)
  window.localStorage.removeItem(PUSH_TOKEN_SYNC_MODE_STORAGE_KEY)
  window.localStorage.removeItem(PUSH_ENABLED_STORAGE_KEY)
}

function readStoredPushTokenSyncMode(): PushTokenSyncMode | null {
  if (typeof window === "undefined") {
    return null
  }

  const value = window.localStorage.getItem(PUSH_TOKEN_SYNC_MODE_STORAGE_KEY)
  return value === "server" || value === "local" ? value : null
}

function writeStoredPushTokenSyncMode(mode: PushTokenSyncMode) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(PUSH_TOKEN_SYNC_MODE_STORAGE_KEY, mode)
}

function isPushRegistrationApiMissing(error: unknown) {
  return error instanceof ApiError && (error.status === 404 || error.status === 405)
}

export async function syncPushTokenRegistration(accessToken: string) {
  logFcm("sync.start", {
    enabled: isPushNotificationsEnabled(),
  })

  if (!canUsePushNotifications()) {
    logFcm("sync.skipped", {
      reason: "push_unavailable",
    })
    return { status: "unsupported" as const, token: null }
  }

  const token = await getFcmRegistrationToken()
  if (!token) {
    const status = getNotificationPermissionStatus() as "default" | "denied" | "unsupported"

    logFcm("sync.no_token", {
      status,
    })

    return { status, token: null }
  }

  const storedToken = readStoredPushToken()
  const storedSyncMode = readStoredPushTokenSyncMode()

  logFcm("sync.token_state", {
    ...describeToken(token),
    stored_sync_mode: storedSyncMode,
    stored_token_matches: storedToken === token,
  })

  if (storedToken === token && storedSyncMode === "server") {
    writePushNotificationsEnabled(true)
    logFcm("sync.cached_server", {
      stored_sync_mode: storedSyncMode,
    })
    return { status: "registered" as const, token }
  }

  // Retry same-token local-only states so the client can recover once the server
  // registration route becomes available again.

  try {
    logFcm("sync.api_register_start", {
      stored_sync_mode: storedSyncMode,
    })

    await registerMyPushToken(accessToken, {
      token,
      device_type: "web",
    })

    writeStoredPushToken(token)
    writeStoredPushTokenSyncMode("server")
    writePushNotificationsEnabled(true)
    logFcm("sync.api_register_success", {
      ...describeToken(token),
      stored_sync_mode: "server",
    })

    return { status: "registered" as const, token }
  } catch (error) {
    if (!isPushRegistrationApiMissing(error)) {
      logFcm("sync.api_register_error", {
        ...describeToken(token),
        error_name: error instanceof Error ? error.name : null,
        error_message: error instanceof Error ? error.message : String(error),
      })
      throw error
    }

    writeStoredPushToken(token)
    writeStoredPushTokenSyncMode("local")
    writePushNotificationsEnabled(true)
    logFcm("sync.api_register_local_only", {
      ...describeToken(token),
      stored_sync_mode: "local",
    })

    return { status: "local_only" as const, token }
  }
}

export async function enablePushNotifications(accessToken: string) {
  logFcm("enable.start")
  writePushNotificationsEnabled(true)
  return syncPushTokenRegistration(accessToken)
}

export async function removePushTokenRegistration(accessToken: string | null) {
  const storedToken = readStoredPushToken()
  const storedSyncMode = readStoredPushTokenSyncMode()

  logFcm("remove.start", {
    ...describeToken(storedToken),
    stored_sync_mode: storedSyncMode,
    has_access_token: Boolean(accessToken),
  })

  if (accessToken && storedToken && storedSyncMode === "server") {
    try {
      await deleteMyPushToken(accessToken, {
        token: storedToken,
        device_type: "web",
      })
      logFcm("remove.api_delete_success", {
        ...describeToken(storedToken),
      })
    } catch {
      logFcm("remove.api_delete_ignored", {
        ...describeToken(storedToken),
      })
      // Ignore cleanup errors during logout/session expiry.
    }
  }

  try {
    await deleteBrowserFcmToken()
  } catch {
    logFcm("remove.browser_delete_ignored")
    // Ignore browser token cleanup errors.
  }

  clearStoredPushToken()
  logFcm("remove.complete")
}
