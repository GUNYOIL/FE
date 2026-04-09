"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react"
import { fetchFeaturedAnnouncement, fetchMyGrass } from "@/lib/api"
import { createPreviewGrassEntries } from "@/lib/app-preview"
import {
  DAY_META,
  formatBodyParts,
  getGoalOption,
  getTodayDayKey,
  hasWorkoutBodyParts,
  type ProteinState,
  type OnboardingData,
} from "@/lib/app-config"
import type { Account } from "@/lib/session"
import BrandMark from "./brand-mark"
import GuestAuthSheet from "./guest-auth-sheet"
import GuestProteinScreen from "./guest-protein-screen"
import GrassScreen from "./grass-screen"
import { MegaphoneIcon } from "./icons"
import PwaInstallPrompt from "./pwa-install-prompt"
import ProteinScreen from "./protein-screen"
import RoutineEditorScreen from "./routine-editor-screen"
import RoutineScreen from "./routine-screen"
import SupportInquiryFab from "./support-inquiry-fab"
import TodayScreen from "./today-screen"

type Tab = "오늘" | "루틴" | "잔디" | "단백질"

const TAB_QUERY_VALUES: Record<Tab, string> = {
  "오늘": "today",
  "루틴": "routine",
  "잔디": "grass",
  "단백질": "protein",
}

function parseTabQuery(value: string | null): Tab | null {
  if (!value) {
    return null
  }

  return TABS.find((tab) => TAB_QUERY_VALUES[tab.id] === value)?.id ?? null
}

