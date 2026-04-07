"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react"
import { fetchMyGrass } from "@/lib/api"
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
import GrassScreen from "./grass-screen"
import PwaInstallPrompt from "./pwa-install-prompt"
import ProteinScreen from "./protein-screen"
import RoutineEditorScreen from "./routine-editor-screen"
import RoutineScreen from "./routine-screen"
import TodayScreen from "./today-screen"

type Tab = "오늘" | "루틴" | "잔디" | "단백질"

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
  proteinState,
  setProteinState,
}: {
  account?: Account | null
  onboardingData: OnboardingData
  onOnboardingDataChange: (nextData: OnboardingData) => void
  proteinState: ProteinState
  setProteinState: Dispatch<SetStateAction<ProteinState>>
}) {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>("오늘")
  const [isRoutineEditing, setIsRoutineEditing] = useState(false)
  const { profile, routines } = onboardingData
  const token = account?.accessToken ?? null
  const todayKey = getTodayDayKey()
  const todayRoutine = routines[todayKey]
  const goalOption = getGoalOption(profile.goal)
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
  }

  if (isRoutineEditing) {
    return (
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
    )
  }

  return (
    <div
      className="flex flex-col bg-[#FFFFFF]"
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

      <main className="relative flex-1 overflow-hidden bg-[#F7F8FA]">
        <div className="absolute inset-0 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch" }}>
          {activeTab === "오늘" ? <TodayScreen routines={routines} token={token} /> : null}
          {activeTab === "루틴" ? <RoutineScreen onEdit={() => setIsRoutineEditing(true)} routines={routines} /> : null}
          {activeTab === "잔디" ? <GrassScreen token={token} /> : null}
          {activeTab === "단백질" ? (
            <ProteinScreen profile={profile} proteinState={proteinState} setProteinState={setProteinState} token={token} />
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
    </div>
  )
}
