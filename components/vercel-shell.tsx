"use client"

import { useEffect, useState } from "react"
import AppShell from "@/components/app-shell"
import BrandMark from "@/components/brand-mark"
import OnboardingScreen from "@/components/onboarding-screen"
import { createInitialProteinState, normalizeRoutineMap, type OnboardingData, type ProteinState } from "@/lib/app-config"

const STORAGE_KEY = "gunyoil-vercel-shell-v2"

type AuthMode = "signup" | "login"

type Account = {
  email: string
  password: string
}

type PersistedState = {
  account: Account | null
  onboardingData: OnboardingData | null
  onboarded: boolean
  proteinState: ProteinState | null
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function hasSpecialCharacter(value: string) {
  return /[^A-Za-z0-9]/.test(value)
}

function isValidPassword(password: string) {
  return password.length >= 6 && hasSpecialCharacter(password)
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
    profile: data.profile,
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

function AuthScreen({
  authError,
  authMode,
  canSubmit,
  confirmPassword,
  email,
  onConfirmPasswordChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onToggleMode,
  password,
}: {
  authError: string
  authMode: AuthMode
  canSubmit: boolean
  confirmPassword: string
  email: string
  onConfirmPasswordChange: (value: string) => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: () => void
  onToggleMode: () => void
  password: string
}) {
  const emailError =
    authMode === "signup" && email.trim().length > 0 && !isValidEmail(email)
      ? "이메일 형식으로 입력해 주세요."
      : ""
  const passwordError =
    authMode === "signup" && password.length > 0 && !isValidPassword(password)
      ? "비밀번호는 6자 이상, 특수문자를 포함해야 합니다."
      : ""
  const confirmPasswordError =
    authMode === "signup" &&
    confirmPassword.length > 0 &&
    password.length > 0 &&
    password !== confirmPassword
      ? "비밀번호가 일치하지 않습니다."
      : ""

  return (
    <div className="mx-auto flex min-h-svh max-w-[480px] flex-col bg-[#F2F4F6]">
      <header className="sticky top-0 z-20 border-b border-[#E5E8EB] bg-[#FFFFFF] px-4 pt-safe-top">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandMark iconClassName="h-6 w-6 rounded-lg" textClassName="text-[17px] font-bold text-[#191F28]" />
            {authMode === "signup" ? (
              <span className="rounded-full bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-medium text-[#8B95A1]">
                1/3
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[360px]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8B95A1]">Account</p>
            <h1 className="mt-3 text-[28px] font-bold leading-[1.18] text-[#191F28]">
              {authMode === "signup" ? "회원가입" : "로그인"}
            </h1>
            <p className="mt-2 text-[14px] leading-6 text-[#8B95A1]">
              {authMode === "signup" ? "이메일과 비밀번호를 등록하고 바로 루틴 설정으로 넘어갑니다" : "저장한 계정으로 이어서 들어갑니다"}
            </p>
          </div>

          <div className="mt-7 rounded-[28px] border border-[#E5E8EB] bg-[#FFFFFF] p-5 shadow-[0_20px_36px_-32px_rgba(15,23,42,0.32)]">
            <div className="flex flex-col gap-4">
              <div>
                <input
                  aria-invalid={Boolean(emailError)}
                  autoComplete="email"
                  className="w-full rounded-2xl border border-[#E5E8EB] bg-[#F8FAFC] px-4 py-3.5 text-[15px] font-medium text-[#191F28] outline-none placeholder:text-[#8B95A1]"
                  onChange={(event) => onEmailChange(event.target.value)}
                  placeholder="이메일"
                  type="email"
                  value={email}
                />
                {emailError ? <p className="mt-2 text-[12px] font-medium text-[#F97316]">{emailError}</p> : null}
              </div>

              <div>
                <input
                  aria-invalid={Boolean(passwordError)}
                  autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                  className="w-full rounded-2xl border border-[#E5E8EB] bg-[#F8FAFC] px-4 py-3.5 text-[15px] font-medium text-[#191F28] outline-none placeholder:text-[#8B95A1]"
                  onChange={(event) => onPasswordChange(event.target.value)}
                  placeholder="비밀번호"
                  type="password"
                  value={password}
                />
                {passwordError ? <p className="mt-2 text-[12px] font-medium text-[#F97316]">{passwordError}</p> : null}
              </div>

              {authMode === "signup" ? (
                <div>
                  <input
                    aria-invalid={Boolean(confirmPasswordError)}
                    autoComplete="new-password"
                    className="w-full rounded-2xl border border-[#E5E8EB] bg-[#F8FAFC] px-4 py-3.5 text-[15px] font-medium text-[#191F28] outline-none placeholder:text-[#8B95A1]"
                    onChange={(event) => onConfirmPasswordChange(event.target.value)}
                    placeholder="비밀번호 확인"
                    type="password"
                    value={confirmPassword}
                  />
                  {confirmPasswordError ? (
                    <p className="mt-2 text-[12px] font-medium text-[#F97316]">{confirmPasswordError}</p>
                  ) : null}
                </div>
              ) : null}

              {authError ? <p className="text-[12px] font-medium text-[#F97316]">{authError}</p> : null}
            </div>

            <div className="mt-7 border-t border-[#F2F4F6] pt-4">
              <p className="mb-3 text-center text-[12px] text-[#8B95A1]">
                {authMode === "signup" ? "계정이 있다면? " : "계정이 없다면? "}
                <button className="font-semibold text-[#3182F6]" onClick={onToggleMode} type="button">
                  {authMode === "signup" ? "로그인" : "회원가입"}
                </button>
              </p>
              <button
                className={`w-full rounded-2xl py-3.5 text-[14px] font-semibold transition-opacity ${
                  canSubmit ? "bg-[#3182F6] text-white active:opacity-75" : "bg-[#E5E8EB] text-[#8B95A1]"
                }`}
                disabled={!canSubmit}
                onClick={onSubmit}
                type="button"
              >
                {authMode === "signup" ? "다음" : "로그인"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function VercelShell() {
  const [hasHydrated, setHasHydrated] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>("signup")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [authError, setAuthError] = useState("")
  const [account, setAccount] = useState<Account | null>(null)
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null)
  const [proteinState, setProteinState] = useState<ProteinState>(createInitialProteinState())
  const [isOnboarding, setIsOnboarding] = useState(false)
  const [isOnboarded, setIsOnboarded] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        setHasHydrated(true)
        return
      }

      const parsed = JSON.parse(stored) as Partial<PersistedState>

      if (
        parsed.account &&
        typeof parsed.account.email === "string" &&
        typeof parsed.account.password === "string"
      ) {
        setAccount(parsed.account)
      }

      if (isOnboardingData(parsed.onboardingData)) {
        setOnboardingData(normalizeOnboardingData(parsed.onboardingData))
      }

      if (isProteinState(parsed.proteinState)) {
        setProteinState(parsed.proteinState)
      }

      if (parsed.onboarded === true && isOnboardingData(parsed.onboardingData)) {
        setIsOnboarded(true)
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    } finally {
      setHasHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hasHydrated) {
      return
    }

    const snapshot: PersistedState = {
      account,
      onboardingData,
      onboarded: isOnboarded,
      proteinState,
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  }, [account, hasHydrated, isOnboarded, onboardingData, proteinState])

  const canSignup =
    isValidEmail(email) &&
    isValidPassword(password) &&
    confirmPassword.length >= 6 &&
    password === confirmPassword
  const canLogin = isValidEmail(email) && password.length >= 6

  const handleToggleMode = () => {
    setAuthMode((previous) => (previous === "signup" ? "login" : "signup"))
    setAuthError("")
    setPassword("")
    setConfirmPassword("")
  }

  const handleSubmit = () => {
    if (authMode === "signup") {
      if (!canSignup) {
        return
      }

      setAccount({
        email: email.trim(),
        password,
      })
      setOnboardingData(null)
      setProteinState(createInitialProteinState())
      setIsOnboarded(false)
      setIsOnboarding(true)
      setAuthError("")
      return
    }

    if (!canLogin) {
      return
    }

    if (!account || account.email !== email.trim() || account.password !== password) {
      setAuthError("이메일 또는 비밀번호를 확인해 주세요.")
      return
    }

    setAuthError("")
    if (onboardingData) {
      setIsOnboarded(true)
      setIsOnboarding(false)
      return
    }

    setIsOnboarding(true)
  }

  const handleCompleteOnboarding = (data: OnboardingData) => {
    setOnboardingData(normalizeOnboardingData(data))
    setIsOnboarding(false)
    setIsOnboarded(true)
  }

  if (!hasHydrated) {
    return <div className="min-h-svh bg-[#FFFFFF]" />
  }

  if (isOnboarded && onboardingData) {
    return (
      <AppShell
        onboardingData={onboardingData}
        onOnboardingDataChange={setOnboardingData}
        proteinState={proteinState}
        setProteinState={setProteinState}
      />
    )
  }

  if (isOnboarding) {
    return (
      <OnboardingScreen
        onComplete={handleCompleteOnboarding}
        onExit={() => {
          setIsOnboarding(false)
        }}
      />
    )
  }

  return (
    <AuthScreen
      authError={authError}
      authMode={authMode}
      canSubmit={authMode === "signup" ? canSignup : canLogin}
      confirmPassword={confirmPassword}
      email={email}
      onConfirmPasswordChange={setConfirmPassword}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
      onToggleMode={handleToggleMode}
      password={password}
    />
  )
}
