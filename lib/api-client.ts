
const DEFAULT_API_BASE_URL = "https://gunyoil.dsmhs.kr"

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/+$/, "")

type ApiRequestOptions = {
  body?: BodyInit | FormData | object | null
  headers?: HeadersInit
  method?: string
  token?: string | null
}

export class ApiError extends Error {
  status: number
  payload: unknown

  constructor(status: number, payload: unknown, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.payload = payload
  }
}

function buildUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path
  }

  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

function parseResponseBody(text: string) {
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

function unwrapSuccessEnvelope(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload
  }

  const candidate = payload as Record<string, unknown>
  const hasData = Object.prototype.hasOwnProperty.call(candidate, "data")
  const hasSuccessFlag = typeof candidate.success === "boolean"
  const hasMessage = typeof candidate.message === "string"

  if (hasData && (hasSuccessFlag || hasMessage)) {
    return candidate.data
  }

  return payload
}

function collectErrorMessages(value: unknown): string[] {
  if (!value) {
    return []
  }

  if (typeof value === "string") {
    return value.trim() ? [value] : []
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectErrorMessages)
  }

  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(collectErrorMessages)
  }

  return []
}

function getApiErrorMessage(payload: unknown, fallback: string) {
  const messages = collectErrorMessages(payload).filter(Boolean)
  return messages.length > 0 ? messages.join("\n") : fallback
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, headers, method = "GET", token } = options
  const requestHeaders = new Headers(headers)
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData

  if (!isFormData && body !== undefined && body !== null && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json")
  }

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers: requestHeaders,
    body:
      body === undefined || body === null
        ? undefined
        : isFormData || typeof body === "string" || body instanceof Blob
          ? body
          : JSON.stringify(body),
    cache: "no-store",
  })

  const text = await response.text()
  const payload = parseResponseBody(text)

  if (!response.ok) {
    throw new ApiError(response.status, payload, getApiErrorMessage(payload, "요청 처리에 실패했습니다."))
  }

  return unwrapSuccessEnvelope(payload) as T
}

export function getReadableApiError(error: unknown, fallback = "요청 처리 중 오류가 발생했습니다.") {
  if (error instanceof ApiError) {
    return error.message || fallback
  }

  if (error instanceof Error) {
    return error.message || fallback
  }

  return fallback
}
