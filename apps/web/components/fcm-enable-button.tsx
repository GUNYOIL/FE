"use client"

import { useEffect, useState } from "react"
import { getReadableApiError } from "@/lib/api-client"
import { getNotificationPermissionStatus } from "@/lib/fcm"
import { canUsePushNotifications, enablePushNotifications, isPushNotificationsEnabled, removePushTokenRegistration, syncPushTokenRegistration } from "@/lib/push-notifications"
import { BellIcon } from "./icons"

type PushStatus = "idle" | "loading" | "enabled" | "local_only" | "denied" | "unsupported" | "error"
type FcmEnableButtonVariant = "default" | "compact" | "header"

function getStatusMessage(status: PushStatus, errorMessage: string) {
  if (status === "enabled") {
    return "브라우저 알림 연결됨"
  }

  if (status === "local_only") {
    return "브라우저 알림만 연결됨"
  }

  if (status === "denied") {
    return "브라우저 권한 확인 필요"
  }

  if (status === "error") {
    return errorMessage || "알림 등록 실패"
  }

  return "운동/식단 리마인드 받기"
}

export default function FcmEnableButton({
  accessToken,
  variant = "default",
}: {
  accessToken: string
  variant?: FcmEnableButtonVariant
}) {
  const [status, setStatus] = useState<PushStatus>("idle")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (!canUsePushNotifications()) {
      setStatus("unsupported")
      return
    }

    const permission = getNotificationPermissionStatus()
    if (permission === "denied") {
      setStatus("denied")
      return
    }

    if (permission !== "granted") {
      setStatus("idle")
      return
    }

    if (!isPushNotificationsEnabled()) {
      setStatus("idle")
      return
    }

    let isCancelled = false

    void syncPushTokenRegistration(accessToken)
      .then((result) => {
        if (isCancelled) {
          return
        }

        if (result.status === "registered") {
          setStatus("enabled")
          return
        }

        if (result.status === "local_only") {
          setStatus("local_only")
          return
        }

        if (result.status === "denied") {
          setStatus("denied")
          return
        }

        if (result.status === "unsupported") {
          setStatus("unsupported")
          return
        }

        setStatus("idle")
      })
      .catch((error) => {
        if (isCancelled) {
          return
        }

        setStatus("error")
        setErrorMessage(getReadableApiError(error, "알림 등록에 실패했습니다."))
      })

    return () => {
      isCancelled = true
    }
  }, [accessToken])

  const handleToggle = async () => {
    try {
      const isCurrentlyEnabled = status === "enabled" || status === "local_only"
      setStatus("loading")
      setErrorMessage("")

      if (isCurrentlyEnabled) {
        await removePushTokenRegistration(accessToken)
        setStatus("idle")
        return
      }

      const result = await enablePushNotifications(accessToken)

      if (result.status === "registered") {
        setStatus("enabled")
        return
      }

      if (result.status === "local_only") {
        setStatus("local_only")
        return
      }

      if (result.status === "denied") {
        setStatus("denied")
        return
      }

      if (result.status === "unsupported") {
        setStatus("unsupported")
        return
      }

      setStatus("idle")
    } catch (error) {
      setStatus("error")
      setErrorMessage(getReadableApiError(error, "알림 등록에 실패했습니다."))
    }
  }

  if (status === "unsupported") {
    return null
  }

  const isEnabled = status === "enabled" || status === "local_only"
  const message = getStatusMessage(status, errorMessage)

  if (variant === "header") {
    return (
      <button
        aria-label={message}
        className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-semibold transition-colors ${
          isEnabled
            ? "border-[#D5F1D8] bg-[#EAF7EC] text-[#2CB52C]"
            : status === "loading"
              ? "border-[#E5E8EB] bg-[#F2F4F6] text-[#8B95A1]"
              : "border-[#E5E8EB] bg-white text-[#4E5968]"
        }`}
        disabled={status === "loading"}
        onClick={() => {
          void handleToggle()
        }}
        title={message}
        type="button"
      >
        <BellIcon size={14} />
        <span>{status === "loading" ? "처리 중" : "알림"}</span>
      </button>
    )
  }

  return (
    <div className={variant === "compact" ? "" : "shrink-0 border-b border-[#EEF1F4] bg-[#FCFDFE] px-4 py-2.5"}>
      <div
        className={`flex items-center justify-between gap-3 ${
          variant === "compact"
            ? "rounded-[16px] border border-[#E7EDF5] bg-white/70 px-3 py-2"
            : ""
        }`}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[#3182F6]">
            <BellIcon size={14} />
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">알림</p>
          </div>
          <p className="mt-0.5 text-[12px] leading-5 text-[#6B7684]">{message}</p>
        </div>
        <button
          className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold ${
            isEnabled
              ? "bg-[#EAF7EC] text-[#2CB52C]"
              : status === "loading"
                ? "bg-[#EEF2F6] text-[#8B95A1]"
                : "bg-[#191F28] text-white"
          }`}
          disabled={status === "loading"}
          onClick={() => {
            void handleToggle()
          }}
          type="button"
        >
          {status === "loading"
            ? "처리 중..."
            : isEnabled
              ? "알림 끄기"
              : "알림 켜기"}
        </button>
      </div>
    </div>
  )
}
