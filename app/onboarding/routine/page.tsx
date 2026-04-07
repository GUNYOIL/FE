import type { Metadata } from "next"
import OnboardingRoutineRoute from "@/components/onboarding-routine-route"

export const metadata: Metadata = {
  title: "루틴 설정",
  robots: {
    index: false,
    follow: false,
  },
}

export default function OnboardingRoutinePage() {
  return <OnboardingRoutineRoute />
}
