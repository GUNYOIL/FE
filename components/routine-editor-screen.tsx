"use client"

import { useEffect, useMemo, useState, type DragEvent, type TouchEvent } from "react"
import {
  DAY_META,
  MACHINE_CATEGORIES,
  MACHINES,
  canToggleSupersetPair,
  createEmptyRoutineMap,
  createExerciseId,
  doesMachineMatchCategory,
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
  getTodayDayKey,
  hasWorkoutBodyParts,
  isExerciseConfigured,
  isRestDay,
  isSupersetPair,
  normalizeExerciseSupersets,
  reorderExerciseDrafts,
  toggleSupersetPair,
  toggleBodyPartSelection,
  type DayKey,
  type ExerciseField,
  type MachineCategoryKey,
  type RoutineFocus,
  type RoutineMap,
  type UserProfile,
} from "@/lib/app-config"
import { sanitizeNonNegativeDecimalInput, sanitizePositiveIntegerInput } from "@/lib/numeric-input"
import { GripVerticalIcon, SearchIcon, Trash2Icon, XIcon } from "./icons"
import MachineVisual from "./machine-visual"

type RoutineStage = "focus" | "exercise" | "details"

function cloneRoutineMap(routines: RoutineMap): RoutineMap {
  return DAY_META.reduce((accumulator, day) => {
    accumulator[day.key] = {
      bodyParts: [...routines[day.key].bodyParts],
      exercises: routines[day.key].exercises.map((exercise) => ({ ...exercise })),
    }
    return accumulator
  }, {} as RoutineMap)
}

function getInitialDay(routines: RoutineMap): DayKey {
  return (
    DAY_META.find((day) => {
      const routine = routines[day.key]
      return hasWorkoutBodyParts(routine.bodyParts)
    })?.key ?? getTodayDayKey()
  )
}

