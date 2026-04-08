"use client"

import { useState } from "react"
import AppShell from "@/components/app-shell"
import { createPreviewOnboardingData, createPreviewProteinState } from "@/lib/app-preview"

export default function PreviewAppRoute() {
  const [onboardingData, setOnboardingData] = useState(() => createPreviewOnboardingData())
  const [proteinState, setProteinState] = useState(() => createPreviewProteinState())

  return (
    <AppShell
      account={null}
      onboardingData={onboardingData}
      onOnboardingDataChange={setOnboardingData}
      previewMode
      proteinState={proteinState}
      setProteinState={setProteinState}
    />
  )
}
