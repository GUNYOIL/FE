import { apiRequest, ApiError } from "@/lib/api-client"
import type {
  ApiAuthTokens,
  ApiExercise,
  ApiGrassEntry,
  ApiMealOverview,
  ApiProteinLogCreate,
  ApiProteinOverview,
  ApiRoutine,
  ApiSchoolLunchResponse,
  ApiSchoolMealSelectionSave,
  ApiUser,
} from "@/lib/api-types"

type Credentials = {
  email: string
  password: string
}

function coerceArray<T>(value: unknown, nestedKeys: string[] = []): T[] {
  if (Array.isArray(value)) {
    return value as T[]
  }

  if (value && typeof value === "object") {
    for (const key of nestedKeys) {
      const candidate = (value as Record<string, unknown>)[key]
      if (Array.isArray(candidate)) {
        return candidate as T[]
      }
    }
  }

  return value ? [value as T] : []
}

function parseAuthTokens(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("로그인 응답에 토큰 정보가 없습니다.")
  }

  const root = payload as Record<string, unknown>
  const candidate =
    root.data && typeof root.data === "object" && !Array.isArray(root.data) ? (root.data as Record<string, unknown>) : root
  const accessToken = typeof candidate.access === "string" ? candidate.access : typeof candidate.access_token === "string" ? candidate.access_token : null
  const refreshToken =
    typeof candidate.refresh === "string"
      ? candidate.refresh
      : typeof candidate.refresh_token === "string"
        ? candidate.refresh_token
        : null

  if (!accessToken) {
    throw new Error("로그인 응답에 access token이 없습니다.")
  }

  return {
    accessToken,
    refreshToken,
  } satisfies ApiAuthTokens
}

async function requestWithFallbacks<T>(paths: string[], request: (path: string) => Promise<T>) {
  let lastError: unknown = null

  for (const path of paths) {
    try {
      return await request(path)
    } catch (error) {
      lastError = error
      if (!(error instanceof ApiError) || ![404, 405].includes(error.status)) {
        throw error
      }
    }
  }

  throw lastError ?? new Error("요청 경로를 찾지 못했습니다.")
}

export function signup(credentials: Credentials) {
  return apiRequest<ApiUser>("/auth/signup/", {
    method: "POST",
    body: credentials,
  })
}

export async function login(credentials: Credentials) {
  const payload = await apiRequest<unknown>("/auth/login/", {
    method: "POST",
    body: credentials,
  })

  return parseAuthTokens(payload)
}

export function logout(token: string, refreshToken: string | null) {
  if (!refreshToken) {
    return Promise.resolve(null)
  }

  return apiRequest<unknown>("/auth/logout/", {
    method: "POST",
    token,
    body: {
      refresh: refreshToken,
    },
  })
}

export function fetchMyProfile(token: string) {
  return requestWithFallbacks(["/me/profile/", "/me/"], (path) =>
    apiRequest<ApiUser>(path, {
      token,
    }),
  )
}

export function updateMyProfile(token: string, body: object) {
  return requestWithFallbacks(["/me/profile/", "/me/", "/me/onboarding/draft/"], (path) =>
    apiRequest<ApiUser>(path, {
      method: "PUT",
      token,
      body,
    }),
  )
}

export function completeMyOnboarding(token: string) {
  return apiRequest<unknown>("/me/onboarding/complete/", {
    method: "POST",
    token,
    body: {
      onboarding_completed: true,
    },
  })
}

export async function fetchExercises(token: string) {
  const payload = await apiRequest<unknown>("/catalog/exercises/", {
    token,
  })

  return coerceArray<ApiExercise>(payload, ["results", "items", "data", "exercises"])
}

export async function fetchMyRoutines(token: string) {
  const payload = await apiRequest<unknown>("/me/routines/", {
    token,
  })

  return coerceArray<ApiRoutine>(payload, ["results", "items", "data", "routines"])
}

export async function saveMyRoutines(token: string, routines: object[]) {
  let lastError: unknown = null

  for (const body of [routines, { routines }]) {
    try {
      await apiRequest<unknown>("/me/routines/", {
        method: "PUT",
        token,
        body,
      })
      return
    } catch (error) {
      lastError = error
    }
  }

  throw lastError ?? new Error("루틴 저장에 실패했습니다.")
}

export async function fetchMyGrass(token: string) {
  const payload = await apiRequest<unknown>("/me/grass/", {
    token,
  })

  return coerceArray<ApiGrassEntry>(payload, ["results", "items", "data", "entries", "grass"])
}

export function fetchProteinOverview(token: string) {
  return apiRequest<ApiProteinOverview>("/me/protein", {
    token,
  })
}

export function createProteinLog(token: string, body: ApiProteinLogCreate) {
  return apiRequest<unknown>("/me/protein/logs", {
    method: "POST",
    token,
    body,
  })
}

export function deleteProteinLog(token: string, logId: number) {
  return apiRequest<unknown>(`/me/protein/logs/${logId}/`, {
    method: "DELETE",
    token,
  })
}

export function fetchMealOverview(token: string) {
  return apiRequest<ApiMealOverview>("/me/meals", {
    token,
  })
}

export function fetchSchoolLunch(token: string) {
  return apiRequest<ApiSchoolLunchResponse>("/me/meals/school-lunch", {
    token,
  })
}

export function saveSchoolLunchSelection(token: string, body: ApiSchoolMealSelectionSave) {
  return apiRequest<unknown>("/me/meals/school-lunch/logs", {
    method: "POST",
    token,
    body,
  })
}

export function deleteMealLog(token: string, mealId: number) {
  return apiRequest<unknown>(`/me/meals/logs/${mealId}/`, {
    method: "DELETE",
    token,
  })
}
