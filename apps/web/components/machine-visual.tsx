"use client"

import type { ReactNode } from "react"
import { getMachineById, getMachineVisualKey, type MachineCategoryKey, type MachineVisualKey } from "@/lib/app-config"

type MachineVisualProps = {
  machineId: string
  category?: MachineCategoryKey
  className?: string
  selected?: boolean
  size?: number
}

function getPalette(category: MachineCategoryKey, selected: boolean) {
  const palette = {
    all: { bg: "bg-[#F2F4F6]", text: "text-[#6B7684]" },
    chest: { bg: "bg-[#EBF3FE]", text: "text-[#3182F6]" },
    back: { bg: "bg-[#EEF2F6]", text: "text-[#4E5968]" },
    legs: { bg: "bg-[#ECFDF3]", text: "text-[#16A34A]" },
    shoulder: { bg: "bg-[#FFF4E8]", text: "text-[#EA580C]" },
    arms: { bg: "bg-[#EAF8F8]", text: "text-[#0F766E]" },
    core: { bg: "bg-[#FFF7DB]", text: "text-[#B45309]" },
    cardio: { bg: "bg-[#FEECEC]", text: "text-[#DC2626]" },
  } as const

  if (!selected) {
    return palette[category]
  }

  return {
    bg: "bg-[#191F28]",
    text: "text-white",
  }
}

function BaseWorkoutVisual({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className="h-[24px] w-[24px]"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  )
}

function WorkoutGlyph({ visualKey }: { visualKey: MachineVisualKey }) {
  switch (visualKey) {
    case "bench":
      return (
        <BaseWorkoutVisual>
          <path d="M4 9H8M16 9H20M7 9V6M17 9V6M7 11V18M17 11V18M9 12H15M8 14H16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "pressMachine":
      return (
        <BaseWorkoutVisual>
          <path d="M6 5V19M18 5V19M8 10H16M8 14H12M16 14L19 11M16 14L19 17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "fly":
      return (
        <BaseWorkoutVisual>
          <path d="M12 6V18M6 8L10 12L6 16M18 8L14 12L18 16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "latPulldown":
      return (
        <BaseWorkoutVisual>
          <path d="M5 6H19M8 6L10 11M16 6L14 11M12 11V18M9 18H15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "row":
      return (
        <BaseWorkoutVisual>
          <path d="M5 17H10L15 12H19M8 8L12 12M10 17L7 10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "pullUp":
      return (
        <BaseWorkoutVisual>
          <path d="M5 6H19M8 6V10M16 6V10M9 12L12 10L15 12M12 10V17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "legPress":
      return (
        <BaseWorkoutVisual>
          <path d="M7 17L16 8M10 17H6M18 12V7M14 8H18M9 15L13 19" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "legExtension":
      return (
        <BaseWorkoutVisual>
          <path d="M7 7V17M7 13H12M12 13L17 15M17 15V18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "legCurl":
      return (
        <BaseWorkoutVisual>
          <path d="M6 15H12L17 11M12 15L15 18M17 11V8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "squat":
      return (
        <BaseWorkoutVisual>
          <path d="M4 8H20M7 8V17M17 8V17M10 13L12 11L14 13M12 11V18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "hinge":
      return (
        <BaseWorkoutVisual>
          <path d="M6 16H18M8 16L10 10H14L16 16M12 7V10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "lunge":
      return (
        <BaseWorkoutVisual>
          <path d="M7 8L9 12L6 17M11 12H15L18 17M12 8V12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "hipThrust":
      return (
        <BaseWorkoutVisual>
          <path d="M5 15H10M10 15L14 11L18 15M14 11V8M16 9H20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "calfRaise":
      return (
        <BaseWorkoutVisual>
          <path d="M6 17H18M9 17V12L12 10L15 12V17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "shoulderPress":
      return (
        <BaseWorkoutVisual>
          <path d="M6 9H18M8 9L10 13M16 9L14 13M12 13V18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "raise":
      return (
        <BaseWorkoutVisual>
          <path d="M7 17V11L12 8L17 11V17M7 12L5 10M17 12L19 10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "curl":
      return (
        <BaseWorkoutVisual>
          <path d="M6 16H9L11 11H15L18 14M6 16L4 14M18 14L20 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "triceps":
      return (
        <BaseWorkoutVisual>
          <path d="M12 6V11M9 18L12 11L15 18M8 8L12 6L16 8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "backExtension":
      return (
        <BaseWorkoutVisual>
          <path d="M6 16H10L15 9M10 16L14 19M15 9L18 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "core":
      return (
        <BaseWorkoutVisual>
          <path d="M7 16L10 12L7 8M17 16L14 12L17 8M10 12H14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "treadmill":
      return (
        <BaseWorkoutVisual>
          <path d="M6 17H18M8 15L12 8H15M13 8L18 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "cycle":
      return (
        <BaseWorkoutVisual>
          <circle cx="8" cy="16" r="2.5" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="17" cy="16" r="2.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 16L12 11L14 16M12 11H16M12 11L10 8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "elliptical":
      return (
        <BaseWorkoutVisual>
          <path d="M8 18C6.5 18 5 16.9 5 15C5 12.3 7.6 10 10.4 10C13.4 10 16 12.1 16 15C16 16.9 14.5 18 13 18" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 9V6M12 9L15 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "rowErg":
      return (
        <BaseWorkoutVisual>
          <path d="M6 17H11L16 13L19 9M11 17L8 11M16 13L14 17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "chest":
      return (
        <BaseWorkoutVisual>
          <path d="M6 9H18M8 9V15M16 9V15M9 15H15" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "back":
      return (
        <BaseWorkoutVisual>
          <path d="M7 7L12 12L17 7M12 12V18M8 17H16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "legs":
      return (
        <BaseWorkoutVisual>
          <path d="M9 7V12L7 17M15 7V12L17 17M9 12H15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "shoulder":
      return (
        <BaseWorkoutVisual>
          <path d="M7 10L12 7L17 10M12 7V17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "arms":
      return (
        <BaseWorkoutVisual>
          <path d="M7 16H10L12 11H15L17 14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    case "cardio":
      return (
        <BaseWorkoutVisual>
          <path d="M6 16L9 11L12 14L15 8L18 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
    default:
      return (
        <BaseWorkoutVisual>
          <path d="M5 10H8M16 10H19M8 10L10 8M16 10L14 8M10 8H14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          <path d="M8 14H16M10 16H14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </BaseWorkoutVisual>
      )
  }
}

export default function MachineVisual({
  machineId,
  category,
  className = "",
  selected = false,
  size = 44,
}: MachineVisualProps) {
  const machine = getMachineById(machineId)
  const resolvedCategory = machine?.category ?? category ?? "all"
  const visualKey = getMachineVisualKey(machineId, resolvedCategory)
  const palette = getPalette(resolvedCategory, selected)

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-[14px] ${palette.bg} ${palette.text} ${className}`}
      style={{ height: size, width: size }}
    >
      <WorkoutGlyph visualKey={visualKey} />
    </div>
  )
}
