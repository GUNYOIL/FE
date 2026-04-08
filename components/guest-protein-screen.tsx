"use client"

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react"
import type { ApiSchoolMealSelection } from "@/lib/api-types"
import { createPreviewSchoolLunch } from "@/lib/app-preview"
import {
  QUICK_PROTEIN_ITEMS,
  createInitialQuickProteinValues,
  getGoalOption,
  type ProteinState,
  type UserProfile,
} from "@/lib/app-config"
import { sanitizePositiveIntegerInput } from "@/lib/numeric-input"
import { MinusIcon, PlusIcon } from "./icons"

const DEFAULT_QUICK_PROTEIN_VALUES = createInitialQuickProteinValues()

const SCHOOL_SELECTION_LABELS: Record<ApiSchoolMealSelection, string> = {
  none: "안 먹음",
  small: "적게",
  medium: "보통",
  large: "많이",
}

function parsePositiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value ?? fallback)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0
  }

  return parsed
}

export default function GuestProteinScreen({
  onRequireAuth,
  profile,
  proteinState,
  setProteinState,
}: {
  onRequireAuth: (description: string) => void
  profile: UserProfile
  proteinState: ProteinState
  setProteinState: Dispatch<SetStateAction<ProteinState>>
}) {
  const goalOption = getGoalOption(profile.goal)
  const schoolLunch = useMemo(() => createPreviewSchoolLunch(), [])
  const [customInput, setCustomInput] = useState("")
  const [customG, setCustomG] = useState("")
  const [schoolSelections, setSchoolSelections] = useState<Record<string, ApiSchoolMealSelection>>({})

  const quickProteinValues = {
    ...DEFAULT_QUICK_PROTEIN_VALUES,
    ...(proteinState.quickProteinValues ?? {}),
  }

  useEffect(() => {
    setSchoolSelections(
      schoolLunch.menus.reduce<Record<string, ApiSchoolMealSelection>>((accumulator, menu) => {
        accumulator[menu.name] = menu.default_selection
        return accumulator
      }, {}),
    )
  }, [schoolLunch])

  const committedIntake = proteinState.log.reduce((sum, entry) => sum + entry.protein, 0)
  const quickSelectionTotal = QUICK_PROTEIN_ITEMS.reduce((sum, item) => {
    const count = proteinState.quickCounts[item.id] ?? 0
    const value = parsePositiveNumber(quickProteinValues[item.id], item.protein)
    return sum + value * count
  }, 0)
  const cafeteriaProtein = schoolLunch.menus.reduce((sum, menu) => {
    const selection = schoolSelections[menu.name] ?? menu.default_selection
    return sum + parsePositiveNumber(menu.selection_options[selection], 0)
  }, 0)
  const remaining = Math.max(0, profile.proteinTarget - committedIntake)
  const pct = profile.proteinTarget > 0 ? Math.min(100, Math.round((committedIntake / profile.proteinTarget) * 100)) : 0
  const canTriggerManual = customInput.trim().length > 0 && Number(customG) > 0

  const setServing = (menuName: string, selection: ApiSchoolMealSelection) => {
    setSchoolSelections((previous) => ({
      ...previous,
      [menuName]: selection,
    }))
  }

  const adjustQuick = (id: string, delta: number) => {
    setProteinState((previous) => ({
      ...previous,
      quickCounts: {
        ...previous.quickCounts,
        [id]: Math.max(0, (previous.quickCounts[id] ?? 0) + delta),
      },
    }))
  }

  const updateQuickProteinValue = (id: string, value: string) => {
    const sanitized = sanitizePositiveIntegerInput(value)

    setProteinState((previous) => ({
      ...previous,
      quickProteinValues: {
        ...DEFAULT_QUICK_PROTEIN_VALUES,
        ...(previous.quickProteinValues ?? {}),
        [id]: sanitized ? String(Math.min(30, Number(sanitized))) : "",
      },
    }))
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="px-4 pt-5 pb-4">
        <p className="text-[12px] font-semibold text-[#8B95A1]">섭취 관리</p>
        <h2 className="mt-1 text-[24px] font-bold tracking-tight text-[#191F28]">단백질</h2>
        <p className="mt-1.5 text-[13px] text-[#6B7684]">
          {goalOption.label} 기준 {profile.weight}kg x {goalOption.proteinMultiplier}g/kg
        </p>
      </div>

      <div className="px-4 mb-4">
        <div className="rounded-[26px] border border-[#E5E8EB] bg-[#FFFFFF] p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold text-[#8B95A1]">샘플 섭취</p>
              <p className="mt-1 text-[32px] font-bold leading-none text-[#191F28]">
                {committedIntake}
                <span className="ml-1 text-[16px] font-medium text-[#8B95A1]">g</span>
              </p>
            </div>
            <span className="rounded-full bg-[#F2F4F6] px-3 py-1.5 text-[12px] font-semibold text-[#4E5968]">{goalOption.label}</span>
          </div>

          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#E5E8EB]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                backgroundColor: pct >= 100 ? "#2CB52C" : "#3182F6",
                width: `${pct}%`,
              }}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-[18px] bg-[#F7F8FA] px-3 py-3">
              <p className="text-[11px] font-semibold text-[#8B95A1]">목표</p>
              <p className="mt-1 text-[18px] font-bold text-[#191F28]">{profile.proteinTarget}g</p>
            </div>
            <div className="rounded-[18px] bg-[#F7F8FA] px-3 py-3">
              <p className="text-[11px] font-semibold text-[#8B95A1]">남음</p>
              <p className="mt-1 text-[18px] font-bold text-[#191F28]">{remaining}g</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="overflow-hidden rounded-2xl border border-[#E5E8EB] bg-[#FFFFFF]">
          <div className="flex items-center justify-between border-b border-[#E5E8EB] px-4 py-3">
            <div>
              <p className="text-[14px] font-semibold text-[#191F28]">오늘 급식</p>
              <p className="text-[12px] text-[#8B95A1]">
                {schoolLunch.meal_type_label} · 선택 기준 {cafeteriaProtein}g
              </p>
            </div>
            <button
              className="rounded-full bg-[#191F28] px-3 py-1.5 text-[12px] font-semibold text-white"
              onClick={() => onRequireAuth("급식 선택을 실제 기록으로 저장하려면 로그인 또는 회원가입이 필요합니다.")}
              type="button"
            >
              급식 기록
            </button>
          </div>

          <div className="divide-y divide-[#E5E8EB]">
            {schoolLunch.menus.map((menu) => {
              const selection = schoolSelections[menu.name] ?? menu.default_selection
              const finalProtein = parsePositiveNumber(menu.selection_options[selection], 0)

              return (
                <div key={menu.name} className="flex items-center justify-between gap-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-[#191F28]">{menu.name}</p>
                    <p className="text-[11px] text-[#8B95A1]">{finalProtein}g</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {(Object.keys(SCHOOL_SELECTION_LABELS) as ApiSchoolMealSelection[]).map((option) => (
                      <button
                        key={option}
                        className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-colors ${
                          selection === option
                            ? "bg-[#3182F6] text-white"
                            : "border border-[#E5E8EB] bg-[#F8FAFC] text-[#8B95A1]"
                        }`}
                        onClick={() => setServing(menu.name, option)}
                        type="button"
                      >
                        {SCHOOL_SELECTION_LABELS[option]}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="rounded-2xl border border-[#E5E8EB] bg-[#FFFFFF] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[14px] font-semibold text-[#191F28]">빠른 추가</p>
              <p className="text-[12px] text-[#8B95A1]">선택 중 {quickSelectionTotal}g · 로그인하면 바로 누적 기록으로 저장됩니다</p>
            </div>
            <button
              className="rounded-xl bg-[#191F28] px-4 py-2.5 text-[13px] font-semibold text-white"
              onClick={() => onRequireAuth("빠른 추가와 직접 입력 기록은 로그인 후 내 단백질 로그에 저장됩니다.")}
              type="button"
            >
              기록
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {QUICK_PROTEIN_ITEMS.map((item) => {
              const count = proteinState.quickCounts[item.id] ?? 0
              const proteinValue = quickProteinValues[item.id] ?? String(item.protein)
              const parsedValue = parsePositiveNumber(proteinValue, item.protein)

              return (
                <div key={item.id} className="rounded-[18px] border border-[#E5E8EB] bg-[#F8FAFC] px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[15px] font-semibold tracking-[-0.02em] text-[#191F28]">{item.name}</p>
                      <p className="mt-0.5 text-[11px] text-[#8B95A1]">1회 {parsedValue}g 기준</p>
                    </div>
                    <p className="pt-0.5 text-[13px] font-bold text-[#3182F6]">+{parsedValue * count}g</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex min-w-[132px] items-end gap-2 rounded-full border border-[#E5E8EB] bg-[#FFFFFF] px-3 py-2">
                      <span className="shrink-0 text-[12px] font-semibold text-[#8B95A1]">1회</span>
                      <input
                        className="w-14 min-w-0 bg-transparent text-[22px] font-bold leading-none tracking-[-0.03em] text-[#191F28] outline-none"
                        inputMode="numeric"
                        maxLength={2}
                        onChange={(event) => updateQuickProteinValue(item.id, event.target.value)}
                        pattern="[0-9]*"
                        type="text"
                        value={proteinValue}
                      />
                      <span className="shrink-0 pb-0.5 text-[15px] font-semibold text-[#8B95A1]">g</span>
                    </div>

                    <div className="flex shrink-0 items-center gap-1 rounded-full border border-[#E5E8EB] bg-[#FFFFFF] p-1">
                      <button
                        aria-label={`${item.name} 수량 감소`}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E8EB] bg-[#FFFFFF] disabled:opacity-40"
                        disabled={count === 0}
                        onClick={() => adjustQuick(item.id, -1)}
                        type="button"
                      >
                        <MinusIcon className="text-[#4E5968]" size={13} />
                      </button>
                      <span
                        className={`flex h-8 min-w-[40px] items-center justify-center rounded-full px-2.5 text-[16px] font-bold tracking-[-0.02em] ${
                          count > 0 ? "bg-[#EBF3FE] text-[#3182F6]" : "bg-[#F8FAFC] text-[#191F28]"
                        }`}
                      >
                        {count}
                      </span>
                      <button
                        aria-label={`${item.name} 수량 증가`}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E8EB] bg-[#FFFFFF]"
                        onClick={() => adjustQuick(item.id, 1)}
                        type="button"
                      >
                        <PlusIcon className="text-[#4E5968]" size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 border-t border-[#F2F4F6] pt-4">
            <p className="mb-2 text-[13px] font-semibold text-[#4E5968]">직접 입력</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="flex-1 rounded-xl border border-[#E5E8EB] bg-[#F8FAFC] px-3 py-2.5 text-[13px] text-[#191F28] outline-none"
                onChange={(event) => setCustomInput(event.target.value)}
                placeholder="음식명"
                value={customInput}
              />
              <div className="flex items-center gap-2">
                <div className="flex w-24 items-center gap-1 rounded-xl border border-[#E5E8EB] bg-[#F8FAFC] px-3 py-2.5">
                  <input
                    className="w-full bg-transparent text-[13px] font-semibold text-[#191F28] outline-none"
                    inputMode="numeric"
                    onChange={(event) => setCustomG(sanitizePositiveIntegerInput(event.target.value))}
                    placeholder="0"
                    pattern="[0-9]*"
                    type="text"
                    value={customG}
                  />
                  <span className="text-[11px] text-[#8B95A1]">g</span>
                </div>
                <button
                  className={`flex-1 rounded-xl px-3 py-2.5 text-[13px] font-medium sm:flex-none ${
                    canTriggerManual ? "bg-[#191F28] text-white" : "bg-[#F2F4F6] text-[#8B95A1]"
                  }`}
                  disabled={!canTriggerManual}
                  onClick={() => onRequireAuth("직접 입력한 음식도 로그인 후 내 기록으로 남길 수 있습니다.")}
                  type="button"
                >
                  직접 추가
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mb-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-[#4E5968]">샘플 기록</p>
          <span className="rounded-full bg-[#F2F4F6] px-3 py-1 text-[11px] font-semibold text-[#6B7684]">미리보기</span>
        </div>
        <div className="flex flex-col gap-2">
          {proteinState.log.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-[#3182F6]" />
                <div>
                  <p className="text-[13px] font-medium text-[#191F28]">{entry.label}</p>
                  <p className="text-[11px] text-[#8B95A1]">{entry.time}</p>
                </div>
              </div>
              <span className="text-[13px] font-bold text-[#3182F6]">+{entry.protein}g</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
