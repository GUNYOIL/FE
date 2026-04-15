"use client"

import { useEffect, useState } from "react"
import type { MessagePayload } from "firebase/messaging"
import { listenForegroundMessages } from "@/lib/fcm"
import { isFirebaseMessagingConfigured } from "@/lib/firebase"

const FCM_LOG_PREFIX = "[FCM]"

type ForegroundNotice = {
  id: string
  title: string
  body: string
}

function createTimestampDetails() {
  const now = new Date()

  return {
    at: now.toISOString(),
    epoch_ms: now.getTime(),
    perf_ms: typeof performance !== "undefined" ? Number(performance.now().toFixed(1)) : null,
  }
}

function logFcm(event: string, details: Record<string, unknown> = {}) {
  console.info(FCM_LOG_PREFIX, event, {
    ...createTimestampDetails(),
    ...details,
  })
}

function showBrowserNotification(payload: MessagePayload, title: string, body: string) {
  if (typeof window === "undefined" || Notification.permission !== "granted") {
    logFcm("foreground.browser_notification_skipped", {
      permission: typeof window === "undefined" ? "window_undefined" : Notification.permission,
      title,
    })
    return
  }

  const link = payload.fcmOptions?.link || payload.data?.link || "/"
  logFcm("foreground.browser_notification_before", {
    title,
    link,
    permission: Notification.permission,
  })
  const notification = new Notification(title, {
    body,
    icon: "/icon-192.svg",
    badge: "/icon-192.svg",
  })
  logFcm("foreground.browser_notification_after", {
    title,
    link,
  })

  notification.onclick = () => {
    logFcm("foreground.browser_notification_click", {
      title,
      link,
    })
    window.focus()
    window.location.assign(link)
    notification.close()
  }
}

export default function FcmForegroundListener() {
  const [notice, setNotice] = useState<ForegroundNotice | null>(null)

  useEffect(() => {
    logFcm("foreground.listener_mount", {
      firebase_configured: isFirebaseMessagingConfigured(),
      permission: typeof window === "undefined" ? "window_undefined" : Notification.permission,
      visibility_state: typeof document === "undefined" ? null : document.visibilityState,
      display_mode_standalone:
        typeof window === "undefined" || typeof window.matchMedia !== "function" ? null : window.matchMedia("(display-mode: standalone)").matches,
    })

    if (!isFirebaseMessagingConfigured()) {
      return
    }

    let unsubscribe = () => {}

    void listenForegroundMessages((payload: MessagePayload) => {
      const title = payload.notification?.title ?? "근요일 알림"
      const body = payload.notification?.body ?? ""
      const link = payload.fcmOptions?.link || payload.data?.link || "/"

      logFcm("foreground.onMessage_received", {
        message_id: payload.messageId ?? null,
        title,
        body_length: body.length,
        link,
        permission: Notification.permission,
        visibility_state: typeof document === "undefined" ? null : document.visibilityState,
      })

      showBrowserNotification(payload, title, body)

      logFcm("foreground.notice_set", {
        message_id: payload.messageId ?? null,
        title,
        link,
      })
      setNotice({
        id: `${Date.now()}`,
        title,
        body,
      })
    }).then((cleanup) => {
      unsubscribe = cleanup
    })

    return () => {
      logFcm("foreground.listener_unmount")
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!notice) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setNotice(null)
    }, 4500)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [notice])

  if (!notice) {
    return null
  }

  return (
    <div className="pointer-events-none fixed top-4 right-4 left-4 z-[70] mx-auto max-w-[420px]">
      <div className="rounded-2xl bg-[#191F28] px-4 py-3 text-white shadow-[0_20px_36px_-24px_rgba(15,23,42,0.48)]">
        <p className="text-[13px] font-semibold">{notice.title}</p>
        {notice.body ? <p className="mt-1 text-[12px] leading-5 text-white/80">{notice.body}</p> : null}
      </div>
    </div>
  )
}
