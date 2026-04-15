"use client"

import { deleteToken, getMessaging, getToken, isSupported, MessagePayload, onMessage } from "firebase/messaging"
import { getFirebaseApp, isFirebaseMessagingConfigured } from "@/lib/firebase"

const FCM_SERVICE_WORKER_PATH = "/firebase-messaging-sw.js"
const FCM_SERVICE_WORKER_SCOPE = "/firebase-cloud-messaging-push-scope"
const FCM_LOG_PREFIX = "[FCM]"

type FcmLogDetails = Record<string, unknown>

function createTimestampDetails() {
  const now = new Date()

  return {
    at: now.toISOString(),
    epoch_ms: now.getTime(),
    perf_ms: typeof performance !== "undefined" ? Number(performance.now().toFixed(1)) : null,
  }
}

function logFcm(event: string, details: FcmLogDetails = {}) {
  console.info(FCM_LOG_PREFIX, event, {
    ...createTimestampDetails(),
    ...details,
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

export function isPushMessagingSupported() {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator
}

export function getNotificationPermissionStatus() {
  if (!isPushMessagingSupported()) {
    return "unsupported"
  }

  return Notification.permission
}

async function getMessagingIfSupported() {
  if (!isFirebaseMessagingConfigured() || !isPushMessagingSupported()) {
    logFcm("messaging.unavailable", {
      firebase_configured: isFirebaseMessagingConfigured(),
      push_supported: isPushMessagingSupported(),
    })
    return null
  }

  const supported = await isSupported()

  logFcm("messaging.support_check", {
    firebase_messaging_supported: supported,
  })

  if (!supported) {
    return null
  }

  return getMessaging(getFirebaseApp())
}

export async function requestNotificationPermission() {
  if (!isPushMessagingSupported()) {
    logFcm("permission.request_skipped", {
      reason: "push_unsupported",
    })
    return "unsupported" as const
  }

  const previousPermission = Notification.permission
  logFcm("permission.request_start", {
    previous_permission: previousPermission,
  })
  const nextPermission = await Notification.requestPermission()

  logFcm("permission.request_result", {
    previous_permission: previousPermission,
    next_permission: nextPermission,
  })

  return nextPermission
}

export async function registerMessagingServiceWorker() {
  if (!isPushMessagingSupported()) {
    logFcm("service_worker.register_skipped", {
      reason: "push_unsupported",
    })
    return null
  }

  logFcm("service_worker.register_start", {
    path: FCM_SERVICE_WORKER_PATH,
    scope: FCM_SERVICE_WORKER_SCOPE,
  })

  try {
    const registration = await navigator.serviceWorker.register(FCM_SERVICE_WORKER_PATH, {
      scope: FCM_SERVICE_WORKER_SCOPE,
      updateViaCache: "none",
    })

    logFcm("service_worker.register_success", {
      scope: registration.scope,
      active_state: registration.active?.state ?? null,
      installing_state: registration.installing?.state ?? null,
      waiting_state: registration.waiting?.state ?? null,
    })

    return registration
  } catch (error) {
    logFcm("service_worker.register_error", {
      error_name: error instanceof Error ? error.name : null,
      error_message: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

export async function getFcmRegistrationToken() {
  logFcm("token.request_start", {
    firebase_configured: isFirebaseMessagingConfigured(),
    permission: getNotificationPermissionStatus(),
  })

  if (!isFirebaseMessagingConfigured()) {
    logFcm("token.request_skipped", {
      reason: "firebase_not_configured",
    })
    return null
  }

  const permission = await requestNotificationPermission()
  if (permission !== "granted") {
    logFcm("token.request_skipped", {
      reason: "permission_not_granted",
      permission,
    })
    return null
  }

  const messaging = await getMessagingIfSupported()
  if (!messaging) {
    logFcm("token.request_skipped", {
      reason: "messaging_unavailable",
    })
    return null
  }

  const registration = await registerMessagingServiceWorker()
  if (!registration) {
    logFcm("token.request_skipped", {
      reason: "service_worker_registration_missing",
    })
    return null
  }

  logFcm("token.get_start", {
    scope: registration.scope,
    vapid_configured: Boolean(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY),
  })

  try {
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    })

    logFcm("token.request_result", describeToken(token))

    return token
  } catch (error) {
    logFcm("token.request_error", {
      error_name: error instanceof Error ? error.name : null,
      error_message: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

export async function deleteBrowserFcmToken() {
  const messaging = await getMessagingIfSupported()
  if (!messaging) {
    logFcm("token.delete_skipped", {
      reason: "messaging_unavailable",
    })
    return false
  }

  const deleted = await deleteToken(messaging)

  logFcm("token.delete_result", {
    deleted,
  })

  return deleted
}

export async function listenForegroundMessages(handler: (payload: MessagePayload) => void) {
  logFcm("foreground.listener_start", {
    permission: getNotificationPermissionStatus(),
    visibility_state: typeof document !== "undefined" ? document.visibilityState : null,
  })

  const messaging = await getMessagingIfSupported()
  if (!messaging) {
    logFcm("foreground.listener_skipped", {
      reason: "messaging_unavailable",
    })
    return () => {}
  }

  return onMessage(messaging, (payload) => {
    logFcm("foreground.onMessage", {
      message_id: payload.messageId ?? null,
      has_notification: Boolean(payload.notification),
      link: payload.fcmOptions?.link ?? payload.data?.link ?? null,
      visibility_state: typeof document !== "undefined" ? document.visibilityState : null,
    })

    handler(payload)
  })
}