export default function RoutineEditorScreen({
  onBack,
  onSave,
  profile,
  routines,
}: {
  onBack: () => void
  onSave: (nextRoutines: RoutineMap) => void
  profile: UserProfile
  routines: RoutineMap
}) {
  const [draftRoutines, setDraftRoutines] = useState<RoutineMap>(() => cloneRoutineMap(routines))
  const [selectedDay, setSelectedDay] = useState<DayKey>(() => getInitialDay(routines))
  const [routineStage, setRoutineStage] = useState<RoutineStage>("focus")
  const [machineSearch, setMachineSearch] = useState("")
  const [machineCategory, setMachineCategory] = useState<MachineCategoryKey>("all")
  const [draggedExerciseId, setDraggedExerciseId] = useState<string | null>(null)
  const [dragOverExerciseId, setDragOverExerciseId] = useState<string | null>(null)

  useEffect(() => {
    const initialDay = getInitialDay(routines)
    setDraftRoutines(cloneRoutineMap(routines))
    setSelectedDay(initialDay)
    setRoutineStage("focus")
    setMachineSearch("")
    setMachineCategory(getPrimaryMachineCategory(routines[initialDay].bodyParts))
  }, [routines])

  const goalOption = getGoalOption(profile.goal)
  const routineFocusOptions = getRoutineFocusOptions(profile.goal)
  const routineFocusLabel = getRoutineFocusLabel(profile.goal)
  const routineFocusHint = getRoutineFocusHint(profile.goal)
  const selectedDayRoutine = draftRoutines[selectedDay]
  const selectedDayMeta = getDayMeta(selectedDay)
  const selectedDayBodyPartLabel = formatBodyParts(selectedDayRoutine.bodyParts)
  const selectedDayNeedsExercise = hasWorkoutBodyParts(selectedDayRoutine.bodyParts)

  const workingDays = DAY_META.filter((day) => {
    const routine = draftRoutines[day.key]
    return hasWorkoutBodyParts(routine.bodyParts)
  })
  const completedRoutineDays = workingDays.filter((day) => {
    const routine = draftRoutines[day.key]
    return routine.exercises.length > 0 && routine.exercises.every(isExerciseConfigured)
  })
  const incompleteDays = workingDays.filter((day) => {
    const routine = draftRoutines[day.key]
    return routine.exercises.length === 0 || routine.exercises.some((exercise) => !isExerciseConfigured(exercise))
  })
  const totalExercises = Object.values(draftRoutines).reduce((sum, routine) => sum + routine.exercises.length, 0)

  const canGoExerciseStage = selectedDayRoutine.bodyParts.length > 0
  const canGoDetailStage =
    isRestDay(selectedDayRoutine.bodyParts) || (selectedDayRoutine.bodyParts.length > 0 && selectedDayRoutine.exercises.length > 0)
  const canSave = workingDays.length > 0 && incompleteDays.length === 0
  const selectedDayExerciseCount = selectedDayRoutine.exercises.length
  const selectedDayCompletedExercises = selectedDayRoutine.exercises.filter(isExerciseConfigured).length
  const canReorderExercises = selectedDayExerciseCount > 1
  const selectedDaySupersetPairCount = new Set(
    selectedDayRoutine.exercises.flatMap((exercise) => (exercise.supersetGroupId ? [exercise.supersetGroupId] : [])),
  ).size
  const routineStageCards = [
    { key: "focus" as const, label: "부위 설정", hint: "요일의 운동 타입을 먼저 정합니다", enabled: true },
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
  const routineStageHint =
    routineStage === "focus"
      ? "먼저 요일의 부위를 정하면 아래 단계가 활성화됩니다"
      : routineStage === "exercise"
        ? "운동을 2개 이상 이어 붙이면 슈퍼세트를 만들 수 있습니다"
        : "선택한 운동의 값을 모두 입력하면 저장할 수 있습니다"
  const selectedDayStatusLabel = isRestDay(selectedDayRoutine.bodyParts)
    ? "휴식일"
    : selectedDayRoutine.bodyParts.length === 0
      ? "미설정"
      : selectedDayExerciseCount > 0
        ? selectedDayExerciseCount === selectedDayCompletedExercises
          ? "완료"
          : "입력 필요"
        : "운동 없음"
  const selectedDayStatusTone =
    selectedDayStatusLabel === "완료"
      ? "bg-[#EBF3FE] text-[#3182F6]"
      : selectedDayStatusLabel === "입력 필요"
        ? "bg-[#FFF7ED] text-[#C2410C]"
        : selectedDayStatusLabel === "휴식일"
          ? "bg-[#F2F4F6] text-[#4E5968]"
          : "bg-[#F8FAFC] text-[#8B95A1]"
  const selectedDayProgressText =
    selectedDayRoutine.bodyParts.length === 0
      ? "먼저 부위를 선택해 루틴을 시작하세요"
      : isRestDay(selectedDayRoutine.bodyParts)
        ? "휴식일은 바로 저장할 수 있습니다"
        : selectedDayExerciseCount === 0
          ? "운동을 추가해야 다음 단계로 넘어갈 수 있습니다"
          : `${selectedDayCompletedExercises}/${selectedDayExerciseCount}개 운동이 저장 가능한 상태입니다`

  const prioritizedMachines = useMemo(() => {
    return MACHINES.filter((machine) => {
      const matchesSearch = machine.name.toLowerCase().includes(machineSearch.toLowerCase())
      const matchesCategory = doesMachineMatchCategory(machine.id, machineCategory, machine.category)
      return matchesSearch && matchesCategory
    }).sort((left, right) => {
      const preferredCategories = getPreferredMachineCategories(selectedDayRoutine.bodyParts)
      const leftRank = preferredCategories.some((category) => doesMachineMatchCategory(left.id, category, left.category)) ? 0 : 1
      const rightRank = preferredCategories.some((category) => doesMachineMatchCategory(right.id, category, right.category)) ? 0 : 1
      return leftRank - rightRank
    })
  }, [machineCategory, machineSearch, selectedDayRoutine.bodyParts])

  useEffect(() => {
    if (routineStage !== "exercise") {
      return
    }

    setMachineCategory(getPrimaryMachineCategory(selectedDayRoutine.bodyParts))
  }, [routineStage, selectedDay, selectedDayRoutine.bodyParts])

  useEffect(() => {
    setDraggedExerciseId(null)
    setDragOverExerciseId(null)
  }, [routineStage, selectedDay])

  const initialSignature = useMemo(() => JSON.stringify(routines), [routines])
  const draftSignature = useMemo(() => JSON.stringify(draftRoutines), [draftRoutines])
  const isDirty = initialSignature !== draftSignature

  useEffect(() => {
    if (!isDirty) {
      return
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isDirty])

  const toggleBodyPart = (dayKey: DayKey, nextBodyPart: RoutineFocus) => {
    setDraftRoutines((previous) => ({
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
    const previousRoutine = draftRoutines[previousDayKey]

    setDraftRoutines((previous) => ({
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
    setDraftRoutines(createEmptyRoutineMap())
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

    setDraftRoutines((previous) => ({
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
    setDraftRoutines((previous) => ({
      ...previous,
      [dayKey]: {
        ...previous[dayKey],
        exercises: normalizeExerciseSupersets(previous[dayKey].exercises.filter((exercise) => exercise.id !== exerciseId)),
      },
    }))
  }

  const updateExercise = (dayKey: DayKey, exerciseId: string, field: ExerciseField, value: string) => {
    setDraftRoutines((previous) => {
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
    setDraftRoutines((previous) => ({
      ...previous,
      [dayKey]: {
        ...previous[dayKey],
        exercises: toggleSupersetPair(previous[dayKey].exercises, index, dayKey),
      },
    }))
  }

  const resetExerciseDragState = () => {
    setDraggedExerciseId(null)
    setDragOverExerciseId(null)
  }

  const reorderExercises = (dayKey: DayKey, sourceExerciseId: string, targetExerciseId: string) => {
    if (sourceExerciseId === targetExerciseId) {
      return
    }

    setDraftRoutines((previous) => {
      const exercises = previous[dayKey].exercises
      const sourceIndex = exercises.findIndex((exercise) => exercise.id === sourceExerciseId)
      const targetIndex = exercises.findIndex((exercise) => exercise.id === targetExerciseId)

      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
        return previous
      }

      return {
        ...previous,
        [dayKey]: {
          ...previous[dayKey],
          exercises: reorderExerciseDrafts(exercises, sourceIndex, targetIndex),
        },
      }
    })
  }

  const handleExerciseDragStart = (event: DragEvent<HTMLButtonElement>, exerciseId: string) => {
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("text/plain", exerciseId)
    setDraggedExerciseId(exerciseId)
    setDragOverExerciseId(null)
  }

  const handleExerciseDragOver = (event: DragEvent<HTMLDivElement>, exerciseId: string) => {
    if (!draggedExerciseId || draggedExerciseId === exerciseId) {
      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect = "move"

    if (dragOverExerciseId !== exerciseId) {
      setDragOverExerciseId(exerciseId)
    }
  }

  const handleExerciseDrop = (event: DragEvent<HTMLDivElement>, dayKey: DayKey, exerciseId: string) => {
    event.preventDefault()

    if (draggedExerciseId && draggedExerciseId !== exerciseId) {
      reorderExercises(dayKey, draggedExerciseId, exerciseId)
    }

    resetExerciseDragState()
  }

  const handleExerciseTouchStart = (exerciseId: string) => {
    setDraggedExerciseId(exerciseId)
    setDragOverExerciseId(null)
  }

  const handleExerciseTouchMove = (event: TouchEvent<HTMLButtonElement>) => {
    if (!draggedExerciseId) {
      return
    }

    const touch = event.touches[0]
    if (!touch) {
      return
    }

    event.preventDefault()
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY)?.closest<HTMLElement>("[data-exercise-id]")
    const nextExerciseId = targetElement?.dataset.exerciseId ?? null
    setDragOverExerciseId(nextExerciseId && nextExerciseId !== draggedExerciseId ? nextExerciseId : null)
  }

  const handleExerciseTouchEnd = (dayKey: DayKey) => {
    if (draggedExerciseId && dragOverExerciseId && draggedExerciseId !== dragOverExerciseId) {
      reorderExercises(dayKey, draggedExerciseId, dragOverExerciseId)
    }

    resetExerciseDragState()
  }

  const handleDismiss = () => {
    if (!isDirty) {
      onBack()
      return
    }

    const shouldLeave = window.confirm("저장하지 않은 루틴 변경사항이 있습니다. 나가시겠습니까?")
    if (shouldLeave) {
      onBack()
    }
  }

  const routineSummary =
    routineStage === "focus"
      ? canGoExerciseStage
        ? `${selectedDayMeta.full} · ${selectedDayBodyPartLabel}`
        : `선택한 요일의 ${routineFocusLabel}을 먼저 정해 주세요`
      : routineStage === "exercise"
        ? isRestDay(selectedDayRoutine.bodyParts)
          ? `${selectedDayMeta.full}은 휴식일입니다`
          : `${selectedDayRoutine.exercises.length}개 운동 선택됨`
        : canSave
          ? `${completedRoutineDays.length}일 루틴 저장 준비 완료`
          : workingDays.length === 0
            ? "최소 1일 이상의 운동일을 설정해 주세요"
            : `${incompleteDays.length}일의 운동 정보를 더 입력해 주세요`

  return (
    <div className="mx-auto flex min-h-svh max-w-[480px] flex-col bg-[#F2F4F6]">
      <header className="sticky top-0 z-20 border-b border-[#E5E8EB] bg-[#FFFFFF] px-4 pt-safe-top">
        <div className="flex h-14 items-center justify-between">
          <button className="text-[14px] font-semibold text-[#4E5968]" onClick={handleDismiss} type="button">
            닫기
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[17px] font-bold text-[#191F28]">루틴 수정</span>
            <span className="rounded-full bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-medium text-[#8B95A1]">
              {routineStage === "focus" ? "부위" : routineStage === "exercise" ? "운동" : "입력"}
            </span>
          </div>
          <span className="rounded-full bg-[#EBF3FE] px-3 py-1.5 text-[11px] font-semibold text-[#3182F6]">
            {goalOption.label}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-32 no-scrollbar">
        <div className="flex flex-col gap-5 px-4 pb-6 pt-6">
          <div className="rounded-[28px] border border-[#E5E8EB] bg-[#FFFFFF] p-5 shadow-[0_20px_36px_-32px_rgba(15,23,42,0.24)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8B95A1]">Routine</p>
                <p className="mt-2 text-[13px] font-medium text-[#6B7684]">{routineSummary}</p>
              </div>
              <div className="flex px-3 py-2 shrink-0 flex-col items-center justify-center rounded-[14px] border border-[#DCE7FB] bg-[#EBF3FE] text-center">
                <p className="text-[11px] font-medium text-[#6B7684]">완료</p>
                <p className="mt-1 text-[18px] font-bold leading-none text-[#3182F6]">
                  {completedRoutineDays.length}/{workingDays.length || 0}
                </p>
              </div>
            </div>

            <h1 className="mt-5 text-[23px] font-bold leading-[1.24] tracking-[-0.04em] text-[#191F28]">
              루틴을 단계별로 다시 정리해요
            </h1>
            <p className="mt-2 text-[14px] leading-[1.6] text-[#8B95A1]">
              부위를 바꾸고, 운동을 고르고, 운동 값을 입력한 뒤 저장합니다
            </p>
            <p className="mt-3 rounded-2xl bg-[#F8FAFC] px-3 py-2 text-[12px] leading-5 text-[#4E5968]">{routineStageHint}</p>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-[#F8FAFC] px-3 py-3">
                <p className="text-[11px] font-medium text-[#8B95A1]">운동일</p>
                <p className="mt-1 text-[17px] font-bold text-[#191F28]">{workingDays.length}일</p>
              </div>
              <div className="rounded-2xl bg-[#F8FAFC] px-3 py-3">
                <p className="text-[11px] font-medium text-[#8B95A1]">완료</p>
                <p className="mt-1 text-[17px] font-bold text-[#191F28]">{completedRoutineDays.length}일</p>
              </div>
              <div className="rounded-2xl bg-[#F8FAFC] px-3 py-3">
                <p className="text-[11px] font-medium text-[#8B95A1]">총 운동</p>
                <p className="mt-1 text-[17px] font-bold text-[#191F28]">{totalExercises}개</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {routineStageCards.map((item) => (
              <button
                key={item.key}
                className={`rounded-2xl border px-3 py-3 text-left transition-colors ${
                  routineStage === item.key ? "border-[#3182F6] bg-[#EBF3FE]" : "border-[#E5E8EB] bg-[#FFFFFF]"
                } ${item.enabled ? "" : "opacity-50"}`}
                disabled={!item.enabled}
                onClick={() => setRoutineStage(item.key)}
                type="button"
              >
                <p className={`text-[13px] font-semibold ${routineStage === item.key ? "text-[#3182F6]" : "text-[#191F28]"}`}>{item.label}</p>
                <p className={`mt-1 text-[11px] leading-4 ${routineStage === item.key ? "text-[#3182F6]" : "text-[#8B95A1]"}`}>
                  {item.hint}
                </p>
              </button>
            ))}
          </div>

          <div className="rounded-[24px] border border-[#E5E8EB] bg-[#FFFFFF] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[12px] font-semibold text-[#8B95A1]">요일 선택</p>
                <p className="mt-1 text-[13px] text-[#4E5968]">{selectedDayMeta.full}</p>
              </div>
              <span className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${selectedDayStatusTone}`}>{selectedDayStatusLabel}</span>
            </div>
            <p className="mt-2 text-[12px] leading-5 text-[#8B95A1]">{selectedDayProgressText}</p>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {DAY_META.map((day) => {
                const routine = draftRoutines[day.key]
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
                    <span className={`text-[13px] font-semibold ${isSelected ? "text-[#3182F6]" : "text-[#191F28]"}`}>
                      {day.label}
                    </span>
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
                      const routine = draftRoutines[day.key]
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
                        ? `${selectedDayCompletedExercises}/${selectedDayExerciseCount}개가 다음 입력 단계로 이어집니다${
                            canReorderExercises ? " · 핸들을 드래그해 순서를 바꿀 수 있습니다" : ""
                          }`
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
                      const isDragSource = draggedExerciseId === exercise.id
                      const isDropTarget = dragOverExerciseId === exercise.id && !isDragSource

                      return (
                        <div
                          key={exercise.id}
                          className={`rounded-xl border px-3 py-3 transition-colors ${
                            isDropTarget
                              ? "border-[#B7D1FA] bg-[#EEF5FF]"
                              : exercise.supersetGroupId
                                ? "border-[#DCE7FB] bg-[#F7FBFF]"
                                : "border-[#E5E8EB] bg-[#FFFFFF]"
                          }`}
                          data-exercise-id={exercise.id}
                          onDragOver={(event) => handleExerciseDragOver(event, exercise.id)}
                          onDrop={(event) => handleExerciseDrop(event, selectedDay, exercise.id)}
                          onDragEnd={resetExerciseDragState}
                          style={{ opacity: isDragSource ? 0.68 : 1 }}
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
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                aria-label={`${exercise.machineName} 순서 변경`}
                                className="rounded-full p-1 text-[#8B95A1] disabled:opacity-30"
                                disabled={!canReorderExercises}
                                draggable={canReorderExercises}
                                onDragStart={(event) => handleExerciseDragStart(event, exercise.id)}
                                onDragEnd={resetExerciseDragState}
                                onTouchStart={() => handleExerciseTouchStart(exercise.id)}
                                onTouchMove={handleExerciseTouchMove}
                                onTouchEnd={() => handleExerciseTouchEnd(selectedDay)}
                                onTouchCancel={resetExerciseDragState}
                                type="button"
                              >
                                <GripVerticalIcon size={16} />
                              </button>
                              <button
                                className="rounded-full p-1 text-[#8B95A1]"
                                onClick={() => removeExercise(selectedDay, exercise.id)}
                                type="button"
                              >
                                <Trash2Icon size={16} />
                              </button>
                            </div>
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
                      const isCompletionOnly = profile.trackingMode === "completionOnly"
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

                          {isCompletionOnly ? (
                            <div className="mt-3 rounded-xl bg-[#FFFFFF] px-3 py-3">
                              <p className="text-[12px] font-semibold text-[#4E5968]">완료 체크형 운동</p>
                              <p className="mt-1 text-[12px] leading-5 text-[#8B95A1]">
                                세트 입력 없이 오늘 페이지에서 했는지만 체크합니다.
                              </p>
                            </div>
                          ) : (
                            <div className="mt-3 flex flex-col gap-2">
                              {profile.fields.map((item) => (
                                <label
                                  key={item.field}
                                  className="flex items-center justify-between gap-3 rounded-xl bg-[#FFFFFF] px-3 py-3"
                                >
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
                          )}

                          {!isCompletionOnly && profile.presetValues ? (
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
                      const routine = draftRoutines[day.key]
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
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E5E8EB] bg-[#FFFFFF] px-4 py-3 pb-safe-bottom">
        <div className="mx-auto max-w-[480px]">
          <div className="mb-3 rounded-2xl bg-[#F8FAFC] px-3 py-2 text-center">
            <p className="text-[11px] font-semibold text-[#8B95A1]">
              {routineStage === "focus" ? "먼저 부위를 정해요" : routineStage === "exercise" ? "운동을 고르고 슈퍼세트를 묶어요" : "값을 모두 입력해 저장해요"}
            </p>
            <p className="mt-1 text-[12px] text-[#4E5968]">{routineSummary}</p>
          </div>
          <div className="flex gap-2">
            <button
              className="flex-1 rounded-2xl border border-[#E5E8EB] bg-[#FFFFFF] py-3 text-[14px] font-semibold text-[#4E5968]"
              onClick={() => {
                if (routineStage === "focus") {
                  handleDismiss()
                  return
                }

                setRoutineStage(routineStage === "details" ? "exercise" : "focus")
              }}
              type="button"
            >
              {routineStage === "focus" ? "취소" : "이전"}
            </button>
            <button
              className={`flex-1 rounded-2xl py-3 text-[14px] font-semibold text-white transition-opacity ${
                (routineStage === "focus" ? canGoExerciseStage : routineStage === "exercise" ? canGoDetailStage : canSave)
                  ? "bg-[#3182F6] active:opacity-80"
                  : "bg-[#E5E8EB] text-[#8B95A1]"
              }`}
              disabled={routineStage === "focus" ? !canGoExerciseStage : routineStage === "exercise" ? !canGoDetailStage : !canSave}
              onClick={() => {
                if (routineStage === "focus") {
                  setRoutineStage("exercise")
                  return
                }

                if (routineStage === "exercise") {
                  setRoutineStage("details")
                  return
                }

                if (!canSave) {
                  return
                }

                onSave(draftRoutines)
              }}
              type="button"
            >
              {routineStage === "focus" ? "운동 선택" : routineStage === "exercise" ? "운동 입력" : "저장하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
