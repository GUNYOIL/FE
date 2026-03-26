"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import OnboardingScreen from "@/components/onboarding-screen"
import { createEmptyRoutineMap } from "@/lib/app-config"
import {
  createEmptyOnboardingProfileDraft,
  readPersistedState,
  type OnboardingProfileDraft,
  writePersistedState,
} from "@/lib/session"

export default function OnboardingProfileRoute() {
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

    if (persisted.onboardingDraft) {
      setProfileDraft(persisted.onboardingDraft.profile)
      setRoutines(persisted.onboardingDraft.routines)
    }

    setHasHydrated(true)
  }, [router])

  if (!hasHydrated) {
    return <div className="min-h-svh bg-[#FFFFFF]" />
  }

  return (
    <OnboardingScreen
      initialProfile={profileDraft}
      initialRoutines={routines}
      initialStep={1}
      onComplete={() => undefined}
      onExit={() => router.push("/signup")}
      onProfileNext={(nextProfile, nextRoutines) => {
        const persisted = readPersistedState()
        if (!persisted.account) {
          router.replace("/signup")
          return
        }

        writePersistedState({
          ...persisted,
          onboardingData: null,
          onboarded: false,
          onboardingDraft: {
            profile: nextProfile,
            routines: nextRoutines,
          },
        })
        router.push("/onboarding/routine")
      }}
    />
  )
}
