import type { Metadata } from "next"
import { cookies } from "next/headers"
import HomeRoute from "@/components/home-route"
import PreviewAppRoute from "@/components/preview-app-route"
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site-config"

const ACCESS_TOKEN_COOKIE_KEY = "gunyoil_access_token"

export const metadata: Metadata = {
  title: {
    absolute: SITE_TITLE,
  },
  description: SITE_DESCRIPTION,
}

export default async function HomePage() {
  const cookieStore = await cookies()
  const hasAccessToken = Boolean(cookieStore.get(ACCESS_TOKEN_COOKIE_KEY)?.value)

  if (!hasAccessToken) {
    return <PreviewAppRoute />
  }

  return <HomeRoute />
}
