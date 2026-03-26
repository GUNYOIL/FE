"use client"

import { useState, type Dispatch, type SetStateAction } from "react"
import {
  QUICK_PROTEIN_ITEMS,
  SERVING_PROTEIN,
  createInitialQuickProteinValues,
  getGoalOption,
  type ProteinState,
  type ServingOption,
  type UserProfile,
} from "@/lib/app-config"
import { sanitizePositiveIntegerInput } from "@/lib/numeric-input"
import { MinusIcon, PlusIcon } from "./icons"

const DEFAULT_QUICK_PROTEIN_VALUES = createInitialQuickProteinValues()
const QUICK_PROTEIN_MAX = 30

function sanitizeQuickProteinInput(value: string) {
  const sanitized = sanitizePositiveIntegerInput(value)
  if (!sanitized) {
    return ""
  }

  return String(Math.min(QUICK_PROTEIN_MAX, Number(sanitized)))
}

function parseQuickProteinValue(value: string | undefined, fallback: number) {
  const parsed = Number(value ?? fallback)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0
  }

  return parsed
}

export default function ProteinScreen({
  profile,
  proteinState,
  setProteinState,
}: {
  profile: UserProfile
  proteinState: ProteinState
  setProteinState: Dispatch<SetStateAction<ProteinState>>
}) {
  const goalOption = getGoalOption(profile.goal)
  const goal = profile.proteinTarget
  const [customInput, setCustomInput] = useState("")
  const [customG, setCustomG] = useState("")
  const { cafeteria, log, quickCounts } = proteinState
  const quickProteinValues = {
    ...DEFAULT_QUICK_PROTEIN_VALUES,
    ...(proteinState.quickProteinValues ?? {}),
  }

  const cafeteriaProtein = cafeteria.reduce((sum, item) => sum + SERVING_PROTEIN[item.serving], 0)
  const totalIntake = log.reduce((sum, entry) => sum + entry.protein, 0)
  const remaining = Math.max(0, goal - totalIntake)
  const pct = goal > 0 ? Math.min(100, Math.round((totalIntake / goal) * 100)) : 0
  const servingOptions: ServingOption[] = ["안 먹음", "적게", "보통", "많이"]
  const quickSelectionTotal = QUICK_PROTEIN_ITEMS.reduce(
    (sum, item) => sum + parseQuickProteinValue(quickProteinValues[item.id], item.protein) * (quickCounts[item.id] ?? 0),
    0,
  )
  const hasInvalidQuickSelection = QUICK_PROTEIN_ITEMS.some(
    (item) => (quickCounts[item.id] ?? 0) > 0 && parseQuickProteinValue(quickProteinValues[item.id], item.protein) <= 0,
  )
  const canLogCustom = customInput.trim().length > 0 && Number(customG) > 0

  const setServing = (id: string, serving: ServingOption) => {
    setProteinState((previous) => ({
      ...previous,
      cafeteria: previous.cafeteria.map((item) => (item.id === id ? { ...item, serving } : item)),
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
    setProteinState((previous) => ({
      ...previous,
      quickProteinValues: {
        ...DEFAULT_QUICK_PROTEIN_VALUES,
        ...(previous.quickProteinValues ?? {}),
        [id]: sanitizeQuickProteinInput(value),
      },
    }))
  }

  const resetQuickProteinValue = (id: string, protein: number) => {
    setProteinState((previous) => ({
      ...previous,
      quickProteinValues: {
        ...DEFAULT_QUICK_PROTEIN_VALUES,
        ...(previous.quickProteinValues ?? {}),
        [id]: String(protein),
      },
    }))
  }

  const logCafeteria = () => {
    if (cafeteriaProtein === 0) {
      return
    }

    setProteinState((previous) => ({
      ...previous,
      log: [
        ...previous.log,
        {
          id: `log-${Date.now()}`,
          label: "급식 식단",
          protein: cafeteriaProtein,
          time: new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            hour12: false,
            minute: "2-digit",
          }),
        },
      ],
    }))
  }

  const logQuick = () => {
    const selectedItems = QUICK_PROTEIN_ITEMS.filter((item) => (quickCounts[item.id] ?? 0) > 0)
    if (
      selectedItems.length === 0 ||
      selectedItems.some((item) => parseQuickProteinValue(quickProteinValues[item.id], item.protein) <= 0)
    ) {
      return
    }

    setProteinState((previous) => ({
      ...previous,
      log: [
        ...previous.log,
        ...selectedItems.map((item) => {
          const count = previous.quickCounts[item.id] ?? 0
          const perServingProtein = parseQuickProteinValue(previous.quickProteinValues?.[item.id], item.protein)
          return {
            id: `log-${Date.now()}-${item.id}`,
            label: count > 1 ? `${item.name} ${perServingProtein}g x${count}` : `${item.name} ${perServingProtein}g`,
            protein: perServingProtein * count,
            time: new Date().toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              hour12: false,
              minute: "2-digit",
            }),
          }
        }),
      ],
      quickCounts: QUICK_PROTEIN_ITEMS.reduce((accumulator, item) => {
        accumulator[item.id] = 0
        return accumulator
      }, {} as Record<string, number>),
    }))
  }

  const logCustom = () => {
    const grams = Number(customG)
    if (!customInput || grams <= 0) {
      return
    }

    setProteinState((previous) => ({
      ...previous,
      log: [
        ...previous.log,
        {
          id: `log-${Date.now()}`,
          label: customInput,
          protein: grams,
          time: new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            hour12: false,
            minute: "2-digit",
          }),
        },
      ],
    }))
    setCustomInput("")
    setCustomG("")
  }

  const removeLog = (id: string) => {
    setProteinState((previous) => ({
      ...previous,
      log: previous.log.filter((entry) => entry.id !== id),
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
              <p className="text-[12px] font-semibold text-[#8B95A1]">오늘 섭취</p>
              <p className="mt-1 text-[32px] font-bold leading-none text-[#191F28]">
                {totalIntake}
                <span className="ml-1 text-[16px] font-medium text-[#8B95A1]">g</span>
              </p>
            </div>
            <span className="rounded-full bg-[#F2F4F6] px-3 py-1.5 text-[12px] font-semibold text-[#4E5968]">
              {goalOption.label}
            </span>
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
              <p className="mt-1 text-[18px] font-bold text-[#191F28]">{goal}g</p>
            </div>
            <div className="rounded-[18px] bg-[#F7F8FA] px-3 py-3">
              <p className="text-[11px] font-semibold text-[#8B95A1]">남음</p>
              <p className="mt-1 text-[18px] font-bold text-[#191F28]">{remaining}g</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="overflow-hidden rounded-2xl border border-[#E5E8EB]">
          <div className="flex items-center justify-between border-b border-[#E5E8EB] px-4 py-3">
            <div>
              <p className="text-[14px] font-semibold text-[#191F28]">오늘 급식</p>
              <p className="text-[12px] text-[#8B95A1]">예상 {cafeteriaProtein}g</p>
            </div>
            <button
              className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                cafeteriaProtein > 0 ? "bg-[#191F28] text-white" : "bg-[#F2F4F6] text-[#8B95A1]"
              }`}
              disabled={cafeteriaProtein === 0}
              onClick={logCafeteria}
              type="button"
            >
              급식 기록
            </button>
          </div>
          <div className="divide-y divide-[#E5E8EB]">
            {cafeteria.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-[#191F28]">{item.name}</p>
                  <p className="text-[11px] text-[#8B95A1]">{SERVING_PROTEIN[item.serving]}g</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {servingOptions.map((option) => (
                    <button
                      key={option}
                      className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-colors ${
                        item.serving === option
                          ? "bg-[#3182F6] text-white"
                          : "border border-[#E5E8EB] bg-[#F8FAFC] text-[#8B95A1]"
                      }`}
                      onClick={() => setServing(item.id, option)}
                      type="button"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="rounded-2xl border border-[#E5E8EB] bg-[#FFFFFF] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[14px] font-semibold text-[#191F28]">빠른 추가</p>
              <p className="text-[12px] text-[#8B95A1]">
                선택한 항목 {quickSelectionTotal}g · 항목별 1회 g를 수정할 수 있고 최대 30g까지만 입력됩니다
              </p>
            </div>
            <button
              className={`w-full rounded-xl px-4 py-2.5 text-[13px] font-semibold sm:w-auto ${
                quickSelectionTotal > 0 && !hasInvalidQuickSelection ? "bg-[#191F28] text-white" : "bg-[#F2F4F6] text-[#8B95A1]"
              }`}
              disabled={quickSelectionTotal === 0 || hasInvalidQuickSelection}
              onClick={logQuick}
              type="button"
            >
              빠른 추가 기록
            </button>
          </div>

          <div className="mt-3 rounded-xl bg-[#F8FAFC] px-3 py-2.5">
            <p className="text-[12px] leading-5 text-[#4E5968]">
              자주 먹는 제품은 여기서 1회 g만 맞춰 두고, 일회성 음식은 아래 직접 입력으로 남기면 됩니다.
            </p>
          </div>

          <div className="mt-3 space-y-3">
            {QUICK_PROTEIN_ITEMS.map((item) => {
              const count = quickCounts[item.id] ?? 0
              const proteinValue = quickProteinValues[item.id] ?? String(item.protein)
              const parsedProteinValue = parseQuickProteinValue(proteinValue, item.protein)
              const isCustomized = proteinValue !== String(item.protein)
              const contribution = parsedProteinValue * count

              return (
                <div
                  key={item.id}
                  className={`rounded-[18px] border px-3 py-3 ${
                    count > 0 && parsedProteinValue <= 0 ? "border-[#F97316] bg-[#FFF7ED]" : "border-[#E5E8EB] bg-[#F8FAFC]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold tracking-[-0.02em] text-[#191F28]">{item.name}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#8B95A1]">
                        <span>{isCustomized ? `현재 ${parsedProteinValue}g / 1회` : `기본 ${item.protein}g / 1회`}</span>
                        {isCustomized ? (
                          <button
                            className="font-semibold text-[#3182F6]"
                            onClick={() => resetQuickProteinValue(item.id, item.protein)}
                            type="button"
                          >
                            기본값 복귀
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <p className="shrink-0 pt-0.5 text-[13px] font-bold text-[#3182F6]">+{contribution}g</p>
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

                  <p className={`mt-2.5 text-[11px] ${parsedProteinValue > 0 ? "text-[#6B7684]" : "font-medium text-[#F97316]"}`}>
                    {parsedProteinValue > 0
                      ? count > 0
                        ? `${item.name} ${count}회로 ${contribution}g가 기록됩니다`
                        : `${parsedProteinValue}g씩 빠르게 추가할 수 있습니다`
                      : "1회 g를 입력해 주세요"}
                  </p>
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
                    canLogCustom ? "bg-[#191F28] text-white" : "bg-[#F2F4F6] text-[#8B95A1]"
                  }`}
                  disabled={!canLogCustom}
                  onClick={logCustom}
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
        <p className="mb-2 text-[13px] font-semibold text-[#4E5968]">오늘 기록</p>
        {log.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E5E8EB] py-8 text-center">
            <p className="text-[13px] font-medium text-[#191F28]">아직 기록이 없습니다</p>
            <p className="mt-1 text-[12px] text-[#8B95A1]">급식 또는 빠른 추가로 첫 기록을 남겨 보세요</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {log.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#3182F6]" />
                  <div>
                    <p className="text-[13px] font-medium text-[#191F28]">{entry.label}</p>
                    <p className="text-[11px] text-[#8B95A1]">{entry.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-[#3182F6]">+{entry.protein}g</span>
                  <button className="px-1.5 py-0.5 text-[11px] text-[#8B95A1]" onClick={() => removeLog(entry.id)} type="button">
                    ×
                  </button>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-[12px] text-[#8B95A1]">합계</span>
              <span className="text-[14px] font-bold text-[#191F28]">{totalIntake}g</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
