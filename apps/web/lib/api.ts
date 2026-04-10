import { apiRequest, ApiError } from "@/lib/api-client"
import type {
  ApiAnnouncement,
  ApiAuthTokens,
  ApiExercise,
  ApiGrassEntry,
  ApiInquiry,
  ApiInquiryCreate,
  ApiInquiryCreateResponse,
  ApiMealOverview,
  ApiProteinLogCreate,
  ApiProteinOverview,
  ApiPushTokenWrite,
  ApiRoutine,
  ApiSchoolLunchResponse,
  ApiSchoolMealSelectionSave,
  ApiSchoolMealType,
  ApiTodayLog,
  ApiTodayWorkoutSync,
  ApiUser,
  ApiWorkoutSetUpdate,
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

export function registerMyPushToken(token: string, body: ApiPushTokenWrite) {
  return requestWithFallbacks(["/me/push-tokens/", "/me/fcm-tokens/"], (path) =>
    apiRequest<unknown>(path, {
      method: "POST",
      token,
      body,
    }),
  )
}

export function deleteMyPushToken(token: string, body: ApiPushTokenWrite) {
  return requestWithFallbacks(["/me/push-tokens/", "/me/fcm-tokens/"], (path) =>
    apiRequest<unknown>(path, {
      method: "DELETE",
      token,
      body,
    }),
  )
}

export async function fetchFeaturedAnnouncement() {
  const payload = await apiRequest<unknown>("/announcements/", {})
  return coerceArray<ApiAnnouncement>(payload, ["results", "items", "data", "announcements"])[0] ?? null
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

export async function fetchTodayWorkout(token: string) {
  try {
    return await requestWithFallbacks(["/me/workouts/today/", "/me/workouts/today"], (path) =>
      apiRequest<unknown>(path, {
        token,
      }),
    ).then((payload) => {
      if (!payload) {
        return null
      }

      if (Array.isArray(payload)) {
        return (payload[0] as ApiTodayLog | undefined) ?? null
      }

      return payload as ApiTodayLog
    })
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }

    throw error
  }
}

export async function syncTodayWorkout(token: string, body: ApiTodayWorkoutSync) {
  try {
    return await requestWithFallbacks(["/me/workouts/today/", "/me/workouts/today"], (path) =>
      apiRequest<unknown>(path, {
        method: "PUT",
        token,
        body,
      }),
    ).then((payload) => {
      if (!payload) {
        return null
      }

      if (Array.isArray(payload)) {
        return (payload[0] as ApiTodayLog | undefined) ?? null
      }

      return payload as ApiTodayLog
    })
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }

    throw error
  }
}

export function saveTodayWorkoutSet(token: string, body: ApiWorkoutSetUpdate) {
  return requestWithFallbacks(["/me/workouts/today/sets", "/me/workouts/today/sets/"], (path) =>
    apiRequest<unknown>(path, {
      method: "POST",
      token,
      body,
    }),
  )
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

export function fetchSchoolLunch(token: string, mealType?: ApiSchoolMealType | null) {
  const searchParams = new URLSearchParams()

  if (mealType) {
    searchParams.set("meal_type", mealType)
  }

  const path = searchParams.size > 0 ? `/me/meals/school-lunch?${searchParams.toString()}` : "/me/meals/school-lunch"

  return apiRequest<ApiSchoolLunchResponse>(path, {
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

export function createMyInquiry(token: string, body: ApiInquiryCreate) {
  return requestWithFallbacks(["/me/inquiries/", "/me/inquiries"], (path) =>
    apiRequest<ApiInquiryCreateResponse>(path, {
      method: "POST",
      token,
      body,
    }),
  )
}

export async function fetchMyInquiries(token: string) {
  const payload = await requestWithFallbacks(["/me/inquiries/", "/me/inquiries"], (path) =>
    apiRequest<unknown>(path, {
      token,
    }),
  )

  return coerceArray<ApiInquiry>(payload, ["results", "items", "data", "inquiries"])
}
