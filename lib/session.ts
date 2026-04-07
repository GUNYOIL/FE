import {
  GOAL_OPTIONS,
  calculateProteinTarget,
  createEmptyRoutineMap,
  createInitialProteinState,
  normalizeRoutineMap,
  type GoalKey,
  type OnboardingData,
  type ProteinState,
  type RoutineMap,
  type Gender,
} from "@/lib/app-config"

export const STORAGE_KEY = "gunyoil-vercel-shell-v2"

export type Account = {
  email: string
  accessToken: string
  refreshToken: string | null
}

export type OnboardingProfileDraft = {
  gender: Gender | ""
  height: string
  weight: string
  goal: GoalKey
}

export type OnboardingDraft = {
  profile: OnboardingProfileDraft
  routines: RoutineMap
}

export type PersistedState = {
  account: Account | null
  onboardingData: OnboardingData | null
  onboarded: boolean
  proteinState: ProteinState
  onboardingDraft: OnboardingDraft | null
}

const DEFAULT_PERSISTED_STATE: PersistedState = {
  account: null,
  onboardingData: null,
  onboarded: false,
  proteinState: createInitialProteinState(),
  onboardingDraft: null,
}

export function createEmptyOnboardingProfileDraft(): OnboardingProfileDraft {
  return {
    gender: "",
    height: "",
    weight: "",
    goal: "muscle_gain",
  }
}

export function createEmptyOnboardingDraft(): OnboardingDraft {
  return {
    profile: createEmptyOnboardingProfileDraft(),
    routines: createEmptyRoutineMap(),
  }
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function hasSpecialCharacter(value: string) {
  return /[^A-Za-z0-9]/.test(value)
}

export function isValidPassword(password: string) {
  return password.length >= 6 && hasSpecialCharacter(password)
}

export function clearPersistedAccount(state: PersistedState): PersistedState {
  return {
    ...state,
    account: null,
  }
}

function isGoalKey(value: unknown): value is GoalKey {
  return GOAL_OPTIONS.some((option) => option.key === value)
}

function isOnboardingData(value: unknown): value is OnboardingData {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Partial<OnboardingData>
  return Boolean(candidate.profile && candidate.routines)
}

function normalizeOnboardingData(data: OnboardingData): OnboardingData {
  return {
    profile: {
      ...data.profile,
      proteinTarget: calculateProteinTarget(data.profile.weight, data.profile.goal),
    },
    routines: normalizeRoutineMap(data.routines),
  }
}

function isProteinState(value: unknown): value is ProteinState {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Partial<ProteinState>
  return Array.isArray(candidate.cafeteria) && Array.isArray(candidate.log) && typeof candidate.quickCounts === "object"
}

function normalizeOnboardingProfileDraft(value: unknown): OnboardingProfileDraft {
  if (!value || typeof value !== "object") {
    return createEmptyOnboardingProfileDraft()
  }

  const candidate = value as Partial<OnboardingProfileDraft>
  return {
    gender: candidate.gender === "male" || candidate.gender === "female" ? candidate.gender : "",
    height: typeof candidate.height === "string" ? candidate.height : "",
    weight: typeof candidate.weight === "string" ? candidate.weight : "",
    goal: isGoalKey(candidate.goal) ? candidate.goal : "muscle_gain",
  }
}

function normalizeOnboardingDraft(value: unknown): OnboardingDraft | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const candidate = value as Partial<OnboardingDraft>
  return {
    profile: normalizeOnboardingProfileDraft(candidate.profile),
    routines: normalizeRoutineMap(candidate.routines),
  }
}

export function isProfileDraftComplete(profile: OnboardingProfileDraft) {
  return (profile.gender === "male" || profile.gender === "female") && Number(profile.height) > 0 && Number(profile.weight) > 0
}

export function toOnboardingData(draft: OnboardingDraft): OnboardingData | null {
  if (!isProfileDraftComplete(draft.profile) || (draft.profile.gender !== "male" && draft.profile.gender !== "female")) {
    return null
  }

  return {
    profile: {
      gender: draft.profile.gender,
      height: Number(draft.profile.height),
      weight: Number(draft.profile.weight),
      goal: draft.profile.goal,
      proteinTarget: calculateProteinTarget(Number(draft.profile.weight), draft.profile.goal),
    },
    routines: normalizeRoutineMap(draft.routines),
  }
}

export function readPersistedState(): PersistedState {
  if (typeof window === "undefined") {
    return DEFAULT_PERSISTED_STATE
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return DEFAULT_PERSISTED_STATE
    }

    const parsed = JSON.parse(raw) as Partial<PersistedState>
    const account =
      parsed.account &&
      typeof parsed.account.email === "string" &&
      typeof parsed.account.accessToken === "string"
        ? {
            email: parsed.account.email,
            accessToken: parsed.account.accessToken,
            refreshToken: typeof parsed.account.refreshToken === "string" ? parsed.account.refreshToken : null,
          }
        : null
    const onboardingData = isOnboardingData(parsed.onboardingData) ? normalizeOnboardingData(parsed.onboardingData) : null
    const onboardingDraft = normalizeOnboardingDraft(parsed.onboardingDraft)
    const proteinState = isProteinState(parsed.proteinState) ? parsed.proteinState : createInitialProteinState()

    return {
      account,
      onboardingData,
      onboarded: Boolean(parsed.onboarded && onboardingData),
      proteinState,
      onboardingDraft,
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return DEFAULT_PERSISTED_STATE
  }
}

export function writePersistedState(state: PersistedState) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
