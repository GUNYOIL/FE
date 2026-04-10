"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import OnboardingScreen from "@/components/onboarding-screen"
import { createEmptyRoutineMap } from "@/lib/app-config"
import { apiUserToOnboardingProfileDraft, isApiProfileComplete } from "@/lib/api-adapters"
import { loadRemoteOnboardingState, saveRemoteOnboarding } from "@/lib/api-sync"
import { AUTH_ERROR_EVENT, ApiError, isAuthErrorStatus } from "@/lib/api-client"
import { removePushTokenRegistration } from "@/lib/push-notifications"
import {
  clearPersistedSession,
  createEmptyOnboardingProfileDraft,
  hasPersistedSessionMarker,
  isProfileDraftComplete,
  readPersistedState,
  type OnboardingProfileDraft,
  writePersistedState,
} from "@/lib/session"

export default function OnboardingRoutineRoute() {
  const router = useRouter()
  const [hasHydrated, setHasHydrated] = useState(false)
  const [profileDraft, setProfileDraft] = useState<OnboardingProfileDraft>(createEmptyOnboardingProfileDraft())
  const [routines, setRoutines] = useState(createEmptyRoutineMap())

  useEffect(() => {
    const persisted = readPersistedState()
    let isCancelled = false

    if (!persisted.account) {
      router.replace("/login")
      return
    }

    if (persisted.onboardingDraft && isProfileDraftComplete(persisted.onboardingDraft.profile)) {
      setProfileDraft(persisted.onboardingDraft.profile)
      setRoutines(persisted.onboardingDraft.routines)
      setHasHydrated(true)
    }

    void loadRemoteOnboardingState(persisted.account)
      .then((remote) => {
        if (isCancelled) {
          return
        }

        if (remote.user.onboarding_completed) {
          router.replace("/")
          return
        }

        if (remote.onboardingData) {
          setProfileDraft({
            gender: remote.onboardingData.profile.gender,
            height: String(remote.onboardingData.profile.height),
            weight: String(remote.onboardingData.profile.weight),
            goal: remote.onboardingData.profile.goal,
          })
          setRoutines(remote.onboardingData.routines)
          setHasHydrated(true)
          return
        }

        if (isApiProfileComplete(remote.user)) {
          setProfileDraft(apiUserToOnboardingProfileDraft(remote.user))
          setRoutines(persisted.onboardingDraft?.routines ?? createEmptyRoutineMap())
          setHasHydrated(true)
          return
        }

        router.replace("/onboarding/profile")
      })
      .catch((error) => {
        if (isCancelled) {
          return
        }

        if (error instanceof ApiError && isAuthErrorStatus(error.status)) {
          void removePushTokenRegistration(persisted.account?.accessToken ?? null)
          clearPersistedSession()
          router.replace("/login")
        }
      })

    return () => {
      isCancelled = true
    }
  }, [router])

  useEffect(() => {
    if (!hasHydrated) {
      return
    }

    const handleSessionInvalidation = () => {
      if (hasPersistedSessionMarker()) {
        return
      }

      const persisted = readPersistedState()
      void removePushTokenRegistration(persisted.account?.accessToken ?? null)
      clearPersistedSession()
      router.replace("/login")
    }

    const handleAuthError = (event: Event) => {
      const detail = (event as CustomEvent<{ status?: number }>).detail

      if (!detail || !isAuthErrorStatus(detail.status ?? 0)) {
        return
      }

      const persisted = readPersistedState()
      void removePushTokenRegistration(persisted.account?.accessToken ?? null)
      clearPersistedSession()
      router.replace("/login")
    }

    const intervalId = window.setInterval(handleSessionInvalidation, 1000)
    window.addEventListener("focus", handleSessionInvalidation)
    document.addEventListener("visibilitychange", handleSessionInvalidation)
    window.addEventListener(AUTH_ERROR_EVENT, handleAuthError)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener("focus", handleSessionInvalidation)
      document.removeEventListener("visibilitychange", handleSessionInvalidation)
      window.removeEventListener(AUTH_ERROR_EVENT, handleAuthError)
    }
  }, [hasHydrated, router])

  if (!hasHydrated) {
    return <div className="min-h-svh bg-[#FFFFFF]" />
  }

  const screenKey = JSON.stringify({
    step: 2,
    profileDraft,
    routines,
  })

  return (
    <OnboardingScreen
      key={screenKey}
      initialProfile={profileDraft}
      initialRoutines={routines}
      initialStep={2}
      onBackToProfile={() => router.push("/onboarding/profile")}
      onComplete={(data) => {
        const persisted = readPersistedState()
        if (!persisted.account) {
          router.replace("/login")
          return
        }

        writePersistedState({
          ...persisted,
          onboardingData: data,
          onboarded: true,
          onboardingDraft: null,
        })

        void saveRemoteOnboarding(persisted.account, data).catch((error) => {
          console.error("Failed to sync onboarding completion", error)
        })
        router.push("/")
      }}
      onExit={() => router.push("/signup")}
    />
  )
}
