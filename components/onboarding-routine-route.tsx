"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import OnboardingScreen from "@/components/onboarding-screen"
import { createEmptyRoutineMap } from "@/lib/app-config"
import { apiUserToOnboardingProfileDraft } from "@/lib/api-adapters"
import { loadRemoteOnboardingState, saveRemoteOnboarding } from "@/lib/api-sync"
import { ApiError } from "@/lib/api-client"
import {
  clearPersistedAccount,
  createEmptyOnboardingProfileDraft,
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
      router.replace("/signup")
      return
    }

    if (persisted.onboardingData && persisted.onboarded) {
      router.replace("/")
      return
    }

    if (!persisted.onboardingDraft || !isProfileDraftComplete(persisted.onboardingDraft.profile)) {
      router.replace("/onboarding/profile")
      return
    }

    setProfileDraft(persisted.onboardingDraft.profile)
    setRoutines(persisted.onboardingDraft.routines)
    setHasHydrated(true)

    void loadRemoteOnboardingState(persisted.account, persisted.onboardingData)
      .then((remote) => {
        if (isCancelled) {
          return
        }

        if (remote.user.onboarding_completed) {
          router.replace("/")
          return
        }

        if (!persisted.onboardingDraft) {
          setProfileDraft(apiUserToOnboardingProfileDraft(remote.user))
        }

        if (remote.onboardingData) {
          setProfileDraft({
            gender: remote.onboardingData.profile.gender,
            height: String(remote.onboardingData.profile.height),
            weight: String(remote.onboardingData.profile.weight),
            goal: remote.onboardingData.profile.goal,
          })
          setRoutines(remote.onboardingData.routines)
        }
      })
      .catch((error) => {
        if (isCancelled) {
          return
        }

        if (error instanceof ApiError && error.status === 401) {
          writePersistedState(clearPersistedAccount(persisted))
          router.replace("/login")
        }
      })

    return () => {
      isCancelled = true
    }
  }, [router])

  if (!hasHydrated) {
    return <div className="min-h-svh bg-[#FFFFFF]" />
  }

  return (
    <OnboardingScreen
      initialProfile={profileDraft}
      initialRoutines={routines}
      initialStep={2}
      onBackToProfile={() => router.push("/onboarding/profile")}
      onComplete={(data) => {
        const persisted = readPersistedState()
        if (!persisted.account) {
          router.replace("/signup")
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
