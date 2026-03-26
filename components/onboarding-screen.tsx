"use client"

import { useEffect, useMemo, useState } from "react"
import {
  DAY_META,
  GOAL_OPTIONS,
  MACHINE_CATEGORIES,
  MACHINES,
  calculateProteinTarget,
  canToggleSupersetPair,
  createEmptyRoutineMap,
  createExerciseId,
  formatExerciseMetricSummary,
  formatBodyParts,
  formatSupersetExerciseNames,
  getDayMeta,
  getExerciseMetricHint,
  getExerciseMetricProfile,
  getGoalOption,
  getMachineVisualLabel,
  getPrimaryMachineCategory,
  getPreferredMachineCategories,
  getRoutineDayCardPreview,
  getRoutineFocusHint,
  getRoutineFocusLabel,
  getRoutineFocusOptions,
  hasWorkoutBodyParts,
  isExerciseConfigured,
  isRestDay,
  isSupersetPair,
  normalizeExerciseSupersets,
  toggleSupersetPair,
  toggleBodyPartSelection,
  type DayKey,
  type ExerciseField,
  type Gender,
  type GoalKey,
  type MachineCategoryKey,
  type OnboardingData,
  type RoutineFocus,
  type RoutineMap,
} from "@/lib/app-config"
import type { OnboardingProfileDraft } from "@/lib/session"
import { sanitizeNonNegativeDecimalInput, sanitizePositiveIntegerInput } from "@/lib/numeric-input"
import BrandMark from "./brand-mark"
import { SearchIcon, Trash2Icon, XIcon } from "./icons"
import MachineVisual from "./machine-visual"

type Step = 1 | 2
type RoutineStage = "focus" | "exercise" | "details"

