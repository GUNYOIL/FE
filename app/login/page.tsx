import type { Metadata } from "next"
import AuthRoute from "@/components/auth-route"

export const metadata: Metadata = {
  title: "로그인",
  description: "근요일 로그인",
  robots: {
    index: false,
    follow: false,
  },
}

export default function LoginPage() {
  return <AuthRoute authMode="login" />
}
