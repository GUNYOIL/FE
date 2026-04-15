"use client"

import { useEffect, useMemo, useState } from "react"
import {
  clearFcmDebugEntries,
  formatFcmDebugEntries,
  isFcmDebugEnabledOnClient,
  isFcmDebugMessage,
  recordFcmDebugEntry,
  subscribeFcmDebugEntries,
  type FcmDebugEntry,
} from "@/lib/fcm-debug"

type CopyStatus = "idle" | "success" | "error"

function formatLogTimestamp(entry: FcmDebugEntry) {
  const rawAt = typeof entry.details.at === "string" ? entry.details.at : entry.captured_at
  const date = new Date(rawAt)

  if (Number.isNaN(date.getTime())) {
    return rawAt
  }

  return date.toLocaleTimeString("ko-KR", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
    timeZone: "Asia/Seoul",
  })
}

async function copyToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  if (typeof document === "undefined") {
    throw new Error("clipboard_unavailable")
  }

  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  textarea.style.pointerEvents = "none"
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()

  const copied = document.execCommand("copy")
  document.body.removeChild(textarea)

  if (!copied) {
    throw new Error("clipboard_copy_failed")
  }
}

export default function FcmDebugPanel() {
  const [entries, setEntries] = useState<FcmDebugEntry[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle")

  useEffect(() => {
    return subscribeFcmDebugEntries(setEntries)
  }, [])

  useEffect(() => {
    if (!isFcmDebugEnabledOnClient() || typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return
    }

    const handleServiceWorkerMessage = (event: MessageEvent<unknown>) => {
      if (!isFcmDebugMessage(event.data)) {
        return
      }

      recordFcmDebugEntry(event.data.entry)
    }

    navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage)

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage)
    }
  }, [])

  useEffect(() => {
    if (copyStatus === "idle") {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setCopyStatus("idle")
    }, 1800)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [copyStatus])

  const visibleEntries = useMemo(() => entries.slice(0, 40), [entries])

  if (!isFcmDebugEnabledOnClient()) {
    return null
  }

  const handleCopy = async () => {
    try {
      await copyToClipboard(formatFcmDebugEntries(entries))
      setCopyStatus("success")
    } catch {
      setCopyStatus("error")
    }
  }

  return (
    <div className="pointer-events-none fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-4 z-[90] mx-auto max-w-[460px]">
      <div className="pointer-events-auto flex justify-end">
        <button
          className="rounded-full border border-[#D9E0E7] bg-[#191F28] px-3 py-2 text-[12px] font-semibold text-white shadow-[0_14px_28px_-18px_rgba(15,23,42,0.6)]"
          onClick={() => {
            setIsOpen((currentValue) => !currentValue)
          }}
          type="button"
        >
          {isOpen ? "FCM 로그 닫기" : `FCM 로그 ${entries.length}`}
        </button>
      </div>

      {isOpen ? (
        <div className="pointer-events-auto mt-2 overflow-hidden rounded-[8px] border border-[#D9E0E7] bg-white shadow-[0_28px_56px_-30px_rgba(15,23,42,0.4)]">
          <div className="flex items-center justify-between gap-2 border-b border-[#EEF1F4] px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-[#191F28]">FCM 디버그 로그</p>
              <p className="text-[11px] text-[#6B7684]">서비스 워커 로그까지 같이 모아서 복사합니다.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                className="rounded-[8px] border border-[#D9E0E7] px-2.5 py-1.5 text-[11px] font-semibold text-[#4E5968]"
                onClick={() => {
                  clearFcmDebugEntries()
                }}
                type="button"
              >
                초기화
              </button>
              <button
                className="rounded-[8px] bg-[#3182F6] px-2.5 py-1.5 text-[11px] font-semibold text-white"
                onClick={() => {
                  void handleCopy()
                }}
                type="button"
              >
                {copyStatus === "success" ? "복사됨" : copyStatus === "error" ? "다시 시도" : "복사"}
              </button>
            </div>
          </div>

          <div className="max-h-[52svh] overflow-y-auto bg-[#FCFDFE] px-3 py-2.5">
            {visibleEntries.length ? (
              <div className="space-y-2">
                {visibleEntries.map((entry) => (
                  <div className="rounded-[8px] border border-[#E7EDF5] bg-white px-3 py-2" key={entry.id}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-[11px] font-semibold text-[#191F28]">
                        {entry.prefix} {entry.event}
                      </p>
                      <span className="shrink-0 text-[10px] text-[#8B95A1]">{formatLogTimestamp(entry)}</span>
                    </div>
                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all text-[10px] leading-4 text-[#4E5968]">
                      {JSON.stringify(entry.details, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-[#6B7684]">아직 저장된 로그가 없습니다.</p>
            )}
          </div>
        </div>
      ) : null}

      {copyStatus !== "idle" ? (
        <div className="pointer-events-none mt-2 flex justify-end">
          <div
            className={`rounded-[8px] px-3 py-2 text-[11px] font-semibold shadow-[0_16px_32px_-24px_rgba(15,23,42,0.55)] ${
              copyStatus === "success" ? "bg-[#191F28] text-white" : "bg-[#FFF1E6] text-[#B65600]"
            }`}
            role="status"
          >
            {copyStatus === "success" ? "클립보드에 복사되었습니다." : "복사에 실패했습니다. 다시 시도해 주세요."}
          </div>
        </div>
      ) : null}
    </div>
  )
}
