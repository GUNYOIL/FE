"use client"

import { useEffect, useMemo, useState } from "react"
import { MessageCircleIcon, XIcon } from "./icons"

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ?? ""

function buildInquiryBody({
  email,
  contextLabel,
  previewMode,
  message,
}: {
  email: string
  contextLabel: string
  previewMode: boolean
  message: string
}) {
  const lines = [
    `답변 받을 이메일: ${email || "미입력"}`,
    `현재 화면: ${contextLabel}`,
    `접속 모드: ${previewMode ? "미리보기" : "로그인 사용자"}`,
    `작성 시각: ${new Date().toLocaleString("ko-KR")}`,
    "",
    "문의 내용",
    message.trim(),
  ]

  return lines.join("\n")
}

async function copyText(value: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    throw new Error("clipboard_unavailable")
  }

  await navigator.clipboard.writeText(value)
}

export default function SupportInquiryFab({
  accountEmail,
  bottomOffset = "calc(5.5rem + env(safe-area-inset-bottom, 0px))",
  contextLabel,
  previewMode,
}: {
  accountEmail?: string | null
  bottomOffset?: string
  contextLabel: string
  previewMode: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState(accountEmail ?? "")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    if (accountEmail) {
      setEmail((previous) => previous || accountEmail)
    }
  }, [accountEmail])

  const inquiryBody = useMemo(
    () =>
      buildInquiryBody({
        email: email.trim(),
        contextLabel,
        previewMode,
        message,
      }),
    [contextLabel, email, message, previewMode],
  )

  const canSubmit = subject.trim().length > 0 && message.trim().length > 0

  const resetDraft = () => {
    setSubject("")
    setMessage("")
    setStatusMessage(null)
  }

  const closeSheet = () => {
    setIsOpen(false)
    setStatusMessage(null)
  }

  const handleCopy = async () => {
    try {
      await copyText(`[근요일 문의] ${subject.trim() || "제목 없음"}\n\n${inquiryBody}`)
      setStatusMessage("문의 내용이 복사되었습니다. 원하는 채널에 그대로 붙여넣어 전달할 수 있습니다.")
    } catch {
      setStatusMessage("복사에 실패했습니다. 브라우저 권한을 확인해 주세요.")
    }
  }

  const handleSubmit = async () => {
    if (!canSubmit) {
      return
    }

    if (!SUPPORT_EMAIL) {
      await handleCopy()
      return
    }

    try {
      await copyText(`[근요일 문의] ${subject.trim()}\n\n${inquiryBody}`)
    } catch {
      // Copy failure should not block the mailto flow.
    }

    const params = new URLSearchParams({
      subject: `[근요일 문의] ${subject.trim()}`,
      body: inquiryBody,
    })

    window.location.href = `mailto:${SUPPORT_EMAIL}?${params.toString()}`
    setStatusMessage("메일 앱으로 이동합니다. 전송 전에 내용을 확인해 주세요.")
    window.setTimeout(() => {
      resetDraft()
      setIsOpen(false)
    }, 200)
  }

  return (
    <>
      <div
        className="pointer-events-none absolute right-4 z-30"
        style={{
          bottom: bottomOffset,
        }}
      >
        <button
          aria-expanded={isOpen}
          aria-label="문의 남기기"
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#191F28] text-white shadow-[0_18px_32px_rgba(15,23,42,0.22)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          <MessageCircleIcon size={24} />
        </button>
      </div>

      {isOpen ? (
        <div className="absolute inset-0 z-40 flex items-end bg-[rgba(15,23,42,0.32)]">
          <button aria-label="닫기" className="absolute inset-0" onClick={closeSheet} type="button" />
          <div className="relative w-full rounded-t-[28px] border border-[#E5E8EB] bg-[#FFFFFF] px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-4 shadow-[0_-24px_48px_rgba(15,23,42,0.14)]">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#E5E8EB]" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[#3182F6]">문의 남기기</p>
                <h3 className="mt-1 text-[22px] font-bold tracking-tight text-[#191F28]">불편했던 점을 바로 적어 주세요</h3>
                <p className="mt-2 text-[13px] leading-6 text-[#6B7684]">
                  현재 화면과 함께 문의 내용을 정리해 전달합니다.
                  {SUPPORT_EMAIL ? ` 전송 대상: ${SUPPORT_EMAIL}` : " 운영 이메일이 아직 설정되지 않아 우선 내용 복사만 가능합니다."}
                </p>
              </div>
              <button
                aria-label="문의 시트 닫기"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F2F4F6] text-[#4E5968]"
                onClick={closeSheet}
                type="button"
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#F8FAFC] px-3 py-1.5 text-[12px] font-medium text-[#4E5968]">현재 화면 · {contextLabel}</span>
              <span className="rounded-full bg-[#F8FAFC] px-3 py-1.5 text-[12px] font-medium text-[#4E5968]">
                {previewMode ? "미리보기 모드" : "로그인 사용자"}
              </span>
            </div>

            <div className="mt-5 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-semibold text-[#4E5968]">답변 받을 이메일</span>
                <input
                  className="w-full rounded-[18px] border border-[#E5E8EB] bg-[#F8FAFC] px-4 py-3 text-[14px] text-[#191F28] outline-none placeholder:text-[#ADB5BD] focus:border-[#3182F6]"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="reply@example.com"
                  type="email"
                  value={email}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[12px] font-semibold text-[#4E5968]">제목</span>
                <input
                  className="w-full rounded-[18px] border border-[#E5E8EB] bg-[#F8FAFC] px-4 py-3 text-[14px] text-[#191F28] outline-none placeholder:text-[#ADB5BD] focus:border-[#3182F6]"
                  maxLength={80}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="예: 점심 급식 기록이 중복돼요"
                  type="text"
                  value={subject}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[12px] font-semibold text-[#4E5968]">문의 내용</span>
                <textarea
                  className="min-h-[140px] w-full resize-none rounded-[18px] border border-[#E5E8EB] bg-[#F8FAFC] px-4 py-3 text-[14px] leading-6 text-[#191F28] outline-none placeholder:text-[#ADB5BD] focus:border-[#3182F6]"
                  maxLength={1000}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="어떤 화면에서 어떤 문제가 있었는지, 기대한 동작이 무엇인지 적어 주세요."
                  value={message}
                />
              </label>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[11px] leading-5 text-[#8B95A1]">{message.length}/1000자</p>
              {statusMessage ? <p className="text-right text-[11px] leading-5 text-[#3182F6]">{statusMessage}</p> : null}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                className="flex items-center justify-center rounded-[18px] border border-[#D9E0E7] bg-[#FFFFFF] px-4 py-3 text-[14px] font-semibold text-[#4E5968]"
                onClick={() => void handleCopy()}
                type="button"
              >
                내용 복사
              </button>
              <button
                className={`flex items-center justify-center rounded-[18px] px-4 py-3 text-[14px] font-semibold ${
                  canSubmit ? "bg-[#191F28] text-white" : "bg-[#F2F4F6] text-[#8B95A1]"
                }`}
                disabled={!canSubmit}
                onClick={() => void handleSubmit()}
                type="button"
              >
                {SUPPORT_EMAIL ? "문의 보내기" : "복사해서 전달"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
