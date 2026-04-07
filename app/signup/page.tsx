import type { Metadata } from "next"
import AuthRoute from "@/components/auth-route"

export const metadata: Metadata = {
  title: "회원가입",
  description: "근요일 회원가입",
  robots: {
    index: false,
    follow: false,
  },
}

export default function SignupPage() {
  return <AuthRoute authMode="signup" />
}
