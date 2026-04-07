"use client"

import { startTransition, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AppShell from "@/components/app-shell"
import { createInitialProteinState, type OnboardingData, type ProteinState } from "@/lib/app-config"
import { loadRemoteOnboardingState, saveRemoteRoutines } from "@/lib/api-sync"
import { ApiError } from "@/lib/api-client"
import { clearPersistedAccount, isProfileDraftComplete, readPersistedState, type Account, writePersistedState } from "@/lib/session"

export default function HomeRoute() {
  const router = useRouter()
  const [hasHydrated, setHasHydrated] = useState(false)
  const [account, setAccount] = useState<Account | null>(null)
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null)
  const [proteinState, setProteinState] = useState<ProteinState>(createInitialProteinState())

  useEffect(() => {
    const persisted = readPersistedState()
    let isCancelled = false

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
    }

    void loadRemoteOnboardingState(persisted.account, persisted.onboardingData)
      .then((remote) => {
        if (isCancelled) {
          return
        }

        if (remote.onboardingData) {
          startTransition(() => {
            setAccount(persisted.account)
            setOnboardingData(remote.onboardingData)
            setProteinState(persisted.proteinState)
            setHasHydrated(true)
          })

          writePersistedState({
            ...persisted,
            onboardingData: remote.onboardingData,
            onboarded: remote.user.onboarding_completed || persisted.onboarded,
          })
          return
        }

        if (persisted.onboardingDraft) {
          router.replace(isProfileDraftComplete(persisted.onboardingDraft.profile) ? "/onboarding/routine" : "/onboarding/profile")
          return
        }

        router.replace("/onboarding/profile")
      })
      .catch((error) => {
        if (isCancelled) {
          return
        }

        if (error instanceof ApiError && error.status === 401) {
          writePersistedState(clearPersistedAccount(persisted))
          router.replace("/login")
          return
        }

        if (persisted.onboardingData) {
          return
        }

        if (persisted.onboardingDraft) {
          router.replace(isProfileDraftComplete(persisted.onboardingDraft.profile) ? "/onboarding/routine" : "/onboarding/profile")
          return
        }

        router.replace("/login")
      })

    return () => {
      isCancelled = true
    }
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
      onOnboardingDataChange={(nextData) => {
        setOnboardingData(nextData)

        if (account) {
          void saveRemoteRoutines(account, nextData).catch((error) => {
            console.error("Failed to sync routines with backend", error)
          })
        }
      }}
      proteinState={proteinState}
      setProteinState={setProteinState}
    />
  )
}
