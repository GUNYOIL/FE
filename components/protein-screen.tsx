"use client"

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createProteinLog, deleteMealLog, deleteProteinLog, fetchMealOverview, fetchProteinOverview, fetchSchoolLunch, saveSchoolLunchSelection } from "@/lib/api"
import { getReadableApiError } from "@/lib/api-client"
import type { ApiSchoolMealSelection } from "@/lib/api-types"
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
const QUICK_PROTEIN_MAX = 30

const SCHOOL_SELECTION_LABELS: Record<ApiSchoolMealSelection, string> = {
  none: "안 먹음",
  small: "적게",
  medium: "보통",
  large: "많이",
}

type DisplayLogEntry = {
  id: string
  rawId: number
  source: "protein" | "meal"
  label: string
  protein: number
  time: string
  createdAt: string
}

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

function parseDecimal(value: string | null | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatTimeLabel(value: string | undefined, fallbackDate: string) {
  const source = value ?? `${fallbackDate}T00:00:00`
  const date = new Date(source)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
  })
}

export default function ProteinScreen({
  profile,
  proteinState,
  setProteinState,
  token,
}: {
  profile: UserProfile
  proteinState: ProteinState
  setProteinState: Dispatch<SetStateAction<ProteinState>>
  token: string | null
}) {
  const queryClient = useQueryClient()
  const goalOption = getGoalOption(profile.goal)
  const [customInput, setCustomInput] = useState("")
  const [customG, setCustomG] = useState("")
  const [schoolSelections, setSchoolSelections] = useState<Record<string, ApiSchoolMealSelection>>({})
  const { quickCounts } = proteinState
  const quickProteinValues = {
    ...DEFAULT_QUICK_PROTEIN_VALUES,
    ...(proteinState.quickProteinValues ?? {}),
  }

  const proteinQuery = useQuery({
    queryKey: ["proteinOverview", token],
    queryFn: () => fetchProteinOverview(token as string),
    enabled: Boolean(token),
  })
  const mealQuery = useQuery({
    queryKey: ["mealOverview", token],
    queryFn: () => fetchMealOverview(token as string),
    enabled: Boolean(token),
  })
  const schoolLunchQuery = useQuery({
    queryKey: ["schoolLunch", token],
    queryFn: () => fetchSchoolLunch(token as string),
    enabled: Boolean(token),
  })

  if (!token) {
    return (
      <div className="flex h-full flex-col overflow-y-auto px-4 pt-5 pb-6">
        <p className="text-[12px] font-semibold text-[#8B95A1]">섭취 관리</p>
        <h2 className="mt-1 text-[24px] font-bold tracking-tight text-[#191F28]">단백질</h2>
        <div className="mt-4 rounded-2xl border border-[#E5E8EB] bg-[#FFFFFF] px-4 py-5">
          <p className="text-[14px] font-semibold text-[#191F28]">로그인 이후 급식과 단백질 기록을 불러옵니다</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (!schoolLunchQuery.data) {
      return
    }

    setSchoolSelections(
      schoolLunchQuery.data.menus.reduce<Record<string, ApiSchoolMealSelection>>((accumulator, menu) => {
        accumulator[menu.name] = menu.default_selection
        return accumulator
      }, {}),
    )
  }, [schoolLunchQuery.data?.date])

  const invalidateOverviewQueries = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["proteinOverview", token] }),
      queryClient.invalidateQueries({ queryKey: ["mealOverview", token] }),
      queryClient.invalidateQueries({ queryKey: ["schoolLunch", token] }),
    ])

  const createProteinLogMutation = useMutation({
    mutationFn: (payload: { amount: string; type: "quick" | "manual" | "supplement"; note?: string }) =>
      createProteinLog(token as string, payload),
    onSuccess: () => invalidateOverviewQueries(),
  })
  const deleteProteinLogMutation = useMutation({
    mutationFn: (logId: number) => deleteProteinLog(token as string, logId),
    onSuccess: () => invalidateOverviewQueries(),
  })
  const deleteMealLogMutation = useMutation({
    mutationFn: (mealId: number) => deleteMealLog(token as string, mealId),
    onSuccess: () => invalidateOverviewQueries(),
  })
  const saveSchoolLunchMutation = useMutation({
    mutationFn: () => {
      if (!schoolLunchQuery.data) {
        throw new Error("오늘 급식 정보가 없습니다.")
      }

      const normalizedMealType =
        schoolLunchQuery.data.meal_type === "breakfast" || schoolLunchQuery.data.meal_type === "dinner" ? schoolLunchQuery.data.meal_type : "lunch"

      return saveSchoolLunchSelection(token as string, {
        date: schoolLunchQuery.data.date,
        meal_type: normalizedMealType,
        items: schoolLunchQuery.data.menus.map((menu) => {
          const selection = schoolSelections[menu.name] ?? menu.default_selection
          return {
            menu_name: menu.name,
            selection,
            estimated_protein_grams: menu.estimated_protein_grams,
            final_protein_grams: menu.selection_options[selection],
          }
        }),
      })
    },
    onSuccess: () => invalidateOverviewQueries(),
  })

  const proteinOverview = proteinQuery.data
  const mealOverview = mealQuery.data
  const schoolLunch = schoolLunchQuery.data
  const totalIntake = parseDecimal(proteinOverview?.consumed_amount)
  const goal = parseDecimal(proteinOverview?.target_amount) || profile.proteinTarget
  const remaining =
    proteinOverview?.remaining_amount !== undefined && proteinOverview?.remaining_amount !== null
      ? parseDecimal(proteinOverview.remaining_amount)
      : Math.max(0, goal - totalIntake)
  const pct = typeof proteinOverview?.progress_percent === "number" ? proteinOverview.progress_percent : goal > 0 ? Math.min(100, Math.round((totalIntake / goal) * 100)) : 0
  const servingOptions = useMemo(() => Object.keys(SCHOOL_SELECTION_LABELS) as ApiSchoolMealSelection[], [])
  const menus = schoolLunch?.menus ?? []
  const cafeteriaProtein = menus.reduce((sum, menu) => {
    const selection = schoolSelections[menu.name] ?? menu.default_selection
    return sum + parseDecimal(menu.selection_options[selection])
  }, 0)
  const quickSelectionTotal = QUICK_PROTEIN_ITEMS.reduce(
    (sum, item) => sum + parseQuickProteinValue(quickProteinValues[item.id], item.protein) * (quickCounts[item.id] ?? 0),
    0,
  )
  const hasInvalidQuickSelection = QUICK_PROTEIN_ITEMS.some(
    (item) => (quickCounts[item.id] ?? 0) > 0 && parseQuickProteinValue(quickProteinValues[item.id], item.protein) <= 0,
  )
  const canLogCustom = customInput.trim().length > 0 && Number(customG) > 0
  const combinedLogs = useMemo<DisplayLogEntry[]>(() => {
    const proteinLogs = (proteinOverview?.logs ?? [])
      .filter((entry) => entry.type !== "meal")
      .map((entry) => ({
        id: `protein-${entry.id}`,
        rawId: entry.id,
        source: "protein" as const,
        label: entry.note?.trim() || entry.type_label || "단백질 기록",
        protein: parseDecimal(entry.amount),
        time: formatTimeLabel(entry.created_at, entry.date),
        createdAt: entry.created_at ?? `${entry.date}T00:00:00`,
      }))
    const mealLogs = (mealOverview?.meals ?? []).map((entry) => ({
      id: `meal-${entry.id}`,
      rawId: entry.id,
      source: "meal" as const,
      label: entry.name,
      protein: parseDecimal(entry.protein),
      time: formatTimeLabel(entry.created_at, entry.date),
      createdAt: entry.created_at ?? `${entry.date}T00:00:00`,
    }))

    return [...mealLogs, ...proteinLogs].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  }, [mealOverview?.meals, proteinOverview?.logs])
  const topLevelError = proteinQuery.error || mealQuery.error

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

  const setServing = (menuName: string, selection: ApiSchoolMealSelection) => {
    setSchoolSelections((previous) => ({
      ...previous,
      [menuName]: selection,
    }))
  }

  const logCafeteria = async () => {
    if (cafeteriaProtein === 0 || !schoolLunch) {
      return
    }

    await saveSchoolLunchMutation.mutateAsync()
  }

  const logQuick = async () => {
    const selectedItems = QUICK_PROTEIN_ITEMS.filter((item) => (quickCounts[item.id] ?? 0) > 0)
    if (
      selectedItems.length === 0 ||
      selectedItems.some((item) => parseQuickProteinValue(quickProteinValues[item.id], item.protein) <= 0)
    ) {
      return
    }

    await Promise.all(
      selectedItems.map((item) => {
        const count = quickCounts[item.id] ?? 0
        const perServingProtein = parseQuickProteinValue(quickProteinValues[item.id], item.protein)

        return createProteinLogMutation.mutateAsync({
          amount: String(perServingProtein * count),
          type: "quick",
          note: count > 1 ? `${item.name} ${perServingProtein}g x${count}` : `${item.name} ${perServingProtein}g`,
        })
      }),
    )

    setProteinState((previous) => ({
      ...previous,
      quickCounts: QUICK_PROTEIN_ITEMS.reduce((accumulator, item) => {
        accumulator[item.id] = 0
        return accumulator
      }, {} as Record<string, number>),
    }))
  }

  const logCustom = async () => {
    const grams = Number(customG)
    if (!customInput.trim() || grams <= 0) {
      return
    }

    await createProteinLogMutation.mutateAsync({
      amount: String(grams),
      type: "manual",
      note: customInput.trim(),
    })
    setCustomInput("")
    setCustomG("")
  }

  const removeLog = async (entry: DisplayLogEntry) => {
    if (entry.source === "meal") {
      await deleteMealLogMutation.mutateAsync(entry.rawId)
      return
    }

    await deleteProteinLogMutation.mutateAsync(entry.rawId)
  }

  if (proteinQuery.isLoading || mealQuery.isLoading) {
    return <div className="min-h-full bg-[#F7F8FA]" />
  }

  if (topLevelError) {
    return (
      <div className="flex h-full flex-col overflow-y-auto px-4 pt-5 pb-6">
        <p className="text-[12px] font-semibold text-[#8B95A1]">섭취 관리</p>
        <h2 className="mt-1 text-[24px] font-bold tracking-tight text-[#191F28]">단백질</h2>
        <div className="mt-4 rounded-2xl border border-[#E5E8EB] bg-[#FFFFFF] px-4 py-5">
          <p className="text-[14px] font-semibold text-[#191F28]">단백질 데이터를 불러오지 못했습니다</p>
          <p className="mt-1 text-[12px] leading-5 text-[#8B95A1]">{getReadableApiError(topLevelError)}</p>
        </div>
      </div>
    )
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
                width: `${Math.max(0, Math.min(100, pct))}%`,
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
              <p className="text-[12px] text-[#8B95A1]">선택 기준 {cafeteriaProtein}g</p>
            </div>
            <button
              className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                cafeteriaProtein > 0 && !saveSchoolLunchMutation.isPending ? "bg-[#191F28] text-white" : "bg-[#F2F4F6] text-[#8B95A1]"
              }`}
              disabled={cafeteriaProtein === 0 || saveSchoolLunchMutation.isPending || schoolLunchQuery.isLoading || !schoolLunch}
              onClick={() => void logCafeteria()}
              type="button"
            >
              {saveSchoolLunchMutation.isPending ? "기록 중..." : "급식 기록"}
            </button>
          </div>
          {schoolLunchQuery.error ? (
            <div className="px-4 py-5 text-[12px] leading-5 text-[#8B95A1]">{getReadableApiError(schoolLunchQuery.error)}</div>
          ) : menus.length === 0 ? (
            <div className="px-4 py-5 text-[12px] leading-5 text-[#8B95A1]">오늘 급식 정보가 없습니다.</div>
          ) : (
            <div className="divide-y divide-[#E5E8EB]">
              {menus.map((menu) => {
                const selection = schoolSelections[menu.name] ?? menu.default_selection
                const finalProtein = parseDecimal(menu.selection_options[selection])

                return (
                  <div key={menu.name} className="flex items-center justify-between gap-2 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-[#191F28]">{menu.name}</p>
                      <p className="text-[11px] text-[#8B95A1]">{finalProtein}g</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {servingOptions.map((option) => (
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
          )}
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
                quickSelectionTotal > 0 && !hasInvalidQuickSelection && !createProteinLogMutation.isPending
                  ? "bg-[#191F28] text-white"
                  : "bg-[#F2F4F6] text-[#8B95A1]"
              }`}
              disabled={quickSelectionTotal === 0 || hasInvalidQuickSelection || createProteinLogMutation.isPending}
              onClick={() => void logQuick()}
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
                          <button className="font-semibold text-[#3182F6]" onClick={() => resetQuickProteinValue(item.id, item.protein)} type="button">
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
                    canLogCustom && !createProteinLogMutation.isPending ? "bg-[#191F28] text-white" : "bg-[#F2F4F6] text-[#8B95A1]"
                  }`}
                  disabled={!canLogCustom || createProteinLogMutation.isPending}
                  onClick={() => void logCustom()}
                  type="button"
                >
                  직접 추가
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {(createProteinLogMutation.error || saveSchoolLunchMutation.error || deleteProteinLogMutation.error || deleteMealLogMutation.error) ? (
        <div className="px-4 mb-4">
          <div className="rounded-[18px] bg-[#FFF4EB] px-4 py-3 text-[13px] font-medium text-[#F97316]">
            {getReadableApiError(
              createProteinLogMutation.error ?? saveSchoolLunchMutation.error ?? deleteProteinLogMutation.error ?? deleteMealLogMutation.error,
            )}
          </div>
        </div>
      ) : null}

      <div className="px-4 mb-6">
        <p className="mb-2 text-[13px] font-semibold text-[#4E5968]">오늘 기록</p>
        {combinedLogs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E5E8EB] py-8 text-center">
            <p className="text-[13px] font-medium text-[#191F28]">아직 기록이 없습니다</p>
            <p className="mt-1 text-[12px] text-[#8B95A1]">급식 또는 빠른 추가로 첫 기록을 남겨 보세요</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {combinedLogs.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${entry.source === "meal" ? "bg-[#2CB52C]" : "bg-[#3182F6]"}`} />
                  <div>
                    <p className="text-[13px] font-medium text-[#191F28]">{entry.label}</p>
                    <p className="text-[11px] text-[#8B95A1]">{entry.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-[#3182F6]">+{entry.protein}g</span>
                  <button
                    className="px-1.5 py-0.5 text-[11px] text-[#8B95A1]"
                    disabled={deleteProteinLogMutation.isPending || deleteMealLogMutation.isPending}
                    onClick={() => void removeLog(entry)}
                    type="button"
                  >
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
