"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AuthScreen from "@/components/auth-screen"
import { createInitialProteinState } from "@/lib/app-config"
import {
  createEmptyOnboardingDraft,
  isProfileDraftComplete,
  isValidEmail,
  isValidPassword,
  readPersistedState,
  writePersistedState,
} from "@/lib/session"

type AuthMode = "signup" | "login"

export default function AuthRoute({ authMode }: { authMode: AuthMode }) {
  const router = useRouter()
  const [hasHydrated, setHasHydrated] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [authError, setAuthError] = useState("")
  const [showSignupErrors, setShowSignupErrors] = useState(false)

  useEffect(() => {
    const persisted = readPersistedState()
    if (persisted.account && persisted.onboardingData && persisted.onboarded) {
      router.replace("/")
      return
    }

    if (authMode === "login" && persisted.account?.email) {
      setEmail(persisted.account.email)
    }

    setHasHydrated(true)
  }, [authMode, router])

  useEffect(() => {
    setAuthError("")
  }, [authMode, email, password, confirmPassword])

  useEffect(() => {
    setShowSignupErrors(false)
  }, [authMode])

  const hideSignupErrorsOnEdit = () => {
    if (authMode === "signup" && showSignupErrors) {
      setShowSignupErrors(false)
    }
  }

  const handleEmailChange = (value: string) => {
    hideSignupErrorsOnEdit()
    setEmail(value)
  }

  const handlePasswordChange = (value: string) => {
    hideSignupErrorsOnEdit()
    setPassword(value)
  }

  const handleConfirmPasswordChange = (value: string) => {
    hideSignupErrorsOnEdit()
    setConfirmPassword(value)
  }

  const emailError =
    (authMode === "signup" ? showSignupErrors : email.trim().length > 0) && !isValidEmail(email)
      ? "이메일 형식으로 입력해 주세요."
      : ""
  const passwordError =
    authMode === "signup" && showSignupErrors && !isValidPassword(password)
      ? "비밀번호는 6자 이상, 특수문자를 포함해야 합니다."
      : authMode === "login" && password.length > 0 && password.length < 6
        ? "비밀번호를 6자 이상 입력해 주세요."
      : ""
  const confirmPasswordError =
    authMode === "signup" &&
    showSignupErrors &&
    password !== confirmPassword
      ? "비밀번호가 일치하지 않습니다."
      : ""

  const canSignup =
    isValidEmail(email) &&
    isValidPassword(password) &&
    confirmPassword.length >= 6 &&
    password === confirmPassword
  const canLogin = isValidEmail(email) && password.length >= 6

  const handleSubmit = () => {
    const persisted = readPersistedState()

    if (authMode === "signup") {
      setShowSignupErrors(true)
      if (!canSignup) {
        return
      }

      writePersistedState({
        ...persisted,
        account: {
          email: email.trim(),
          password,
        },
        onboardingData: null,
        onboarded: false,
        proteinState: createInitialProteinState(),
        onboardingDraft: createEmptyOnboardingDraft(),
      })
      router.push("/onboarding/profile")
      return
    }

    if (!canLogin) {
      return
    }

    if (!persisted.account || persisted.account.email !== email.trim() || persisted.account.password !== password) {
      setAuthError("이메일 또는 비밀번호를 확인해 주세요.")
      return
    }

    setAuthError("")
    if (persisted.onboardingData) {
      router.push("/")
      return
    }

    if (persisted.onboardingDraft && isProfileDraftComplete(persisted.onboardingDraft.profile)) {
      router.push("/onboarding/routine")
      return
    }

    router.push("/onboarding/profile")
  }

  if (!hasHydrated) {
    return <div className="min-h-svh bg-[#FFFFFF]" />
  }

  return (
    <AuthScreen
      authError={authError}
      authMode={authMode}
      canSubmit={authMode === "signup" ? true : canLogin}
      confirmPassword={confirmPassword}
      confirmPasswordError={confirmPasswordError}
      email={email}
      emailError={emailError}
      onConfirmPasswordChange={handleConfirmPasswordChange}
      onEmailChange={handleEmailChange}
      onPasswordChange={handlePasswordChange}
      onSubmit={handleSubmit}
      onToggleMode={() => router.push(authMode === "signup" ? "/login" : "/signup")}
      password={password}
      passwordError={passwordError}
    />
  )
}
