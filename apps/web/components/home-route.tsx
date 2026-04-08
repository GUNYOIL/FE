"use client"

import { startTransition, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AppShell from "@/components/app-shell"
import { AppShellSkeleton } from "@/components/loading-skeletons"
import { createInitialProteinState, type OnboardingData, type ProteinState } from "@/lib/app-config"
import { loadRemoteOnboardingState, saveRemoteRoutines } from "@/lib/api-sync"
import { AUTH_ERROR_EVENT, ApiError, isAuthErrorStatus } from "@/lib/api-client"
import { clearPersistedSession, hasPersistedSessionMarker, isProfileDraftComplete, readPersistedState, type Account, writePersistedState } from "@/lib/session"

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
      router.replace("/login")
      return
    }

    const persistedAccount = persisted.account

    setAccount(persistedAccount)
    setProteinState(persisted.proteinState)

    void loadRemoteOnboardingState(persistedAccount)
      .then((remote) => {
        if (isCancelled) {
          return
        }

        if (remote.onboardingData) {
          const nextAccount = {
            ...persistedAccount,
            email: remote.user.email || persistedAccount.email,
          }

          startTransition(() => {
            setAccount(nextAccount)
            setOnboardingData(remote.onboardingData)
            setProteinState(persisted.proteinState)
            setHasHydrated(true)
          })

          writePersistedState({
            ...persisted,
            account: nextAccount,
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

        if (error instanceof ApiError && isAuthErrorStatus(error.status)) {
          clearPersistedSession()
          router.replace("/login")
          return
        }

        if (persisted.onboardingDraft) {
          router.replace(isProfileDraftComplete(persisted.onboardingDraft.profile) ? "/onboarding/routine" : "/onboarding/profile")
          return
        }

        clearPersistedSession()
        router.replace("/login")
      })

    return () => {
      isCancelled = true
    }
  }, [router])

  useEffect(() => {
    if (!account) {
      return
    }

    const handleSessionInvalidation = () => {
      if (hasPersistedSessionMarker()) {
        return
      }

      clearPersistedSession()
      setAccount(null)
      setOnboardingData(null)
      router.replace("/login")
    }

    const handleAuthError = (event: Event) => {
      const detail = (event as CustomEvent<{ status?: number }>).detail

      if (!detail || !isAuthErrorStatus(detail.status ?? 0)) {
        return
      }

      clearPersistedSession()
      setAccount(null)
      setOnboardingData(null)
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
  }, [account, router])

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
    return <AppShellSkeleton />
  }

  return (
    <AppShell
      account={account}
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
