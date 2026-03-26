"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AppShell from "@/components/app-shell"
import { createInitialProteinState, type OnboardingData, type ProteinState } from "@/lib/app-config"
import { isProfileDraftComplete, readPersistedState, type Account, writePersistedState } from "@/lib/session"

export default function HomeRoute() {
  const router = useRouter()
  const [hasHydrated, setHasHydrated] = useState(false)
  const [account, setAccount] = useState<Account | null>(null)
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null)
  const [proteinState, setProteinState] = useState<ProteinState>(createInitialProteinState())

  useEffect(() => {
    const persisted = readPersistedState()

    if (!persisted.account) {
      router.replace("/signup")
      return
    }

    if (persisted.onboardingData) {
      setAccount(persisted.account)
      setOnboardingData(persisted.onboardingData)
      setProteinState(persisted.proteinState)
      setHasHydrated(true)

      if (!persisted.onboarded) {
        writePersistedState({
          ...persisted,
          onboarded: true,
        })
      }
      return
    }

    if (persisted.onboardingDraft) {
      router.replace(isProfileDraftComplete(persisted.onboardingDraft.profile) ? "/onboarding/routine" : "/onboarding/profile")
      return
    }

    router.replace("/login")
  }, [router])

  useEffect(() => {
    if (!hasHydrated || !account || !onboardingData) {
      return
    }

    writePersistedState({
      account,
      onboardingData,
      onboarded: true,
      proteinState,
      onboardingDraft: null,
    })
  }, [account, hasHydrated, onboardingData, proteinState])

  if (!hasHydrated || !onboardingData) {
    return <div className="min-h-svh bg-[#FFFFFF]" />
  }

  return (
    <AppShell
      onboardingData={onboardingData}
      onOnboardingDataChange={setOnboardingData}
      proteinState={proteinState}
      setProteinState={setProteinState}
    />
  )
}
