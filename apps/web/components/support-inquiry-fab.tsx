"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { createMyInquiry, fetchMyInquiries } from "@/lib/api"
import { getReadableApiError } from "@/lib/api-client"
import type { ApiInquiry, ApiInquiryStatus } from "@/lib/api-types"
import { MessageCircleIcon, XIcon } from "./icons"

const INQUIRY_HISTORY_STORAGE_KEY = "gunyoil-inquiry-history-v1"
const INQUIRY_SEEN_STATUS_STORAGE_KEY = "gunyoil-inquiry-seen-status-v1"

type LocalInquiryEntry = {
  content: string
  contextLabel: string
  createdAt: string
  ownerEmail: string
  previewMode: boolean
  remoteId: number | null
  replyEmail: string
  status: ApiInquiryStatus
  title: string
}

type InquiryHistoryEntry = {
  content: string
  createdAt: string
  id: string
  replyEmail: string
  status: ApiInquiryStatus
  title: string
}

function buildInquiryContent({
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
    message.trim(),
    "",
    "---",
    `답변 받을 이메일: ${email || "미입력"}`,
    `현재 화면: ${contextLabel}`,
    `접속 모드: ${previewMode ? "미리보기" : "로그인 사용자"}`,
    `작성 시각: ${new Date().toLocaleString("ko-KR")}`,
  ]

  return lines.join("\n")
}

async function copyText(value: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    throw new Error("clipboard_unavailable")
  }

  await navigator.clipboard.writeText(value)
}

function isValidEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value.trim())
}

function normalizeInquiryStatus(status: ApiInquiryStatus | undefined) {
  if (status === "RESOLVED" || status === "answered") {
    return "RESOLVED"
  }

  if (status === "PENDING" || status === "in_progress") {
    return "PENDING"
  }

  return "new"
}

function getInquiryStatusLabel(status: ApiInquiryStatus) {
  if (status === "RESOLVED" || status === "answered") {
    return "해결 완료"
  }

  if (status === "PENDING" || status === "in_progress") {
    return "접수됨"
  }

  return "접수 안됨"
}

function getInquiryStatusChipClass(status: ApiInquiryStatus) {
  if (status === "RESOLVED" || status === "answered") {
    return "bg-[#E8F7EE] text-[#137333]"
  }

  if (status === "PENDING" || status === "in_progress") {
    return "bg-[#EBF3FE] text-[#1B64DA]"
  }

  return "bg-[#F2F4F6] text-[#6B7684]"
}

function formatHistoryDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function readAllLocalInquiries() {
  if (typeof window === "undefined") {
    return [] as LocalInquiryEntry[]
  }

  try {
    const raw = window.localStorage.getItem(INQUIRY_HISTORY_STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as LocalInquiryEntry[] | null
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((entry) => entry && typeof entry === "object" && typeof entry.title === "string")
  } catch {
    return []
  }
}

function writeAllLocalInquiries(entries: LocalInquiryEntry[]) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(INQUIRY_HISTORY_STORAGE_KEY, JSON.stringify(entries))
}

function readSeenInquiryStatuses(ownerEmail: string | null | undefined) {
  if (typeof window === "undefined" || !ownerEmail) {
    return {} as Record<string, ApiInquiryStatus>
  }

  try {
    const raw = window.localStorage.getItem(INQUIRY_SEEN_STATUS_STORAGE_KEY)
    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw) as Record<string, Record<string, ApiInquiryStatus>> | null
    if (!parsed || typeof parsed !== "object") {
      return {}
    }

    const scoped = parsed[ownerEmail]
    return scoped && typeof scoped === "object" ? scoped : {}
  } catch {
    return {}
  }
}

function writeSeenInquiryStatuses(ownerEmail: string | null | undefined, entries: Record<string, ApiInquiryStatus>) {
  if (typeof window === "undefined" || !ownerEmail) {
    return
  }

  try {
    const raw = window.localStorage.getItem(INQUIRY_SEEN_STATUS_STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Record<string, Record<string, ApiInquiryStatus>>) : {}
    parsed[ownerEmail] = entries
    window.localStorage.setItem(INQUIRY_SEEN_STATUS_STORAGE_KEY, JSON.stringify(parsed))
  } catch {
    window.localStorage.setItem(INQUIRY_SEEN_STATUS_STORAGE_KEY, JSON.stringify({ [ownerEmail]: entries }))
  }
}

