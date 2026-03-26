"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import OnboardingScreen from "@/components/onboarding-screen"
import { createEmptyRoutineMap } from "@/lib/app-config"
import {
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
        router.push("/")
      }}
      onExit={() => router.push("/signup")}
    />
  )
}
