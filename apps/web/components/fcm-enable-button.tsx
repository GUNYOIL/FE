"use client"

import { useEffect, useState } from "react"
import { getReadableApiError } from "@/lib/api-client"
import { getFcmRegistrationToken, getNotificationPermissionStatus } from "@/lib/fcm"
import {
  canUsePushNotifications,
  enablePushNotifications,
  isPushNotificationsEnabled,
  readStoredPushToken,
  removePushTokenRegistration,
  syncPushTokenRegistration,
} from "@/lib/push-notifications"
import { BellIcon } from "./icons"

type PushStatus = "idle" | "loading" | "enabled" | "local_only" | "denied" | "unsupported" | "error"
type FcmEnableButtonVariant = "default" | "compact" | "header"

function isPushDebugHost() {
  if (typeof window === "undefined") {
    return false
  }

  return window.location.hostname !== "gunyoil.dsmhs.kr"
}

function getStatusMessage(status: PushStatus, errorMessage: string) {
  if (status === "enabled") {
    return "브라우저 알림 연결됨"
  }

  if (status === "local_only") {
    return "알림 서버 연결 확인 필요"
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
  const [isPushDebugVisible, setIsPushDebugVisible] = useState(false)
  const [isPushDebugOpen, setIsPushDebugOpen] = useState(false)
  const [isPushDebugLoading, setIsPushDebugLoading] = useState(false)
  const [pushDebugToken, setPushDebugToken] = useState("")
  const [pushDebugMessage, setPushDebugMessage] = useState("")

  useEffect(() => {
    setIsPushDebugVisible(isPushDebugHost())
  }, [])

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

  const handleOpenPushDebug = async () => {
    setIsPushDebugOpen(true)
    setIsPushDebugLoading(true)
    setPushDebugMessage("")

    try {
      const latestToken = await getFcmRegistrationToken()
      const storedToken = readStoredPushToken()
      const nextToken = latestToken ?? storedToken

      if (!nextToken) {
        setPushDebugToken("")
        setPushDebugMessage("이 기기의 FCM 토큰을 아직 찾지 못했습니다.")
        return
      }

      setPushDebugToken(nextToken)
      setPushDebugMessage(latestToken ? "현재 기기의 최신 토큰입니다." : "저장된 토큰을 표시합니다.")
    } catch (error) {
      setPushDebugToken("")
      setPushDebugMessage(getReadableApiError(error, "FCM 토큰을 불러오지 못했습니다."))
    } finally {
      setIsPushDebugLoading(false)
    }
  }

  const handleCopyPushDebugToken = async () => {
    if (!pushDebugToken) {
      return
    }

    try {
      await navigator.clipboard.writeText(pushDebugToken)
      setPushDebugMessage("FCM 토큰을 클립보드에 복사했습니다.")
    } catch {
      setPushDebugMessage("클립보드 복사에 실패했습니다. 화면의 토큰을 직접 복사해 주세요.")
    }
  }

  if (status === "unsupported") {
    return null
  }

  const isEnabled = status === "enabled"
  const isLocalOnly = status === "local_only"
  const message = getStatusMessage(status, errorMessage)

  if (variant === "header") {
    return (
      <>
        <div className="flex items-center gap-1.5">
          <button
            aria-label={message}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-semibold transition-colors ${
              isEnabled
                ? "border-[#D5F1D8] bg-[#EAF7EC] text-[#2CB52C]"
                : isLocalOnly
                  ? "border-[#F4DFC2] bg-[#FFF7ED] text-[#B65600]"
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
            <span>{status === "loading" ? "처리 중" : isLocalOnly ? "확인 필요" : "알림"}</span>
          </button>
          {isPushDebugVisible ? (
            <button
              className="inline-flex h-8 items-center rounded-full border border-[#D9E0E7] bg-white px-2.5 text-[12px] font-semibold text-[#4E5968]"
              disabled={isPushDebugLoading}
              onClick={() => {
                void handleOpenPushDebug()
              }}
              type="button"
            >
              {isPushDebugLoading ? "토큰 확인 중" : "토큰"}
            </button>
          ) : null}
        </div>
        {isPushDebugVisible && isPushDebugOpen ? (
          <div className="fixed right-4 bottom-4 left-4 z-[80] mx-auto max-w-[480px] rounded-[16px] border border-[#D9E0E7] bg-white p-4 shadow-[0_20px_40px_-28px_rgba(15,23,42,0.4)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#191F28]">이 기기의 FCM 토큰</p>
                <p className="mt-1 text-[12px] leading-5 text-[#6B7684]">모바일 PWA에서 복사한 뒤 서버 테스트 토큰으로 사용하면 됩니다.</p>
              </div>
              <button
                className="shrink-0 rounded-full border border-[#D9E0E7] px-2.5 py-1 text-[12px] font-semibold text-[#4E5968]"
                onClick={() => {
                  setIsPushDebugOpen(false)
                }}
                type="button"
              >
                닫기
              </button>
            </div>
            <textarea
              className="mt-3 h-28 w-full resize-none rounded-[10px] border border-[#E5E8EB] bg-[#F8FAFC] px-3 py-2 text-[11px] leading-5 text-[#191F28]"
              readOnly
              value={pushDebugToken || "토큰이 아직 없습니다."}
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="min-w-0 text-[12px] leading-5 text-[#6B7684]">{pushDebugMessage}</p>
              <button
                className="shrink-0 rounded-full bg-[#191F28] px-3 py-1.5 text-[12px] font-semibold text-white disabled:bg-[#EEF2F6] disabled:text-[#8B95A1]"
                disabled={!pushDebugToken}
                onClick={() => {
                  void handleCopyPushDebugToken()
                }}
                type="button"
              >
                복사
              </button>
            </div>
          </div>
        ) : null}
      </>
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
              : isLocalOnly
                ? "bg-[#FFF1E6] text-[#B65600]"
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
            : isEnabled || isLocalOnly
              ? "알림 끄기"
              : "알림 켜기"}
        </button>
      </div>
    </div>
  )
}
