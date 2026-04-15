"use client"

export const FCM_DEBUG_MESSAGE_TYPE = "gunyoil:fcm-debug-log"

const FCM_DEBUG_STORAGE_KEY = "gunyoil-fcm-debug-log-buffer-v1"
const MAX_FCM_DEBUG_ENTRIES = 150

export type FcmDebugPrefix = "[FCM]" | "[FCM][SW]"
export type FcmDebugSource = "page" | "service_worker"

export type FcmDebugEntry = {
  id: string
  prefix: FcmDebugPrefix
  event: string
  details: Record<string, unknown>
  source: FcmDebugSource
  captured_at: string
}

export type FcmDebugEntryInput = Omit<FcmDebugEntry, "id" | "captured_at">

type FcmDebugListener = (entries: FcmDebugEntry[]) => void

declare global {
  interface Window {
    __GUNYOIL_FCM_DEBUG__?: boolean
  }
}

const listeners = new Set<FcmDebugListener>()
let cachedEntries: FcmDebugEntry[] | null = null

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function sanitizeDetails(details: Record<string, unknown>) {
  try {
    return JSON.parse(JSON.stringify(details)) as Record<string, unknown>
  } catch {
    return {
      serialization_error: true,
    }
  }
}

function readStoredEntries() {
  if (!canUseBrowserStorage()) {
    return []
  }

  if (cachedEntries) {
    return cachedEntries
  }

  try {
    const rawValue = window.localStorage.getItem(FCM_DEBUG_STORAGE_KEY)
    if (!rawValue) {
      cachedEntries = []
      return cachedEntries
    }

    const parsedValue = JSON.parse(rawValue)
    if (!Array.isArray(parsedValue)) {
      cachedEntries = []
      return cachedEntries
    }

    cachedEntries = parsedValue.filter((entry): entry is FcmDebugEntry => {
      return Boolean(
        entry &&
          typeof entry === "object" &&
          typeof entry.id === "string" &&
          typeof entry.prefix === "string" &&
          typeof entry.event === "string" &&
          entry.details &&
          typeof entry.details === "object" &&
          typeof entry.source === "string" &&
          typeof entry.captured_at === "string",
      )
    })

    return cachedEntries
  } catch {
    cachedEntries = []
    return cachedEntries
  }
}

function writeStoredEntries(entries: FcmDebugEntry[]) {
  cachedEntries = entries

  if (!canUseBrowserStorage()) {
    return
  }

  window.localStorage.setItem(FCM_DEBUG_STORAGE_KEY, JSON.stringify(entries))
}

function emit(entries: FcmDebugEntry[]) {
  listeners.forEach((listener) => {
    listener(entries)
  })
}

export function isFcmDebugEnabledOnClient() {
  return typeof window !== "undefined" && window.__GUNYOIL_FCM_DEBUG__ === true
}

export function recordFcmDebugEntry(entry: FcmDebugEntryInput) {
  if (!isFcmDebugEnabledOnClient()) {
    return null
  }

  const nextEntry: FcmDebugEntry = {
    ...entry,
    details: sanitizeDetails(entry.details),
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    captured_at: new Date().toISOString(),
  }

  const nextEntries = [nextEntry, ...readStoredEntries()].slice(0, MAX_FCM_DEBUG_ENTRIES)
  writeStoredEntries(nextEntries)
  emit(nextEntries)

  return nextEntry
}

export function subscribeFcmDebugEntries(listener: FcmDebugListener) {
  listeners.add(listener)
  listener(readStoredEntries())

  return () => {
    listeners.delete(listener)
  }
}

export function clearFcmDebugEntries() {
  writeStoredEntries([])
  emit([])
}

export function isFcmDebugMessage(
  value: unknown,
): value is {
  type: typeof FCM_DEBUG_MESSAGE_TYPE
  entry: FcmDebugEntryInput
} {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Record<string, unknown>
  const entry = candidate.entry

  return (
    candidate.type === FCM_DEBUG_MESSAGE_TYPE &&
    Boolean(entry) &&
    typeof entry === "object" &&
    typeof (entry as Record<string, unknown>).prefix === "string" &&
    typeof (entry as Record<string, unknown>).event === "string" &&
    Boolean((entry as Record<string, unknown>).details) &&
    typeof (entry as Record<string, unknown>).details === "object" &&
    typeof (entry as Record<string, unknown>).source === "string"
  )
}

function formatEntryTimestamp(entry: FcmDebugEntry) {
  const rawAt = typeof entry.details.at === "string" ? entry.details.at : entry.captured_at
  const date = new Date(rawAt)

  if (Number.isNaN(date.getTime())) {
    return rawAt
  }

  return date.toLocaleString("ko-KR", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
    timeZone: "Asia/Seoul",
  })
}

export function formatFcmDebugEntries(entries: FcmDebugEntry[]) {
  const headerLines = [
    `copied_at=${new Date().toISOString()}`,
    `url=${typeof window === "undefined" ? "" : window.location.href}`,
    `user_agent=${typeof navigator === "undefined" ? "" : navigator.userAgent}`,
    "",
  ]

  const lines = entries
    .slice()
    .reverse()
    .map((entry) => {
      return [
        `[${formatEntryTimestamp(entry)} KST] ${entry.prefix} ${entry.event}`,
        JSON.stringify(entry.details),
      ].join("\n")
    })

  return [...headerLines, ...lines].join("\n")
}
