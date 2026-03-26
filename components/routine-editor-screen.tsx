"use client"

import { useEffect, useMemo, useState } from "react"
import {
  DAY_META,
  MACHINE_CATEGORIES,
  MACHINES,
  SET_PRESETS,
  createEmptyRoutineMap,
  createExerciseId,
  formatBodyParts,
  getDayMeta,
  getGoalOption,
  getMachineVisualLabel,
  getPreferredMachineCategories,
  getRoutineDayCardPreview,
  getRoutineFocusHint,
  getRoutineFocusLabel,
  getRoutineFocusOptions,
  getTodayDayKey,
  hasWorkoutBodyParts,
  isRestDay,
  toggleBodyPartSelection,
  type DayKey,
  type ExerciseDraft,
  type MachineCategoryKey,
  type RoutineFocus,
  type RoutineMap,
  type UserProfile,
} from "@/lib/app-config"
import { SearchIcon, Trash2Icon, XIcon } from "./icons"
import MachineVisual from "./machine-visual"

type RoutineStage = "focus" | "exercise" | "details"
type ExerciseField = "weight" | "reps" | "sets"

function isExerciseConfigured(exercise: ExerciseDraft) {
  return Number(exercise.weight) > 0 && Number(exercise.reps) > 0 && Number(exercise.sets) > 0
}

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

  useEffect(() => {
    setDraftRoutines(cloneRoutineMap(routines))
    setSelectedDay(getInitialDay(routines))
    setRoutineStage("focus")
    setMachineSearch("")
    setMachineCategory("all")
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
        exercises: previous[dayKey].exercises.filter((exercise) => exercise.id !== exerciseId),
      },
    }))
  }

  const updateExercise = (dayKey: DayKey, exerciseId: string, field: ExerciseField, value: string) => {
    setDraftRoutines((previous) => ({
      ...previous,
      [dayKey]: {
        ...previous[dayKey],
        exercises: previous[dayKey].exercises.map((exercise) =>
          exercise.id === exerciseId ? { ...exercise, [field]: value } : exercise,
        ),
      },
    }))
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
            : `${incompleteDays.length}일의 세트 정보를 더 입력해 주세요`

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
              {routineStage === "focus" ? "1/3" : routineStage === "exercise" ? "2/3" : "3/3"}
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
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8B95A1]">Routine</p>
                <h1 className="mt-3 text-[24px] font-bold leading-snug text-[#191F28]">
                  루틴을 단계별로
                  <br />
                  다시 정리해요
                </h1>
                <p className="mt-2 text-[14px] leading-6 text-[#8B95A1]">
                  부위를 바꾸고, 운동을 고르고, 세트 정보를 입력한 뒤 저장합니다
                </p>
              </div>
              <div className="shrink-0 rounded-[18px] bg-[#EBF3FE] px-3 py-2 text-right">
                <p className="text-[11px] font-medium text-[#6B7684]">완료</p>
                <p className="mt-1 text-[18px] font-bold leading-none text-[#3182F6]">
                  {completedRoutineDays.length}/{workingDays.length || 0}
                </p>
              </div>
            </div>

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
            {[
              { key: "focus" as const, label: "부위 설정", enabled: true },
              { key: "exercise" as const, label: "운동 선택", enabled: canGoExerciseStage },
              { key: "details" as const, label: "세트 입력", enabled: canGoDetailStage },
            ].map((item) => (
              <button
                key={item.key}
                className={`rounded-2xl border px-3 py-3 text-left transition-colors ${
                  routineStage === item.key ? "border-[#3182F6] bg-[#EBF3FE]" : "border-[#E5E8EB] bg-[#FFFFFF]"
                } ${item.enabled ? "" : "opacity-50"}`}
                disabled={!item.enabled}
                onClick={() => setRoutineStage(item.key)}
                type="button"
              >
                <p className={`text-[13px] font-semibold ${routineStage === item.key ? "text-[#3182F6]" : "text-[#191F28]"}`}>
                  {item.label}
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
              <span className="rounded-full bg-[#F8FAFC] px-3 py-1.5 text-[11px] font-semibold text-[#6B7684]">
                {selectedDayBodyPartLabel}
              </span>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {DAY_META.map((day) => {
                const routine = draftRoutines[day.key]
                const isSelected = selectedDay === day.key
                const dayPreview = getRoutineDayCardPreview(routine.bodyParts)
                const isDone =
                  routine.bodyParts.length > 0 &&
                  (isRestDay(routine.bodyParts) ||
                    (routine.exercises.length > 0 && routine.exercises.every(isExerciseConfigured)))

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
                      {dayPreview.extraLabel ? (
                        <span className="rounded-full bg-white px-1.5 py-0.5 text-[9px] font-semibold text-[#6B7684] shadow-[inset_0_0_0_1px_rgba(229,232,235,1)]">
                          {dayPreview.extraLabel}
                        </span>
                      ) : (
                        <span className="h-[14px]" />
                      )}
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
                  <p className="text-[12px] font-semibold text-[#8B95A1]">선택한 운동</p>
                  <span className="text-[12px] font-semibold text-[#4E5968]">{selectedDayRoutine.exercises.length}개</span>
                </div>
                {selectedDayRoutine.exercises.length === 0 ? (
                  <p className="mt-3 rounded-xl bg-[#FFFFFF] px-3 py-3 text-[13px] text-[#8B95A1]">선택된 운동이 없습니다</p>
                ) : (
                  <div className="mt-3 flex flex-col gap-2">
                    {selectedDayRoutine.exercises.map((exercise) => (
                      <div
                        key={exercise.id}
                        className="flex items-center justify-between rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] px-3 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <MachineVisual machineId={exercise.machineId} size={40} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[#191F28]">{exercise.machineName}</p>
                            <p className="mt-1 text-[11px] text-[#8B95A1]">
                              {exercise.weight || "-"}kg · {exercise.reps || "-"}회 · {exercise.sets || "-"}세트
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
                    ))}
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
                      <p className="text-[12px] font-semibold text-[#8B95A1]">세트 입력</p>
                      <p className="mt-1 text-[13px] text-[#4E5968]">
                        {selectedDayMeta.full} · {selectedDayBodyPartLabel}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#F8FAFC] px-3 py-1.5 text-[11px] font-semibold text-[#6B7684]">
                      {selectedDayRoutine.exercises.length}개
                    </span>
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                  {selectedDayRoutine.exercises.map((exercise) => (
                    <div key={exercise.id} className="rounded-2xl border border-[#E5E8EB] bg-[#F8FAFC] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <MachineVisual machineId={exercise.machineId} size={40} />
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-[#191F28]">{exercise.machineName}</p>
                            <p className="mt-1 text-[11px] text-[#8B95A1]">무게, 횟수, 세트를 모두 입력해 주세요</p>
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
                          {[
                            { field: "weight" as const, label: "무게", unit: "kg" },
                            { field: "reps" as const, label: "횟수", unit: "회" },
                            { field: "sets" as const, label: "세트", unit: "세트" },
                          ].map((item) => (
                            <label key={item.field} className="flex items-center justify-between gap-3 rounded-xl bg-[#FFFFFF] px-3 py-3">
                              <span className="text-[13px] font-medium text-[#4E5968]">{item.label}</span>
                              <div className="flex items-center gap-1">
                                <input
                                  className="w-20 bg-transparent text-right text-[14px] font-semibold text-[#191F28] outline-none"
                                  inputMode="numeric"
                                  onChange={(event) =>
                                    updateExercise(selectedDay, exercise.id, item.field, event.target.value)
                                  }
                                  placeholder="0"
                                  type="number"
                                  value={exercise[item.field]}
                                />
                                <span className="text-[11px] text-[#8B95A1]">{item.unit}</span>
                              </div>
                            </label>
                          ))}
                        </div>

                        <div className="mt-2 flex gap-1.5">
                          {SET_PRESETS.map((preset) => (
                            <button
                              key={preset.label}
                              className="flex-1 rounded-lg border border-[#E5E8EB] bg-[#FFFFFF] py-1.5 text-[11px] font-medium text-[#4E5968]"
                              onClick={() => {
                                updateExercise(selectedDay, exercise.id, "sets", preset.sets)
                                updateExercise(selectedDay, exercise.id, "reps", preset.reps)
                              }}
                              type="button"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : isRestDay(selectedDayRoutine.bodyParts) ? (
                <div className="rounded-[24px] border border-[#E5E8EB] bg-[#FFFFFF] px-4 py-6 text-center">
                  <p className="text-[14px] font-semibold text-[#191F28]">{selectedDayMeta.full}은 휴식일입니다</p>
                  <p className="mt-2 text-[12px] text-[#8B95A1]">휴식일은 세트 입력 없이 완료됩니다</p>
                </div>
              ) : (
                <div className="rounded-[24px] border border-[#E5E8EB] bg-[#FFFFFF] px-4 py-6 text-center">
                  <p className="text-[14px] font-semibold text-[#191F28]">운동을 먼저 선택해 주세요</p>
                  <p className="mt-2 text-[12px] text-[#8B95A1]">운동 선택 단계에서 머신을 추가한 뒤 세트를 입력할 수 있습니다</p>
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
          <p className="mb-3 text-center text-[12px] text-[#8B95A1]">{routineSummary}</p>
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
              {routineStage === "focus" ? "운동 선택" : routineStage === "exercise" ? "세트 입력" : "저장하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
