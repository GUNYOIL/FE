import type { Metadata } from "next"
import OnboardingProfileRoute from "@/components/onboarding-profile-route"

export const metadata: Metadata = {
  title: "프로필 설정",
  robots: {
    index: false,
    follow: false,
  },
}

export default function OnboardingProfilePage() {
  return <OnboardingProfileRoute />
}
