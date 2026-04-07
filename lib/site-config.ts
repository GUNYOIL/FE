function normalizeUrl(value: string | undefined) {
  if (!value) {
    return null
  }

  const withProtocol = /^https?:\/\//.test(value) ? value : `https://${value}`
  return withProtocol.replace(/\/+$/, "")
}

export const SITE_URL =
  normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
  normalizeUrl(process.env.SITE_URL) ??
  normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
  normalizeUrl(process.env.VERCEL_URL) ??
  "http://localhost:3000"
export const SITE_METADATA_BASE = new URL(SITE_URL)
export const SITE_NAME = "근요일"
export const SITE_TITLE = "근요일 | 교내 운동 루틴·기록·단백질 관리"
export const SITE_DESCRIPTION = "근요일은 교내 헬스장 환경에 맞춘 운동 루틴, 오늘 기록, 급식 기반 단백질 관리, 운동 잔디를 한 번에 정리하는 서비스입니다."
export const SITE_KEYWORDS = [
  "근요일",
  "운동 루틴",
  "운동 기록",
  "단백질 관리",
  "운동 잔디",
  "급식 단백질",
  "교내 헬스장",
  "PWA",
]
export const SITE_OG_IMAGE = `${SITE_URL}/icon-512.svg`
