"use client"

import { ApiError } from "@/lib/api-client"
import { deleteMyPushToken, registerMyPushToken } from "@/lib/api"
import { deleteBrowserFcmToken, getFcmRegistrationToken, getNotificationPermissionStatus, isPushMessagingSupported } from "@/lib/fcm"
import { isFirebaseMessagingConfigured } from "@/lib/firebase"

const PUSH_TOKEN_STORAGE_KEY = "gunyoil-fcm-token-v1"
const PUSH_TOKEN_SYNC_MODE_STORAGE_KEY = "gunyoil-fcm-token-sync-mode-v1"
const PUSH_ENABLED_STORAGE_KEY = "gunyoil-fcm-enabled-v1"

type PushTokenSyncMode = "server" | "local"

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
  if (!canUsePushNotifications()) {
    return { status: "unsupported" as const, token: null }
  }

  const token = await getFcmRegistrationToken()
  if (!token) {
    return { status: getNotificationPermissionStatus() as "default" | "denied" | "unsupported", token: null }
  }

  const storedToken = readStoredPushToken()
  const storedSyncMode = readStoredPushTokenSyncMode()

  if (storedToken === token && storedSyncMode === "server") {
    writePushNotificationsEnabled(true)
    return { status: "registered" as const, token }
  }

  if (storedToken === token && storedSyncMode === "local") {
    writePushNotificationsEnabled(true)
    return { status: "local_only" as const, token }
  }

  try {
    await registerMyPushToken(accessToken, {
      token,
      device_type: "web",
    })
    writeStoredPushToken(token)
    writeStoredPushTokenSyncMode("server")
    writePushNotificationsEnabled(true)

    return { status: "registered" as const, token }
  } catch (error) {
    if (!isPushRegistrationApiMissing(error)) {
      throw error
    }

    writeStoredPushToken(token)
    writeStoredPushTokenSyncMode("local")
    writePushNotificationsEnabled(true)

    return { status: "local_only" as const, token }
  }
}

export async function enablePushNotifications(accessToken: string) {
  writePushNotificationsEnabled(true)
  return syncPushTokenRegistration(accessToken)
}

export async function removePushTokenRegistration(accessToken: string | null) {
  const storedToken = readStoredPushToken()
  const storedSyncMode = readStoredPushTokenSyncMode()

  if (accessToken && storedToken && storedSyncMode === "server") {
    try {
      await deleteMyPushToken(accessToken, {
        token: storedToken,
        device_type: "web",
      })
    } catch {
      // Ignore cleanup errors during logout/session expiry.
    }
  }

  try {
    await deleteBrowserFcmToken()
  } catch {
    // Ignore browser token cleanup errors.
  }

  clearStoredPushToken()
}