export default function OnboardingScreen({
  initialProfile,
  initialRoutines,
  initialStep = 1,
  onBackToProfile,
  onComplete,
  onExit,
  onProfileNext,
}: {
  initialProfile?: OnboardingProfileDraft
  initialRoutines?: RoutineMap
  initialStep?: Step
  onBackToProfile?: () => void
  onComplete: (data: OnboardingData) => void
  onExit: () => void
  onProfileNext?: (profile: OnboardingProfileDraft, routines: RoutineMap) => void
}) {
  const [step, setStep] = useState<Step>(initialStep)
  const [routineStage, setRoutineStage] = useState<RoutineStage>("focus")
  const [gender, setGender] = useState<Gender | "">(initialProfile?.gender ?? "")
  const [height, setHeight] = useState(initialProfile?.height ?? "")
  const [weight, setWeight] = useState(initialProfile?.weight ?? "")
  const [goal, setGoal] = useState<GoalKey>(initialProfile?.goal ?? "muscle_gain")
  const [routines, setRoutines] = useState<RoutineMap>(initialRoutines ?? createEmptyRoutineMap())
  const [selectedDay, setSelectedDay] = useState<DayKey>("mon")
  const [machineSearch, setMachineSearch] = useState("")
  const [machineCategory, setMachineCategory] = useState<MachineCategoryKey>(() =>
    getPrimaryMachineCategory((initialRoutines ?? createEmptyRoutineMap()).mon.bodyParts),
  )

  const numericWeight = Number(weight)
  const proteinTarget = calculateProteinTarget(numericWeight, goal)
  const goalOption = getGoalOption(goal)
  const routineFocusOptions = getRoutineFocusOptions(goal)
  const routineFocusLabel = getRoutineFocusLabel(goal)
  const routineFocusHint = getRoutineFocusHint(goal)
  const selectedDayRoutine = routines[selectedDay]
  const selectedDayMeta = getDayMeta(selectedDay)
  const selectedDayBodyPartLabel = formatBodyParts(selectedDayRoutine.bodyParts)
  const selectedDayNeedsExercise = hasWorkoutBodyParts(selectedDayRoutine.bodyParts)

  const workingDays = DAY_META.filter((day) => {
    const routine = routines[day.key]
    return hasWorkoutBodyParts(routine.bodyParts)
  })
  const completedRoutineDays = workingDays.filter((day) => {
    const routine = routines[day.key]
    return routine.exercises.length > 0 && routine.exercises.every(isExerciseConfigured)
  })
  const incompleteDays = workingDays.filter((day) => {
    const routine = routines[day.key]
    return routine.exercises.length === 0 || routine.exercises.some((exercise) => !isExerciseConfigured(exercise))
  })
  const prioritizedMachines = useMemo(() => {
    return MACHINES.filter((machine) => {
      const matchesSearch = machine.name.toLowerCase().includes(machineSearch.toLowerCase())
      const matchesCategory = machineCategory === "all" || machine.category === machineCategory
      return matchesSearch && matchesCategory
    }).sort((left, right) => {
      const preferredCategories = getPreferredMachineCategories(selectedDayRoutine.bodyParts)
      const leftRank = preferredCategories.includes(left.category) ? 0 : 1
      const rightRank = preferredCategories.includes(right.category) ? 0 : 1
      return leftRank - rightRank
    })
  }, [machineCategory, machineSearch, selectedDayRoutine.bodyParts])

  useEffect(() => {
    if (routineStage !== "exercise") {
      return
    }

    setMachineCategory(getPrimaryMachineCategory(selectedDayRoutine.bodyParts))
  }, [routineStage, selectedDay, selectedDayRoutine.bodyParts])

  const toggleBodyPart = (dayKey: DayKey, nextBodyPart: RoutineFocus) => {
    setRoutines((previous) => ({
      ...previous,
      [dayKey]: (() => {
        const nextBodyParts = toggleBodyPartSelection(previous[dayKey].bodyParts, nextBodyPart, routineFocusOptions)
        if (isRestDay(nextBodyParts)) {
          return { bodyParts: nextBodyParts, exercises: [] }
        }

        return { ...previous[dayKey], bodyParts: nextBodyParts }
      })(),
    }))
  }

  const copyPreviousDay = (dayKey: DayKey) => {
    const dayIndex = DAY_META.findIndex((day) => day.key === dayKey)
    if (dayIndex <= 0) {
      return
    }

    const previousDayKey = DAY_META[dayIndex - 1].key
    const previousRoutine = routines[previousDayKey]

    setRoutines((previous) => ({
      ...previous,
      [dayKey]: {
        bodyParts: [...previousRoutine.bodyParts],
        exercises: previousRoutine.exercises.map((exercise) => ({
          ...exercise,
          id: createExerciseId(dayKey, exercise.machineId),
        })),
      },
    }))
  }

  const resetAllDays = () => {
    setRoutines(createEmptyRoutineMap())
    setSelectedDay("mon")
    setRoutineStage("focus")
    setMachineSearch("")
    setMachineCategory("all")
  }

  const addExercise = (dayKey: DayKey, machineId: string) => {
    const machine = MACHINES.find((item) => item.id === machineId)
    if (!machine) {
      return
    }

    setRoutines((previous) => ({
      ...previous,
      [dayKey]: {
        ...previous[dayKey],
        exercises: [
          ...previous[dayKey].exercises,
          {
            id: createExerciseId(dayKey, machine.id),
            machineId: machine.id,
            machineName: machine.name,
            weight: "",
            reps: "",
            sets: "",
            supersetGroupId: null,
          },
        ],
      },
    }))
  }

  const removeExercise = (dayKey: DayKey, exerciseId: string) => {
    setRoutines((previous) => ({
      ...previous,
      [dayKey]: {
        ...previous[dayKey],
        exercises: normalizeExerciseSupersets(previous[dayKey].exercises.filter((exercise) => exercise.id !== exerciseId)),
      },
    }))
  }

  const updateExercise = (dayKey: DayKey, exerciseId: string, field: ExerciseField, value: string) => {
    setRoutines((previous) => {
      const targetExercise = previous[dayKey].exercises.find((exercise) => exercise.id === exerciseId)

      return {
        ...previous,
        [dayKey]: {
          ...previous[dayKey],
          exercises: previous[dayKey].exercises.map((exercise) => {
            if (field === "sets" && targetExercise?.supersetGroupId && exercise.supersetGroupId === targetExercise.supersetGroupId) {
              return { ...exercise, sets: value }
            }

            return exercise.id === exerciseId ? { ...exercise, [field]: value } : exercise
          }),
        },
      }
    })
  }

  const toggleExerciseSuperset = (dayKey: DayKey, index: number) => {
    setRoutines((previous) => ({
      ...previous,
      [dayKey]: {
        ...previous[dayKey],
        exercises: toggleSupersetPair(previous[dayKey].exercises, index, dayKey),
      },
    }))
  }

  const canProceedProfile =
    Number(height) > 0 && Number(weight) > 0 && (gender === "male" || gender === "female")
  const canGoExerciseStage = selectedDayRoutine.bodyParts.length > 0
  const canGoDetailStage =
    isRestDay(selectedDayRoutine.bodyParts) || (selectedDayRoutine.bodyParts.length > 0 && selectedDayRoutine.exercises.length > 0)
  const canCompleteRoutine = workingDays.length > 0 && incompleteDays.length === 0
  const selectedDayExerciseCount = selectedDayRoutine.exercises.length
  const selectedDayCompletedExercises = selectedDayRoutine.exercises.filter(isExerciseConfigured).length
  const selectedDaySupersetPairCount = new Set(
    selectedDayRoutine.exercises.flatMap((exercise) => (exercise.supersetGroupId ? [exercise.supersetGroupId] : [])),
  ).size
  const routineStageCards = [
    { key: "focus" as const, label: "부위 설정", hint: "요일별 운동 타입을 먼저 정합니다", enabled: true },
    {
      key: "exercise" as const,
      label: "운동 선택",
      hint: canGoExerciseStage ? "머신을 고르고 슈퍼세트도 묶습니다" : "부위를 먼저 선택해야 합니다",
      enabled: canGoExerciseStage,
    },
    {
      key: "details" as const,
      label: "운동 입력",
      hint: canGoDetailStage ? "세트, 횟수, 무게를 입력합니다" : "운동 선택을 먼저 완료해야 합니다",
      enabled: canGoDetailStage,
    },
  ]
  const genderHelper = gender === "" ? "성별을 선택해 주세요" : ""
  const heightHelper = height === "" ? "키를 입력해 주세요" : Number(height) <= 0 ? "0보다 큰 값을 입력해 주세요" : ""
  const weightHelper = weight === "" ? "몸무게를 입력해 주세요" : Number(weight) <= 0 ? "0보다 큰 값을 입력해 주세요" : ""
  const exitLabel = step === 1 ? "나가기" : onBackToProfile ? "이전" : "나가기"

  const profileSummary =
    canProceedProfile && proteinTarget > 0
      ? `${goalOption.label} 기준 ${proteinTarget}g / day`
      : `성별${gender ? "" : " ·"} 키${height ? "" : " ·"} 몸무게${weight ? "" : " ·"}를 입력해 주세요`

  const routineSummary =
    routineStage === "focus"
      ? canGoExerciseStage
        ? `${selectedDayMeta.full} · ${selectedDayBodyPartLabel}`
        : `선택한 요일의 ${routineFocusLabel}을 먼저 정해 주세요`
      : routineStage === "exercise"
        ? isRestDay(selectedDayRoutine.bodyParts)
          ? `${selectedDayMeta.full}은 휴식일입니다`
          : `${selectedDayRoutine.exercises.length}개 운동 선택됨`
          : canCompleteRoutine
          ? `${completedRoutineDays.length}일 루틴 완료`
          : workingDays.length === 0
            ? "최소 1일 이상의 운동일을 설정해 주세요"
            : `${incompleteDays.length}일의 운동 정보를 더 입력해 주세요`
  const headerProgressLabel = step === 1 ? "1/2" : "2/2"
  const stageTitle = step === 1 ? "기본 정보" : "루틴 설정"
  const routineStageHint =
    routineStage === "focus"
      ? "요일별 부위를 먼저 정하면 운동 선택이 열립니다"
      : routineStage === "exercise"
        ? "연속으로 붙은 운동은 슈퍼세트로 묶을 수 있습니다"
        : "입력 상태를 보고 세트, 횟수, 무게를 마무리합니다"

  return (
    <div className="mx-auto flex min-h-svh max-w-[480px] flex-col bg-[#FFFFFF]">
      <header className="sticky top-0 z-20 border-b border-[#EEF1F4] bg-[rgba(255,255,255,0.94)] px-4 pt-safe-top backdrop-blur">
        <div className="flex h-14 items-center justify-between">
          <button
            className="text-[14px] font-semibold text-[#4E5968]"
            onClick={step === 2 && onBackToProfile ? onBackToProfile : onExit}
            type="button"
          >
            {exitLabel}
          </button>
          <div className="flex items-center gap-2">
            <BrandMark iconClassName="h-6 w-6 rounded-lg" textClassName="text-[17px] font-bold text-[#191F28]" />
            <span className="rounded-full bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-medium text-[#8B95A1]">
              {headerProgressLabel}
            </span>
          </div>
          <span className="rounded-full bg-[#EBF3FE] px-3 py-1.5 text-[11px] font-semibold text-[#3182F6]">
            {stageTitle}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-32 no-scrollbar">
        {step === 1 ? (
          <div className="px-4 pt-6 pb-6">
            <div>
              <p className="text-[12px] font-semibold text-[#8B95A1]">기본 정보 입력</p>
              <h1 className="mt-2 text-[30px] font-bold leading-[1.12] tracking-[-0.03em] text-[#191F28]">
                성별, 키, 몸무게,
                <br />
                목표 설정
              </h1>
              <p className="mt-3 text-[14px] leading-6 text-[#6B7684]">
                입력한 몸무게와 목표를 기준으로 하루 단백질 목표를 계산합니다
              </p>
              <p className="mt-4 rounded-2xl bg-[#F7F8FA] px-3 py-2 text-[12px] leading-5 text-[#4E5968]">
                프로필을 먼저 채워야 루틴 단계에서 입력값을 이어받을 수 있습니다
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <div>
                  <p className="mb-2 text-[12px] font-semibold text-[#191F28]">성별</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "male" as const, label: "남성" },
                      { value: "female" as const, label: "여성" },
                    ].map((item) => (
                      <button
                        key={item.value}
                        className={`rounded-[18px] border px-4 py-3 text-[14px] font-semibold transition-colors ${
                          gender === item.value
                            ? "border-[#3182F6] bg-[#EBF3FE] text-[#3182F6]"
                            : "border-[#E5E8EB] bg-[#F7F8FA] text-[#4E5968]"
                        }`}
                        onClick={() => setGender(item.value)}
                        type="button"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  {genderHelper ? <p className="mt-2 text-[12px] text-[#8B95A1]">{genderHelper}</p> : null}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="mb-2 text-[12px] font-semibold text-[#191F28]">키</p>
                    <div className="flex items-center gap-2 rounded-[18px] border border-[#E5E8EB] bg-[#F7F8FA] px-4 py-3">
                      <input
                        className="w-full bg-transparent text-[17px] font-semibold text-[#191F28] outline-none"
                        inputMode="numeric"
                        onChange={(event) => setHeight(sanitizePositiveIntegerInput(event.target.value))}
                        placeholder="175"
                        pattern="[0-9]*"
                        type="text"
                        value={height}
                      />
                      <span className="text-[13px] font-medium text-[#8B95A1]">cm</span>
                    </div>
                    {heightHelper ? <p className="mt-2 text-[12px] text-[#8B95A1]">{heightHelper}</p> : null}
                  </div>

                  <div>
                    <p className="mb-2 text-[12px] font-semibold text-[#191F28]">몸무게</p>
                    <div className="flex items-center gap-2 rounded-[18px] border border-[#E5E8EB] bg-[#F7F8FA] px-4 py-3">
                      <input
                        className="w-full bg-transparent text-[17px] font-semibold text-[#191F28] outline-none"
                        inputMode="numeric"
                        onChange={(event) => setWeight(sanitizePositiveIntegerInput(event.target.value))}
                        placeholder="70"
                        pattern="[0-9]*"
                        type="text"
                        value={weight}
                      />
                      <span className="text-[13px] font-medium text-[#8B95A1]">kg</span>
                    </div>
                    {weightHelper ? <p className="mt-2 text-[12px] text-[#8B95A1]">{weightHelper}</p> : null}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[12px] font-semibold text-[#191F28]">목표</p>
                  <div className="flex flex-col gap-2">
                    {GOAL_OPTIONS.map((item) => (
                      <button
                        key={item.key}
                        className={`rounded-[20px] border p-4 text-left transition-colors ${
                          goal === item.key ? "border-[#3182F6] bg-[#EBF3FE]" : "border-[#E5E8EB] bg-[#F7F8FA]"
                        }`}
                        onClick={() => setGoal(item.key)}
                        type="button"
                      >
                        <p className={`text-[14px] font-semibold ${goal === item.key ? "text-[#3182F6]" : "text-[#191F28]"}`}>
                          {item.label}
                        </p>
                        <p className="mt-2 text-[12px] leading-5 text-[#8B95A1]">{item.helper}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[22px] border border-[#E5E8EB] bg-[#F7F8FA] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-semibold text-[#8B95A1]">계산된 단백질 목표</p>
                      <p className="mt-2 text-[30px] font-bold leading-none text-[#191F28]">
                        {proteinTarget || 0}
                        <span className="ml-1 text-[16px] font-medium text-[#8B95A1]">g</span>
                      </p>
                    </div>
                    <span className="rounded-full bg-[#FFFFFF] px-3 py-1.5 text-[11px] font-semibold text-[#3182F6]">
                      {goalOption.label}
                    </span>
                  </div>
                  <p className="mt-3 text-[12px] leading-5 text-[#8B95A1]">
                    {weight ? `${weight}kg x ${goalOption.proteinMultiplier}g/kg` : "몸무게를 입력하면 자동 계산됩니다"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5 px-4 pb-6 pt-6">
          <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[12px] font-semibold text-[#8B95A1]">루틴 설정</p>
                <h1 className="mt-1 text-[28px] font-bold leading-[1.12] tracking-[-0.03em] text-[#191F28]">주간 루틴 구성</h1>
                <p className="mt-2 text-[14px] leading-6 text-[#6B7684]">
                  {routineStage === "focus"
                    ? "요일별 루틴 유형을 정해 주세요"
                    : routineStage === "exercise"
                      ? "해당 요일에 할 운동만 골라 주세요"
                      : "운동 값을 모두 입력해 주세요"}
                </p>
                <p className="mt-3 rounded-2xl bg-[#F7F8FA] px-3 py-2 text-[12px] leading-5 text-[#4E5968]">{routineStageHint}</p>
              </div>
              <div className="shrink-0 rounded-[18px] bg-[#F7F8FA] px-3 py-2 text-right">
                <p className="text-[11px] font-semibold text-[#8B95A1]">완료</p>
                <p className="mt-1 text-[18px] font-bold leading-none text-[#191F28]">
                  {completedRoutineDays.length}/{workingDays.length || 0}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 rounded-[20px] bg-[#F2F4F6] p-1">
              {routineStageCards.map((item) => (
                <button
                  key={item.key}
                  className={`rounded-[18px] px-3 py-3 text-center transition-colors ${
                    routineStage === item.key ? "bg-[#191F28] text-white" : "bg-transparent text-[#6B7684]"
                  } ${item.enabled ? "" : "opacity-40"}`}
                  disabled={!item.enabled}
                  onClick={() => setRoutineStage(item.key)}
                  type="button"
                >
                  <p className="text-[13px] font-semibold">{item.label}</p>
                  <p className="mt-1 text-[11px] leading-4 opacity-90">{item.hint}</p>
                </button>
              ))}
            </div>

            <div className="rounded-[24px] border border-[#E5E8EB] bg-[#FFFFFF] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold text-[#8B95A1]">요일 선택</p>
                  <p className="mt-1 text-[13px] text-[#4E5968]">{selectedDayMeta.full}</p>
                </div>
                <span className="rounded-full bg-[#F8FAFC] px-3 py-1.5 text-[11px] font-semibold text-[#6B7684]">
                  {selectedDayRoutine.bodyParts.length === 0
                    ? "미설정"
                    : isRestDay(selectedDayRoutine.bodyParts)
                      ? "휴식"
                      : selectedDayRoutine.exercises.length > 0 && selectedDayRoutine.exercises.every(isExerciseConfigured)
                        ? "완료"
                        : "입력 필요"}
                </span>
              </div>
              <p className="mt-2 text-[12px] leading-5 text-[#8B95A1]">
                {selectedDayRoutine.bodyParts.length === 0
                  ? "요일을 먼저 골라 루틴을 시작하세요"
                  : isRestDay(selectedDayRoutine.bodyParts)
                    ? "휴식일은 바로 다음 단계로 넘어갈 수 있습니다"
                    : `${selectedDayRoutine.exercises.length}개 운동이 설정되어 있습니다`}
              </p>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {DAY_META.map((day) => {
                  const routine = routines[day.key]
                  const isSelected = selectedDay === day.key
                  const dayPreview = getRoutineDayCardPreview(routine.bodyParts)
                  const isDone =
                    routine.bodyParts.length > 0 &&
                    (isRestDay(routine.bodyParts) ||
                      (routine.exercises.length > 0 && routine.exercises.every(isExerciseConfigured)))
                  const dayStatusLabel = isRestDay(routine.bodyParts)
                    ? "휴식"
                    : routine.bodyParts.length === 0
                      ? "미설정"
                      : routine.exercises.length > 0 && routine.exercises.every(isExerciseConfigured)
                        ? "완료"
                        : "입력 필요"

                  return (
                    <button
                      key={day.key}
                      className={`flex min-w-[74px] flex-shrink-0 flex-col items-center justify-between gap-2 rounded-[20px] border px-2.5 py-3 transition-all ${
                        isSelected
                          ? "border-[#3182F6] bg-[#EBF3FE] shadow-[0_12px_24px_-22px_rgba(49,130,246,0.9)]"
                          : "border-[#E5E8EB] bg-[#F8FAFC]"
                      }`}
                      onClick={() => setSelectedDay(day.key)}
                      type="button"
                    >
                      <span className={`text-[13px] font-semibold ${isSelected ? "text-[#3182F6]" : "text-[#191F28]"}`}>{day.label}</span>
                      <div className="flex min-h-[34px] w-full flex-col items-center justify-center gap-1">
                        <span
                          className={`max-w-full truncate text-center text-[11px] font-semibold leading-none ${
                            isSelected ? "text-[#3182F6]" : "text-[#6B7684]"
                          }`}
                        >
                          {dayPreview.label}
                        </span>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                            isSelected ? "bg-white text-[#3182F6]" : "bg-white text-[#6B7684]"
                          } shadow-[inset_0_0_0_1px_rgba(229,232,235,1)]`}
                        >
                          {dayStatusLabel}
                        </span>
                      </div>
                      <span className={`h-1.5 w-1.5 rounded-full ${isDone ? "bg-[#2CB52C]" : "bg-[#D9DEE3]"}`} />
                    </button>
                  )
                })}
              </div>
            </div>

            {routineStage === "focus" ? (
              <>
                <div className="rounded-[24px] border border-[#E5E8EB] bg-[#FFFFFF] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-semibold text-[#8B95A1]">{routineFocusLabel}</p>
                      <p className="mt-1 text-[13px] text-[#4E5968]">{routineFocusHint}</p>
                    </div>
                    <span className="rounded-full bg-[#F8FAFC] px-3 py-1.5 text-[11px] font-semibold text-[#6B7684]">
                      {selectedDayBodyPartLabel}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {routineFocusOptions.map((part) => (
                      <button
                        key={part}
                        className={`rounded-2xl border py-3 text-[13px] font-medium transition-colors ${
                          selectedDayRoutine.bodyParts.includes(part)
                            ? "border-[#3182F6] bg-[#EBF3FE] text-[#3182F6]"
                            : "border-[#E5E8EB] bg-[#FFFFFF] text-[#191F28]"
                        }`}
                        onClick={() => toggleBodyPart(selectedDay, part)}
                        type="button"
                      >
                        {part}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      className="rounded-xl border border-[#E5E8EB] bg-[#F8FAFC] px-4 py-3 text-[13px] font-medium text-[#4E5968]"
                      onClick={() => copyPreviousDay(selectedDay)}
                      type="button"
                    >
                      이전 요일 복사
                    </button>
                    <button
                      className="rounded-xl border border-[#E5E8EB] bg-[#F8FAFC] px-4 py-3 text-[13px] font-medium text-[#4E5968]"
                      onClick={resetAllDays}
                      type="button"
                    >
                      전체 초기화
                    </button>
                  </div>
                </div>

                <div className="rounded-[24px] border border-[#E5E8EB] bg-[#F8FAFC] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[12px] font-semibold text-[#8B95A1]">설정된 루틴</p>
                    <span className="text-[12px] font-semibold text-[#4E5968]">{workingDays.length}일 선택됨</span>
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    {workingDays.length === 0 ? (
                      <p className="rounded-xl bg-[#FFFFFF] px-3 py-3 text-[13px] text-[#8B95A1]">운동 요일부터 정해 주세요</p>
                    ) : (
                      workingDays.map((day) => {
                        const routine = routines[day.key]
                        return (
                          <div
                            key={day.key}
                            className="flex items-center justify-between rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] px-3 py-3 text-[13px]"
                          >
                            <div>
                              <p className="font-semibold text-[#191F28]">{day.full}</p>
                              <p className="mt-1 text-[11px] text-[#8B95A1]">{formatBodyParts(routine.bodyParts)}</p>
                            </div>
                            <span className="rounded-full bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-semibold text-[#8B95A1]">
                              {routine.exercises.length}개
                            </span>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </>
            ) : null}

            {routineStage === "exercise" ? (
              <>
                <div className="rounded-[24px] border border-[#DCE7FB] bg-[#F7FBFF] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-[#3182F6]">슈퍼세트 안내</p>
                      <p className="mt-1 text-[13px] leading-6 text-[#4E5968]">
                        세트 기반 운동 2개를 고르면 아래 카드에서 바로 묶을 수 있습니다. 연속 배치된 운동끼리 함께 진행하면 라운드 관리가 쉬워집니다.
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#FFFFFF] px-3 py-1.5 text-[11px] font-semibold text-[#3182F6]">
                      {selectedDaySupersetPairCount > 0 ? `${selectedDaySupersetPairCount}쌍 연결됨` : "연결 없음"}
                    </span>
                  </div>
                </div>

                <div className="rounded-[24px] border border-[#E5E8EB] bg-[#FFFFFF] p-4">
                  <div className="flex items-center gap-2 rounded-2xl border border-[#E5E8EB] bg-[#F8FAFC] px-3 py-2.5">
                    <SearchIcon className="flex-shrink-0 text-[#8B95A1]" size={18} />
                    <input
                      className="flex-1 bg-transparent text-[14px] text-[#191F28] outline-none placeholder:text-[#8B95A1]"
                      onChange={(event) => setMachineSearch(event.target.value)}
                      placeholder="머신 검색"
                      type="text"
                      value={machineSearch}
                    />
                    {machineSearch ? (
                      <button onClick={() => setMachineSearch("")} type="button">
                        <XIcon className="text-[#8B95A1]" size={16} />
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {MACHINE_CATEGORIES.map((category) => (
                      <button
                        key={category.key}
                        className={`flex-shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                          machineCategory === category.key
                            ? "bg-[#3182F6] text-white"
                            : "border border-[#E5E8EB] bg-[#F8FAFC] text-[#4E5968]"
                        }`}
                        onClick={() => setMachineCategory(category.key)}
                        type="button"
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedDayNeedsExercise ? (
                  <div className="rounded-[24px] border border-[#E5E8EB] bg-[#FFFFFF] p-2">
                    {prioritizedMachines.length === 0 ? (
                      <div className="px-3 py-8 text-center">
                        <p className="text-[14px] font-semibold text-[#191F28]">검색 결과가 없습니다</p>
                        <p className="mt-2 text-[12px] text-[#8B95A1]">검색어나 카테고리를 바꿔 보세요</p>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {prioritizedMachines.map((machine) => {
                          const currentExercise = selectedDayRoutine.exercises.find((exercise) => exercise.machineId === machine.id)
                          const isSelected = Boolean(currentExercise)

                          return (
                            <button
                              key={machine.id}
                              className="flex items-center justify-between rounded-2xl px-3 py-3 text-left hover:bg-[#F8FAFC]"
                              onClick={() =>
                                isSelected ? removeExercise(selectedDay, currentExercise!.id) : addExercise(selectedDay, machine.id)
                              }
                              type="button"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <MachineVisual category={machine.category} machineId={machine.id} selected={isSelected} size={40} />
                                <div className="min-w-0">
                                  <p className={`truncate text-[13px] font-semibold ${isSelected ? "text-[#3182F6]" : "text-[#191F28]"}`}>
                                    {machine.name}
                                  </p>
                                  <div className="mt-1 flex items-center gap-1.5">
                                    <span className="rounded-full bg-[#F2F4F6] px-1.5 py-0.5 text-[10px] font-semibold text-[#6B7684]">
                                      {getMachineVisualLabel(machine.id, machine.category)}
                                    </span>
                                    <p className="truncate text-[11px] text-[#8B95A1]">{machine.muscle}</p>
                                  </div>
                                </div>
                              </div>
                              <span
                                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                                  isSelected ? "bg-[#EBF3FE] text-[#3182F6]" : "bg-[#F8FAFC] text-[#8B95A1]"
                                }`}
                              >
                                {isSelected ? "선택됨" : "추가"}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ) : isRestDay(selectedDayRoutine.bodyParts) ? (
                  <div className="rounded-[24px] border border-[#E5E8EB] bg-[#FFFFFF] px-4 py-6 text-center">
                    <p className="text-[14px] font-semibold text-[#191F28]">{selectedDayMeta.full}은 휴식일입니다</p>
                    <p className="mt-2 text-[12px] text-[#8B95A1]">휴식일은 운동 선택 없이 넘어갈 수 있습니다</p>
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-[#E5E8EB] bg-[#FFFFFF] px-4 py-6 text-center">
                    <p className="text-[14px] font-semibold text-[#191F28]">먼저 {routineFocusLabel}을 선택해 주세요</p>
                    <p className="mt-2 text-[12px] text-[#8B95A1]">선택한 기준에 맞춰 추천 머신이 먼저 정렬됩니다</p>
                  </div>
                )}

                <div className="rounded-[24px] border border-[#E5E8EB] bg-[#F8FAFC] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-semibold text-[#8B95A1]">선택한 운동</p>
                      <p className="mt-1 text-[12px] text-[#4E5968]">
                        {selectedDayExerciseCount > 0
                          ? `${selectedDayCompletedExercises}/${selectedDayExerciseCount}개가 다음 입력 단계로 이어집니다`
                          : "운동을 추가하면 아래에서 슈퍼세트와 입력 상태를 바로 확인할 수 있습니다"}
                      </p>
                    </div>
                    <span className="text-[12px] font-semibold text-[#4E5968]">{selectedDayRoutine.exercises.length}개</span>
                  </div>
                  {selectedDayRoutine.exercises.length === 0 ? (
                    <p className="mt-3 rounded-xl bg-[#FFFFFF] px-3 py-3 text-[13px] text-[#8B95A1]">선택된 운동이 없습니다</p>
                  ) : (
                    <div className="mt-3 flex flex-col gap-2">
                      {selectedDayRoutine.exercises.map((exercise, index) => {
                        const isPairedWithPrevious = isSupersetPair(selectedDayRoutine.exercises[index - 1], exercise)
                        const canTogglePair = canToggleSupersetPair(selectedDayRoutine.exercises, index)

                        return (
                          <div
                            key={exercise.id}
                            className={`rounded-xl border px-3 py-3 ${
                              exercise.supersetGroupId ? "border-[#DCE7FB] bg-[#F7FBFF]" : "border-[#E5E8EB] bg-[#FFFFFF]"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <MachineVisual machineId={exercise.machineId} size={40} />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="truncate font-semibold text-[#191F28]">{exercise.machineName}</p>
                                    {exercise.supersetGroupId ? (
                                      <span className="shrink-0 rounded-full bg-[#EBF3FE] px-2 py-0.5 text-[10px] font-semibold text-[#3182F6]">
                                        슈퍼세트
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="mt-1 text-[11px] text-[#8B95A1]">{formatExerciseMetricSummary(exercise)}</p>
                                  {isPairedWithPrevious ? (
                                    <p className="mt-1 text-[11px] text-[#3182F6]">
                                      {formatSupersetExerciseNames([selectedDayRoutine.exercises[index - 1], exercise])}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                              <button
                                className="rounded-full p-1 text-[#8B95A1]"
                                onClick={() => removeExercise(selectedDay, exercise.id)}
                                type="button"
                              >
                                <Trash2Icon size={16} />
                              </button>
                            </div>
                            {canTogglePair ? (
                              <button
                                className={`mt-3 w-full rounded-xl px-3 py-2 text-[12px] font-semibold ${
                                  isPairedWithPrevious
                                    ? "bg-[#F2F4F6] text-[#4E5968]"
                                    : "bg-[#EBF3FE] text-[#3182F6]"
                                }`}
                                onClick={() => toggleExerciseSuperset(selectedDay, index)}
                                type="button"
                              >
                                {isPairedWithPrevious ? "슈퍼세트 해제" : "위 운동과 슈퍼세트"}
                              </button>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : null}

            {routineStage === "details" ? (
              <>
                {selectedDayNeedsExercise ? (
                  <div className="rounded-[24px] border border-[#E5E8EB] bg-[#FFFFFF] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[12px] font-semibold text-[#8B95A1]">운동 입력</p>
                        <p className="mt-1 text-[13px] text-[#4E5968]">
                          {selectedDayMeta.full} · {selectedDayBodyPartLabel}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#F8FAFC] px-3 py-1.5 text-[11px] font-semibold text-[#6B7684]">
                        {selectedDayRoutine.exercises.length}개
                      </span>
                    </div>
                    <div className="mt-3 rounded-2xl bg-[#F7FBFF] px-3 py-3">
                      <p className="text-[11px] font-semibold text-[#3182F6]">슈퍼세트 확인</p>
                      <p className="mt-1 text-[12px] leading-5 text-[#4E5968]">
                        {selectedDaySupersetPairCount > 0
                          ? `현재 ${selectedDaySupersetPairCount}쌍이 연결되어 있습니다. 연결 변경은 운동 선택 단계에서 할 수 있습니다.`
                          : "슈퍼세트 설정은 운동 선택 단계에서 합니다. 필요하면 이전 단계에서 바로 위 운동과 묶어 주세요."}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-col gap-3">
                      {selectedDayRoutine.exercises.map((exercise) => {
                        const profile = getExerciseMetricProfile(exercise.machineId)
                        const sanitizeMetricValue =
                          profile.trackingMode === "singleSession"
                            ? sanitizeNonNegativeDecimalInput
                            : sanitizePositiveIntegerInput
                        const metricInputMode = profile.trackingMode === "singleSession" ? "decimal" : "numeric"
                        const metricPattern =
                          profile.trackingMode === "singleSession" ? "[0-9]*[.]?[0-9]*" : "[0-9]*"

                        return (
                          <div key={exercise.id} className="rounded-2xl border border-[#E5E8EB] bg-[#F8FAFC] p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <MachineVisual machineId={exercise.machineId} size={40} />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="truncate text-[13px] font-semibold text-[#191F28]">{exercise.machineName}</p>
                                    {exercise.supersetGroupId ? (
                                      <span className="shrink-0 rounded-full bg-[#EBF3FE] px-2 py-0.5 text-[10px] font-semibold text-[#3182F6]">
                                        슈퍼세트
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="mt-1 text-[11px] text-[#8B95A1]">
                                    {exercise.supersetGroupId ? "슈퍼세트는 세트 수가 함께 맞춰집니다" : getExerciseMetricHint(exercise.machineId)}
                                  </p>
                                </div>
                              </div>
                              <button
                                className="rounded-full p-1 text-[#8B95A1]"
                                onClick={() => removeExercise(selectedDay, exercise.id)}
                                type="button"
                              >
                                <Trash2Icon size={16} />
                              </button>
                            </div>

                            <div className="mt-3 flex flex-col gap-2">
                              {profile.fields.map((item) => (
                                <label key={item.field} className="flex items-center justify-between gap-3 rounded-xl bg-[#FFFFFF] px-3 py-3">
                                  <span className="text-[13px] font-medium text-[#4E5968]">{item.label}</span>
                                  <div className="flex items-center gap-1">
                                    <input
                                      className="w-20 bg-transparent text-right text-[14px] font-semibold text-[#191F28] outline-none"
                                      inputMode={metricInputMode}
                                      onChange={(event) =>
                                        updateExercise(
                                          selectedDay,
                                          exercise.id,
                                          item.field,
                                          sanitizeMetricValue(event.target.value),
                                        )
                                      }
                                      placeholder={item.placeholder}
                                      pattern={metricPattern}
                                      type="text"
                                      value={exercise[item.field]}
                                    />
                                    <span className="text-[11px] text-[#8B95A1]">{item.unit}</span>
                                  </div>
                                </label>
                              ))}
                            </div>

                            {profile.presetValues ? (
                              <div className="mt-2 flex gap-1.5">
                                {profile.presetValues.map((preset) => (
                                  <button
                                    key={preset.label}
                                    className="flex-1 rounded-lg border border-[#E5E8EB] bg-[#FFFFFF] py-1.5 text-[11px] font-medium text-[#4E5968]"
                                    onClick={() => {
                                      Object.entries(preset.values).forEach(([field, value]) => {
                                        updateExercise(selectedDay, exercise.id, field as ExerciseField, value ?? "")
                                      })
                                    }}
                                    type="button"
                                  >
                                    {preset.label}
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : isRestDay(selectedDayRoutine.bodyParts) ? (
                  <div className="rounded-[24px] border border-[#E5E8EB] bg-[#FFFFFF] px-4 py-6 text-center">
                    <p className="text-[14px] font-semibold text-[#191F28]">{selectedDayMeta.full}은 휴식일입니다</p>
                    <p className="mt-2 text-[12px] text-[#8B95A1]">휴식일은 운동 입력 없이 완료됩니다</p>
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-[#E5E8EB] bg-[#FFFFFF] px-4 py-6 text-center">
                    <p className="text-[14px] font-semibold text-[#191F28]">운동을 먼저 선택해 주세요</p>
                    <p className="mt-2 text-[12px] text-[#8B95A1]">운동 선택 단계에서 머신을 추가한 뒤 운동 값을 입력할 수 있습니다</p>
                  </div>
                )}

                <div className="rounded-[24px] border border-[#E5E8EB] bg-[#F8FAFC] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[12px] font-semibold text-[#8B95A1]">루틴 진행 상태</p>
                    <span className="text-[12px] font-semibold text-[#4E5968]">{completedRoutineDays.length}일 완료</span>
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    {workingDays.length === 0 ? (
                      <p className="rounded-xl bg-[#FFFFFF] px-3 py-3 text-[13px] text-[#8B95A1]">운동일이 아직 없습니다</p>
                    ) : (
                      workingDays.map((day) => {
                        const routine = routines[day.key]
                        const isDone = routine.exercises.length > 0 && routine.exercises.every(isExerciseConfigured)

                        return (
                          <div
                            key={day.key}
                            className="flex items-center justify-between rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] px-3 py-3 text-[13px]"
                          >
                            <div>
                              <p className="font-semibold text-[#191F28]">{day.full}</p>
                              <p className="mt-1 text-[11px] text-[#8B95A1]">
                                {formatBodyParts(routine.bodyParts)} · 운동 {routine.exercises.length}개
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                isDone ? "bg-[#EBF3FE] text-[#3182F6]" : "bg-[#F8FAFC] text-[#8B95A1]"
                              }`}
                            >
                              {isDone ? "완료" : "입력 필요"}
                            </span>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#EEF1F4] bg-[rgba(255,255,255,0.96)] px-4 py-3 pb-safe-bottom backdrop-blur">
        <div className="mx-auto max-w-[480px]">
          <div className="mb-3 rounded-2xl bg-[#F7F8FA] px-3 py-2 text-center">
            <p className="text-[11px] font-semibold text-[#8B95A1]">
              {step === 1
                ? "프로필을 먼저 완성해요"
                : routineStage === "focus"
                  ? "부위를 정해 다음 단계를 여세요"
                  : routineStage === "exercise"
                    ? "운동을 선택하고 슈퍼세트를 묶어요"
                    : "모든 값을 입력해 마무리해요"}
            </p>
            <p className="mt-1 text-[12px] text-[#4E5968]">{step === 1 ? profileSummary : routineSummary}</p>
          </div>
          <div className="flex gap-2">
            {step === 1 ? null : (
              <button
                className="flex-1 rounded-[18px] border border-[#E5E8EB] bg-[#F7F8FA] py-3 text-[14px] font-semibold text-[#4E5968]"
                onClick={() => {
                  if (routineStage === "focus") {
                    if (onBackToProfile) {
                      onBackToProfile()
                      return
                    }

                    setStep(1)
                    return
                  }

                  setRoutineStage(routineStage === "details" ? "exercise" : "focus")
                }}
                type="button"
              >
                이전
              </button>
            )}
            <button
              className={`flex-1 rounded-2xl py-3 text-[14px] font-semibold text-white transition-opacity ${
                (step === 1
                  ? canProceedProfile
                  : routineStage === "focus"
                    ? canGoExerciseStage
                    : routineStage === "exercise"
                      ? canGoDetailStage
                      : canCompleteRoutine)
                  ? "bg-[#191F28] active:opacity-80"
                  : "bg-[#E5E8EB] text-[#8B95A1]"
              }`}
              disabled={
                step === 1
                  ? !canProceedProfile
                  : routineStage === "focus"
                    ? !canGoExerciseStage
                    : routineStage === "exercise"
                      ? !canGoDetailStage
                      : !canCompleteRoutine
              }
              onClick={() => {
                if (step === 1) {
                  if (onProfileNext) {
                    onProfileNext(
                      {
                        gender,
                        height,
                        weight,
                        goal,
                      },
                      routines,
                    )
                    return
                  }

                  setStep(2)
                  setRoutineStage("focus")
                  return
                }

                if (routineStage === "focus") {
                  setRoutineStage("exercise")
                  return
                }

                if (routineStage === "exercise") {
                  setRoutineStage("details")
                  return
                }

                if (gender !== "male" && gender !== "female") {
                  return
                }

                onComplete({
                  profile: {
                    gender,
                    height: Number(height),
                    weight: Number(weight),
                    goal,
                    proteinTarget,
                  },
                  routines,
                })
              }}
              type="button"
            >
              {step === 1 ? "다음" : routineStage === "focus" ? "운동 선택" : routineStage === "exercise" ? "운동 입력" : "앱 시작하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