const TABS: { id: Tab; icon: ReactNode; label: string }[] = [
  {
    id: "오늘",
    label: "오늘",
    icon: (
      <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
        <rect fill="none" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" width="14" x="3" y="4" />
        <path d="M7 2V5M13 2V5M3 8H17" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        <circle cx="7" cy="12" fill="currentColor" r="1" />
        <circle cx="10" cy="12" fill="currentColor" r="1" />
        <circle cx="13" cy="12" fill="currentColor" r="1" />
      </svg>
    ),
  },
  {
    id: "루틴",
    label: "루틴",
    icon: (
      <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 10H16M4 6H16M4 14H10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: "잔디",
    label: "잔디",
    icon: (
      <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
        <rect fill="currentColor" height="5" opacity="0.3" rx="1" width="5" x="3" y="3" />
        <rect fill="currentColor" height="5" opacity="0.6" rx="1" width="5" x="9" y="3" />
        <rect fill="currentColor" height="5" opacity="0.6" rx="1" width="5" x="3" y="9" />
        <rect fill="currentColor" height="5" rx="1" width="5" x="9" y="9" />
        <rect fill="currentColor" height="2" opacity="0.3" rx="0.5" width="2" x="15" y="3" />
        <rect fill="currentColor" height="2" opacity="0.6" rx="0.5" width="2" x="15" y="9" />
        <rect fill="currentColor" height="2" opacity="0.3" rx="0.5" width="2" x="3" y="15" />
        <rect fill="currentColor" height="2" rx="0.5" width="2" x="9" y="15" />
        <rect fill="currentColor" height="2" opacity="0.6" rx="0.5" width="2" x="15" y="15" />
      </svg>
    ),
  },
  {
    id: "단백질",
    label: "단백질",
    icon: (
      <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M10 3C7.2 3 5 5.2 5 8C5 10.2 6.3 12.1 8.2 12.8L8.5 16.5C8.5 16.8 8.7 17 9 17H11C11.3 17 11.5 16.8 11.5 16.5L11.8 12.8C13.7 12.1 15 10.2 15 8C15 5.2 12.8 3 10 3Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M8 8.5C8 7.7 8.9 7 10 7C11.1 7 12 7.7 12 8.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      </svg>
    ),
  },
]

export default function AppShell({
  account,
  onboardingData,
  onOnboardingDataChange,
  previewMode = false,
  proteinState,
  setProteinState,
}: {
  account?: Account | null
  onboardingData: OnboardingData
  onOnboardingDataChange: (nextData: OnboardingData) => void
  previewMode?: boolean
  proteinState: ProteinState
  setProteinState: Dispatch<SetStateAction<ProteinState>>
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const searchTab = parseTabQuery(searchParams.get("tab"))
  const [activeTab, setActiveTab] = useState<Tab>(searchTab ?? "오늘")
  const [isRoutineEditing, setIsRoutineEditing] = useState(false)
  const [authPromptDescription, setAuthPromptDescription] = useState<string | null>(null)
  const { profile, routines } = onboardingData
  const token = account?.accessToken ?? null
  const isGuestPreview = previewMode || !token
  const todayKey = getTodayDayKey()
  const todayRoutine = routines[todayKey]
  const goalOption = getGoalOption(profile.goal)
  const previewGrassEntries = useMemo(() => (isGuestPreview ? createPreviewGrassEntries() : undefined), [isGuestPreview])
  const announcementQuery = useQuery({
    queryKey: ["announcement"],
    queryFn: fetchFeaturedAnnouncement,
    staleTime: 60_000,
  })
  const featuredAnnouncement = announcementQuery.data
  const workingDays = DAY_META.filter((day) => {
    const routine = routines[day.key]
    return hasWorkoutBodyParts(routine.bodyParts)
  })
  const totalExercises = Object.values(routines).reduce((sum, routine) => sum + routine.exercises.length, 0)
  const currentDate = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date())

  const tabMeta = useMemo(
    () => ({
      "오늘": {
        helper: hasWorkoutBodyParts(todayRoutine.bodyParts)
          ? `${formatBodyParts(todayRoutine.bodyParts)} · 운동 ${todayRoutine.exercises.length}개`
          : "오늘 설정된 루틴이 없습니다",
      },
      "루틴": {
        helper: `운동일 ${workingDays.length}일 · 총 운동 ${totalExercises}개`,
      },
      "잔디": {
        helper: "주간 흐름과 연속 기록",
      },
      "단백질": {
        helper: `${profile.weight}kg · 목표 ${profile.proteinTarget}g`,
      },
    }),
    [profile.proteinTarget, profile.weight, todayKey, todayRoutine.bodyParts, todayRoutine.exercises.length, totalExercises, workingDays.length],
  )

  const activeMeta = tabMeta[activeTab]

  useEffect(() => {
    if (!searchTab) {
      if (activeTab !== "오늘") {
        setActiveTab("오늘")
      }
      return
    }

    if (searchTab === activeTab) {
      return
    }

    setActiveTab(searchTab)
  }, [activeTab, searchTab])

  const openAuthPrompt = (description: string) => {
    setAuthPromptDescription(description)
  }

  const prefetchTab = (tab: Tab) => {
    if (tab !== "잔디" || !token) {
      return
    }

    void queryClient.prefetchQuery({
      queryKey: ["grass", token],
      queryFn: () => fetchMyGrass(token),
      staleTime: 0,
    })
  }

  const handleTabChange = async (tab: Tab) => {
    if (tab === activeTab) {
      return
    }

    if (tab === "잔디" && token) {
      try {
        await queryClient.fetchQuery({
          queryKey: ["grass", token],
          queryFn: () => fetchMyGrass(token),
          staleTime: 0,
        })
      } catch {
        // Let the destination screen render its own error state if the refresh fails.
      }
    }

    setActiveTab(tab)

    const nextSearchParams = new URLSearchParams(searchParams.toString())
    if (tab === "오늘") {
      nextSearchParams.delete("tab")
    } else {
      nextSearchParams.set("tab", TAB_QUERY_VALUES[tab])
    }

    const nextQuery = nextSearchParams.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
  }

  if (isRoutineEditing) {
    return (
      <div
        className="relative bg-[#F2F4F6]"
        style={{
          height: "100svh",
          margin: "0 auto",
          maxWidth: 480,
        }}
      >
        <RoutineEditorScreen
          onBack={() => setIsRoutineEditing(false)}
          onSave={(nextRoutines) => {
            onOnboardingDataChange({
              ...onboardingData,
              routines: nextRoutines,
            })
            setIsRoutineEditing(false)
          }}
          profile={profile}
          routines={routines}
        />
        <SupportInquiryFab
          accountEmail={account?.email ?? null}
          bottomOffset="calc(1rem + env(safe-area-inset-bottom, 0px))"
          contextLabel="루틴 수정"
          onRequireAuth={openAuthPrompt}
          previewMode={isGuestPreview}
          token={token}
        />
      </div>
    )
  }

  return (
    <div
      className="relative flex flex-col bg-[#FFFFFF]"
      style={{
        height: "100svh",
        margin: "0 auto",
        maxWidth: 480,
      }}
    >
      <header className="shrink-0 border-b border-[#EEF1F4] bg-[rgba(255,255,255,0.94)] px-4 pt-safe-top backdrop-blur">
        <div className="flex h-14 items-center justify-between">
          <BrandMark iconClassName="h-7 w-7 rounded-[10px]" textClassName="text-[18px] font-bold text-[#191F28]" />
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#8B95A1]">{currentDate}</span>
            <span className="rounded-full bg-[#F2F4F6] px-3 py-1.5 text-[12px] font-semibold text-[#4E5968]">
              {goalOption.label}
            </span>
          </div>
        </div>
        <p className="pb-3 text-[12px] leading-5 text-[#8B95A1]">{activeMeta.helper}</p>
      </header>

      {featuredAnnouncement ? (
        <div className="shrink-0 border-b border-[#EEF1F4] bg-[#F8FBFF] px-4 py-3">
          <div className="flex items-center gap-2 text-[#3182F6]">
            <span className="flex items-center justify-center">
              <MegaphoneIcon size={15} />
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">공지</p>
          </div>
          <p className="mt-1 text-[14px] font-semibold text-[#191F28]">{featuredAnnouncement.title}</p>
          <p className="mt-1 text-[13px] leading-5 text-[#4E5968]">{featuredAnnouncement.content}</p>
        </div>
      ) : null}

      {isGuestPreview ? (
        <div className="shrink-0 border-b border-[#EEF1F4] bg-[#FCFDFE] px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-[#3182F6]">미리보기 모드</p>
              <p className="mt-1 text-[12px] leading-5 text-[#6B7684]">루틴 편집, 오늘 저장, 급식 기록은 로그인 후 내 데이터로 이어집니다.</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                className="rounded-full border border-[#D9E0E7] bg-[#FFFFFF] px-3 py-1.5 text-[12px] font-semibold text-[#4E5968]"
                href="/login"
              >
                로그인
              </Link>
              <Link className="rounded-full bg-[#191F28] px-3 py-1.5 text-[12px] font-semibold text-white" href="/signup">
                회원가입
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <main className="relative flex-1 overflow-hidden bg-[#F7F8FA]">
        <div className="absolute inset-0 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch" }}>
          {activeTab === "오늘" ? (
            <TodayScreen
              onRequireAuth={isGuestPreview ? openAuthPrompt : undefined}
              routines={routines}
              token={token}
            />
          ) : null}
          {activeTab === "루틴" ? (
            <RoutineScreen
              onEdit={() => {
                if (isGuestPreview) {
                  openAuthPrompt("루틴을 편집하고 요일별 운동을 저장하려면 로그인 또는 회원가입이 필요합니다.")
                  return
                }

                setIsRoutineEditing(true)
              }}
              routines={routines}
            />
          ) : null}
          {activeTab === "잔디" ? <GrassScreen previewEntries={previewGrassEntries} token={token} /> : null}
          {activeTab === "단백질" ? (
            isGuestPreview ? (
              <GuestProteinScreen
                onRequireAuth={openAuthPrompt}
                profile={profile}
                proteinState={proteinState}
                setProteinState={setProteinState}
              />
            ) : (
              <ProteinScreen profile={profile} proteinState={proteinState} setProteinState={setProteinState} token={token} />
            )
          ) : null}
        </div>
      </main>

      <PwaInstallPrompt />

      <div className="shrink-0 border-t border-[#EEF1F4] bg-[rgba(255,255,255,0.96)] px-2 pb-safe-bottom pt-1 backdrop-blur">
        <nav className="grid grid-cols-4" style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom, 0px))" }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                className="flex flex-col items-center justify-center gap-1 py-2.5 transition-all"
                onClick={() => {
                  void handleTabChange(tab.id)
                }}
                onFocus={() => prefetchTab(tab.id)}
                onMouseEnter={() => prefetchTab(tab.id)}
                onTouchStart={() => prefetchTab(tab.id)}
                type="button"
              >
                <span className={`h-1 w-8 rounded-full ${isActive ? "bg-[#3182F6]" : "bg-transparent"}`} />
                <span className={isActive ? "text-[#3182F6]" : "text-[#8B95A1]"}>{tab.icon}</span>
                <span className={`text-[11px] font-semibold ${isActive ? "text-[#3182F6]" : "text-[#8B95A1]"}`}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      <GuestAuthSheet
        description={authPromptDescription ?? ""}
        onClose={() => setAuthPromptDescription(null)}
        open={Boolean(authPromptDescription)}
      />
      <SupportInquiryFab
        accountEmail={account?.email ?? null}
        contextLabel={activeTab}
        onRequireAuth={openAuthPrompt}
        previewMode={isGuestPreview}
        token={token}
      />
    </div>
  )
}
