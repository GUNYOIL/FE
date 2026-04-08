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
const ACCESS_TOKEN_COOKIE_KEY = "gunyoil_access_token"
const REFRESH_TOKEN_COOKIE_KEY = "gunyoil_refresh_token"
const ACCOUNT_EMAIL_COOKIE_KEY = "gunyoil_account_email"
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

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

function normalizeAccount(value: unknown): Account | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const candidate = value as Partial<Account>
  if (typeof candidate.email !== "string" || typeof candidate.accessToken !== "string") {
    return null
  }

  return {
    email: candidate.email,
    accessToken: candidate.accessToken,
    refreshToken: typeof candidate.refreshToken === "string" ? candidate.refreshToken : null,
  }
}

function getCookieAttributes(maxAge: number) {
  const attributes = [`Path=/`, `Max-Age=${maxAge}`, `SameSite=Lax`]

  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    attributes.push("Secure")
  }

  return attributes.join("; ")
}

function writeCookie(name: string, value: string, maxAge = COOKIE_MAX_AGE_SECONDS) {
  if (typeof document === "undefined") {
    return
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; ${getCookieAttributes(maxAge)}`
}

function clearCookie(name: string) {
  if (typeof document === "undefined") {
    return
  }

  document.cookie = `${name}=; ${getCookieAttributes(0)}`
}

function readCookieMap() {
  if (typeof document === "undefined") {
    return new Map<string, string>()
  }

  return document.cookie.split("; ").reduce((accumulator, pair) => {
    if (!pair) {
      return accumulator
    }

    const separatorIndex = pair.indexOf("=")
    if (separatorIndex < 0) {
      return accumulator
    }

    const key = pair.slice(0, separatorIndex)
    const value = pair.slice(separatorIndex + 1)
    accumulator.set(key, decodeURIComponent(value))
    return accumulator
  }, new Map<string, string>())
}

function readPersistedAccountFromCookies() {
  const cookies = readCookieMap()
  const email = cookies.get(ACCOUNT_EMAIL_COOKIE_KEY)
  const accessToken = cookies.get(ACCESS_TOKEN_COOKIE_KEY)
  const refreshToken = cookies.get(REFRESH_TOKEN_COOKIE_KEY) ?? null

  if (!email || !accessToken) {
    return null
  }

  return {
    email,
    accessToken,
    refreshToken,
  } satisfies Account
}

function writePersistedAccountToCookies(account: Account | null) {
  if (!account) {
    clearCookie(ACCOUNT_EMAIL_COOKIE_KEY)
    clearCookie(ACCESS_TOKEN_COOKIE_KEY)
    clearCookie(REFRESH_TOKEN_COOKIE_KEY)
    return
  }

  writeCookie(ACCOUNT_EMAIL_COOKIE_KEY, account.email)
  writeCookie(ACCESS_TOKEN_COOKIE_KEY, account.accessToken)

  if (account.refreshToken) {
    writeCookie(REFRESH_TOKEN_COOKIE_KEY, account.refreshToken)
  } else {
    clearCookie(REFRESH_TOKEN_COOKIE_KEY)
  }
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
    onboardingData: null,
    onboarded: false,
  }
}

export function clearPersistedSession() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(STORAGE_KEY)
  writePersistedAccountToCookies(null)
}

function isGoalKey(value: unknown): value is GoalKey {
  return GOAL_OPTIONS.some((option) => option.key === value)
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

export function hasPersistedSessionMarker() {
  if (typeof window === "undefined") {
    return false
  }

  return Boolean(window.localStorage.getItem(STORAGE_KEY))
}

export function readPersistedState(): PersistedState {
  if (typeof window === "undefined") {
    return DEFAULT_PERSISTED_STATE
  }

  const accountFromCookies = readPersistedAccountFromCookies()

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      if (accountFromCookies) {
        writePersistedAccountToCookies(null)
      }

      return {
        ...DEFAULT_PERSISTED_STATE,
        account: null,
      }
    }

    const parsed = JSON.parse(raw) as Partial<PersistedState>
    const legacyAccount = normalizeAccount(parsed.account)
    const account = accountFromCookies ?? legacyAccount
    const onboardingDraft = normalizeOnboardingDraft(parsed.onboardingDraft)
    const proteinState = isProteinState(parsed.proteinState) ? parsed.proteinState : createInitialProteinState()

    if (!accountFromCookies && legacyAccount) {
      writePersistedAccountToCookies(legacyAccount)

      const { account: _legacyAccount, ...rest } = parsed
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
    }

    return {
      account,
      onboardingData: null,
      onboarded: Boolean(parsed.onboarded),
      proteinState,
      onboardingDraft,
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    writePersistedAccountToCookies(null)
    return {
      ...DEFAULT_PERSISTED_STATE,
      account: null,
    }
  }
}

export function writePersistedState(state: PersistedState) {
  if (typeof window === "undefined") {
    return
  }

  writePersistedAccountToCookies(state.account)
  const { account: _account, onboardingData: _onboardingData, ...rest } = state

  if (!state.account && !rest.onboardingDraft && !rest.onboarded) {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
}
