"use client"

import { useEffect, useState } from "react"
import type { MessagePayload } from "firebase/messaging"
import { listenForegroundMessages } from "@/lib/fcm"
import { isFirebaseMessagingConfigured } from "@/lib/firebase"

type ForegroundNotice = {
  id: string
  title: string
  body: string
}

export default function FcmForegroundListener() {
  const [notice, setNotice] = useState<ForegroundNotice | null>(null)

  useEffect(() => {
    if (!isFirebaseMessagingConfigured()) {
      return
    }

    let unsubscribe = () => {}

    void listenForegroundMessages((payload: MessagePayload) => {
      const title = payload.notification?.title ?? "근요일 알림"
      const body = payload.notification?.body ?? ""

      setNotice({
        id: `${Date.now()}`,
        title,
        body,
      })
    }).then((cleanup) => {
      unsubscribe = cleanup
    })

    return () => {
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
