import { createEmptyRoutineMap, type OnboardingData } from "@/lib/app-config"
import {
  buildUserUpdatePayload,
  apiRoutinesToRoutineMap,
  mergeRemoteOnboardingData,
  routineMapToApiPayload,
} from "@/lib/api-adapters"
import {
  completeMyOnboarding,
  fetchExercises,
  fetchMyProfile,
  fetchMyRoutines,
  saveMyRoutines,
  updateMyProfile,
} from "@/lib/api"
import type { Account, OnboardingProfileDraft } from "@/lib/session"

function formatUnresolvedExercises(exerciseNames: string[]) {
  return `백엔드 exercise catalog에서 찾지 못한 운동이 있습니다: ${exerciseNames.join(", ")}`
}

export async function loadRemoteOnboardingState(account: Account, fallback?: OnboardingData | null) {
  const user = await fetchMyProfile(account.accessToken)
  const [catalogResult, routinesResult] = await Promise.allSettled([
    fetchExercises(account.accessToken),
    fetchMyRoutines(account.accessToken),
  ])

  const catalog = catalogResult.status === "fulfilled" ? catalogResult.value : []
  const routines =
    routinesResult.status === "fulfilled"
      ? apiRoutinesToRoutineMap(routinesResult.value, catalog, fallback?.routines)
      : fallback?.routines ?? createEmptyRoutineMap()

  return {
    user,
    onboardingData: mergeRemoteOnboardingData(user, routines, fallback),
  }
}

export function saveRemoteProfileDraft(account: Account, profile: OnboardingProfileDraft) {
  return updateMyProfile(account.accessToken, buildUserUpdatePayload(account.email, profile, false))
}

export async function saveRemoteOnboarding(account: Account, data: OnboardingData) {
  await updateMyProfile(account.accessToken, buildUserUpdatePayload(account.email, data.profile, false))

  const catalog = await fetchExercises(account.accessToken)
  const { payload, unresolvedExercises } = routineMapToApiPayload(data.routines, catalog)

  if (unresolvedExercises.length > 0) {
    throw new Error(formatUnresolvedExercises(unresolvedExercises))
  }

  await saveMyRoutines(account.accessToken, payload)
  await completeMyOnboarding(account.accessToken)
}

export async function saveRemoteRoutines(account: Account, data: OnboardingData) {
  await updateMyProfile(account.accessToken, buildUserUpdatePayload(account.email, data.profile, true))

  const catalog = await fetchExercises(account.accessToken)
  const { payload, unresolvedExercises } = routineMapToApiPayload(data.routines, catalog)

  if (unresolvedExercises.length > 0) {
    throw new Error(formatUnresolvedExercises(unresolvedExercises))
  }

  await saveMyRoutines(account.accessToken, payload)
}
