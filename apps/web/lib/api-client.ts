import { createApiRequest } from "@gunyoil/shared/api-client"

export { API_BASE_URL, ApiError, getReadableApiError, isAuthErrorStatus } from "@gunyoil/shared/api-client"

export const AUTH_ERROR_EVENT = "gunyoil:auth-error"

function dispatchAuthError(status: number) {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(
    new CustomEvent(AUTH_ERROR_EVENT, {
      detail: { status },
    }),
  )
}

export const apiRequest = createApiRequest({ onAuthError: dispatchAuthError })