function filterLocalInquiriesByOwner(entries: LocalInquiryEntry[], ownerEmail: string | null | undefined) {
  if (!ownerEmail) {
    return []
  }

  return entries
    .filter((entry) => entry.ownerEmail === ownerEmail)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

function mergeInquiryHistory(remoteEntries: ApiInquiry[], localEntries: LocalInquiryEntry[]) {
  const remoteById = new Map(remoteEntries.map((entry) => [entry.id, entry]))
  const consumedRemoteIds = new Set<number>()
  const merged: InquiryHistoryEntry[] = []

  for (const localEntry of localEntries) {
    const matchedRemote = localEntry.remoteId ? remoteById.get(localEntry.remoteId) : undefined
    if (matchedRemote) {
      consumedRemoteIds.add(matchedRemote.id)
    }

    merged.push({
      content: localEntry.content,
      createdAt: matchedRemote?.created_at ?? localEntry.createdAt,
      id: localEntry.remoteId ? `inquiry-${localEntry.remoteId}` : `local-inquiry-${localEntry.createdAt}`,
      replyEmail: matchedRemote?.reply_email ?? localEntry.replyEmail,
      status: normalizeInquiryStatus(matchedRemote?.status ?? localEntry.status),
      title: matchedRemote?.title ?? localEntry.title,
    })
  }

  for (const remoteEntry of remoteEntries) {
    if (consumedRemoteIds.has(remoteEntry.id)) {
      continue
    }

    merged.push({
      content: remoteEntry.content,
      createdAt: remoteEntry.created_at,
      id: `inquiry-${remoteEntry.id}`,
      replyEmail: remoteEntry.reply_email,
      status: normalizeInquiryStatus(remoteEntry.status),
      title: remoteEntry.title,
    })
  }

  return merged.sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

function summarizeInquiryContent(content: string) {
  const lines = content
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  return lines[0] ?? ""
}

export default function SupportInquiryFab({
  accountEmail,
  bottomOffset = "calc(5.5rem + env(safe-area-inset-bottom, 0px))",
  contextLabel,
  onRequireAuth,
  previewMode,
  token,
}: {
  accountEmail?: string | null
  bottomOffset?: string
  contextLabel: string
  onRequireAuth?: (description: string) => void
  previewMode: boolean
  token?: string | null
}) {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState(accountEmail ?? "")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState<"compose" | "history">("compose")
  const [expandedInquiryId, setExpandedInquiryId] = useState<string | null>(null)
  const [localInquiryEntries, setLocalInquiryEntries] = useState<LocalInquiryEntry[]>(() =>
    filterLocalInquiriesByOwner(readAllLocalInquiries(), accountEmail),
  )
  const [seenInquiryStatuses, setSeenInquiryStatuses] = useState<Record<string, ApiInquiryStatus>>(() =>
    readSeenInquiryStatuses(accountEmail),
  )
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    if (accountEmail) {
      setEmail((previous) => previous || accountEmail)
    }
  }, [accountEmail])

  useEffect(() => {
    setLocalInquiryEntries(filterLocalInquiriesByOwner(readAllLocalInquiries(), accountEmail))
  }, [accountEmail, isOpen])

  useEffect(() => {
    setSeenInquiryStatuses(readSeenInquiryStatuses(accountEmail))
  }, [accountEmail])

  const inquiryContent = useMemo(
    () =>
      buildInquiryContent({
        email: email.trim(),
        contextLabel,
        previewMode,
        message,
      }),
    [contextLabel, email, message, previewMode],
  )

  const inquiryHistoryQuery = useQuery({
    queryKey: ["myInquiries", token],
    queryFn: () => fetchMyInquiries(token as string),
    enabled: Boolean(token),
    refetchInterval: isOpen ? 5_000 : 10_000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  })

  const createInquiryMutation = useMutation({
    mutationFn: (payload: { title: string; content: string; email: string }) =>
      createMyInquiry(token as string, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["myInquiries", token] })
    },
  })

  const canSubmit = subject.trim().length > 0 && message.trim().length > 0 && isValidEmail(email)
  const inquiryHistory = useMemo(
    () => mergeInquiryHistory(inquiryHistoryQuery.data ?? [], localInquiryEntries),
    [inquiryHistoryQuery.data, localInquiryEntries],
  )
  const hasSeenStatusSnapshot = useMemo(() => Object.keys(seenInquiryStatuses).length > 0, [seenInquiryStatuses])
  const hasUnreadInquiryUpdate = useMemo(() => {
    const remoteEntries = inquiryHistory.filter((entry) => entry.id.startsWith("inquiry-"))

    if (remoteEntries.length === 0 || !hasSeenStatusSnapshot) {
      return false
    }

    return remoteEntries.some((entry) => seenInquiryStatuses[entry.id] !== entry.status)
  }, [hasSeenStatusSnapshot, inquiryHistory, seenInquiryStatuses])

  useEffect(() => {
    if (!accountEmail) {
      return
    }

    const remoteEntries = inquiryHistory.filter((entry) => entry.id.startsWith("inquiry-"))
    if (remoteEntries.length === 0 || hasSeenStatusSnapshot) {
      return
    }

    const initialSnapshot = Object.fromEntries(remoteEntries.map((entry) => [entry.id, entry.status]))
    setSeenInquiryStatuses(initialSnapshot)
    writeSeenInquiryStatuses(accountEmail, initialSnapshot)
  }, [accountEmail, hasSeenStatusSnapshot, inquiryHistory])

  const resetDraft = () => {
    setSubject("")
    setMessage("")
  }

  const closeSheet = () => {
    setIsOpen(false)
    setStatusMessage(null)
    setExpandedInquiryId(null)
  }

  const markInquiryUpdatesAsSeen = () => {
    if (!accountEmail) {
      return
    }

    const remoteEntries = inquiryHistory.filter((entry) => entry.id.startsWith("inquiry-"))
    if (remoteEntries.length === 0) {
      return
    }

    const nextSnapshot = Object.fromEntries(remoteEntries.map((entry) => [entry.id, entry.status]))
    setSeenInquiryStatuses(nextSnapshot)
    writeSeenInquiryStatuses(accountEmail, nextSnapshot)
  }

  const handleCopy = async () => {
    try {
      await copyText(`[근요일 문의] ${subject.trim() || "제목 없음"}\n\n${inquiryContent}`)
      setStatusMessage("문의 내용이 복사되었습니다.")
    } catch {
      setStatusMessage("복사에 실패했습니다. 브라우저 권한을 확인해 주세요.")
    }
  }

  const handleSubmit = async () => {
    if (!canSubmit) {
      return
    }

    if (!token || previewMode) {
      onRequireAuth?.("문의를 전달하고 답변 상태를 확인하려면 로그인 또는 회원가입이 필요합니다.")
      closeSheet()
      return
    }

    const replyEmail = email.trim()
    const createdAt = new Date().toISOString()

    try {
      const response = await createInquiryMutation.mutateAsync({
        title: subject.trim(),
        content: inquiryContent,
        email: replyEmail,
      })

      const nextLocalEntries = [
        {
          content: message.trim(),
          contextLabel,
          createdAt,
          ownerEmail: accountEmail ?? replyEmail,
          previewMode,
          remoteId: response.id,
          replyEmail,
          status: "new" as ApiInquiryStatus,
          title: subject.trim(),
        },
        ...readAllLocalInquiries().filter((entry) => entry.remoteId !== response.id),
      ].sort((left, right) => right.createdAt.localeCompare(left.createdAt))

      writeAllLocalInquiries(nextLocalEntries)
      setLocalInquiryEntries(filterLocalInquiriesByOwner(nextLocalEntries, accountEmail ?? replyEmail))
      if (accountEmail ?? replyEmail) {
        const nextSeenStatuses = {
          ...readSeenInquiryStatuses(accountEmail ?? replyEmail),
          [`inquiry-${response.id}`]: "new" as ApiInquiryStatus,
        }
        setSeenInquiryStatuses(nextSeenStatuses)
        writeSeenInquiryStatuses(accountEmail ?? replyEmail, nextSeenStatuses)
      }
      setActiveTab("history")
      setStatusMessage("문의가 전달되었습니다.")
      resetDraft()
    } catch (error) {
      setStatusMessage(getReadableApiError(error, "문의 전달에 실패했습니다."))
    }
  }

  const historyErrorMessage =
    inquiryHistoryQuery.error && token ? getReadableApiError(inquiryHistoryQuery.error, "문의 내역을 불러오지 못했습니다.") : null

  useEffect(() => {
    if (!isOpen || !token) {
      return
    }

    void inquiryHistoryQuery.refetch()
  }, [inquiryHistoryQuery, isOpen, token])

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
          className="pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full bg-[#191F28] text-white shadow-[0_18px_32px_rgba(15,23,42,0.22)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
          onClick={() => {
            markInquiryUpdatesAsSeen()
            setIsOpen(true)
          }}
          type="button"
        >
          <MessageCircleIcon size={24} />
          {hasUnreadInquiryUpdate ? <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#FF4D4F]" /> : null}
        </button>
      </div>

      {isOpen ? (
        <div className="absolute inset-0 z-40 flex items-end bg-[rgba(15,23,42,0.32)]">
          <button aria-label="닫기" className="absolute inset-0" onClick={closeSheet} type="button" />
          <div className="relative max-h-[88svh] w-full overflow-y-auto rounded-t-[28px] border border-[#E5E8EB] bg-[#FFFFFF] px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-4 shadow-[0_-24px_48px_rgba(15,23,42,0.14)] [scrollbar-width:none] [-ms-overflow-style:none]">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#E5E8EB]" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[#3182F6]">문의 남기기</p>
                <h3 className="mt-1 text-[22px] font-bold tracking-tight text-[#191F28]">불편했던 점을 바로 적어 주세요</h3>
                <p className="mt-2 text-[13px] leading-6 text-[#6B7684]">현재 화면 정보를 포함해 앱으로 바로 문의를 전달합니다.</p>
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

            <div className="mt-5 grid grid-cols-2 gap-2 rounded-[18px] bg-[#F7F8FA] p-1">
              <button
                className={`rounded-[14px] px-3 py-2 text-[13px] font-semibold ${activeTab === "compose" ? "bg-[#FFFFFF] text-[#191F28] shadow-sm" : "text-[#6B7684]"}`}
                onClick={() => setActiveTab("compose")}
                type="button"
              >
                문의 작성
              </button>
              <button
                className={`rounded-[14px] px-3 py-2 text-[13px] font-semibold ${activeTab === "history" ? "bg-[#FFFFFF] text-[#191F28] shadow-sm" : "text-[#6B7684]"}`}
                onClick={() => setActiveTab("history")}
                type="button"
              >
                내 문의 {inquiryHistory.length > 0 ? `${inquiryHistory.length}` : ""}
              </button>
            </div>

            {activeTab === "compose" ? (
              <>
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
                      canSubmit && !createInquiryMutation.isPending ? "bg-[#191F28] text-white" : "bg-[#F2F4F6] text-[#8B95A1]"
                    }`}
                    disabled={!canSubmit || createInquiryMutation.isPending}
                    onClick={() => void handleSubmit()}
                    type="button"
                  >
                    {createInquiryMutation.isPending ? "전달 중..." : "문의 전달"}
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-5">
                {historyErrorMessage ? (
                  <div className="rounded-[18px] border border-[#F1D1CC] bg-[#FFF5F3] px-4 py-3 text-[12px] leading-5 text-[#B42318]">
                    {historyErrorMessage}
                  </div>
                ) : inquiryHistoryQuery.isLoading ? (
                  <div className="rounded-[18px] border border-[#E5E8EB] bg-[#F8FAFC] px-4 py-5 text-[13px] text-[#6B7684]">문의 내역을 불러오는 중입니다...</div>
                ) : inquiryHistory.length === 0 ? (
                  <div className="rounded-[18px] border border-[#E5E8EB] bg-[#F8FAFC] px-4 py-5 text-[13px] text-[#6B7684]">아직 보낸 문의가 없습니다.</div>
                ) : (
                  <div className="space-y-3">
                    {inquiryHistory.map((entry) => {
                      const isExpanded = expandedInquiryId === entry.id
                      const summary = summarizeInquiryContent(entry.content)

                      return (
                      <article key={entry.id} className="rounded-[18px] border border-[#E5E8EB] bg-[#F8FAFC] px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-[14px] font-semibold text-[#191F28]">{entry.title}</p>
                            <p className="mt-1 text-[11px] text-[#8B95A1]">{formatHistoryDate(entry.createdAt)}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${getInquiryStatusChipClass(entry.status)}`}>
                            {getInquiryStatusLabel(entry.status)}
                          </span>
                        </div>
                        <p className="mt-3 line-clamp-2 text-[13px] leading-6 text-[#4E5968]">{summary}</p>
                        {isExpanded ? (
                          <div className="mt-3 rounded-[16px] bg-[#FFFFFF] px-3 py-3">
                            <div className="max-h-52 overflow-y-auto whitespace-pre-wrap text-[12px] leading-6 text-[#4E5968] [scrollbar-width:none] [-ms-overflow-style:none]">
                              {entry.content}
                            </div>
                            <p className="mt-2 text-[11px] text-[#8B95A1]">답변 이메일 · {entry.replyEmail}</p>
                          </div>
                        ) : (
                          <p className="mt-2 text-[11px] text-[#8B95A1]">답변 이메일 · {entry.replyEmail}</p>
                        )}
                        <button
                          className="mt-3 text-[12px] font-semibold text-[#3182F6]"
                          onClick={() => setExpandedInquiryId((previous) => (previous === entry.id ? null : entry.id))}
                          type="button"
                        >
                          {isExpanded ? "접기" : "상세 보기"}
                        </button>
                      </article>
                    )})}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}
