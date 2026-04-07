"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchTodayWorkout, saveTodayWorkoutSet, syncTodayWorkout } from "@/lib/api"
import { getReadableApiError } from "@/lib/api-client"
import type { ApiTodayLog, ApiWorkoutSetUpdate } from "@/lib/api-types"
import {
  DAY_META,
  formatBodyParts,
  formatExerciseMetricSummary,
  formatSupersetExerciseNames,
  getExerciseMetricDefaultValues,
  getExerciseMetricHint,
  getExerciseMetricProfile,
  getTodayDayKey,
  hasWorkoutBodyParts,
  isSupersetPair,
  isRestDay,
  type ExerciseDraft,
  type ExerciseField,
  type RoutineMap,
} from "@/lib/app-config"
import { findMachineByExerciseName, normalizeExerciseName } from "@/lib/exercise-name-matcher"
import { sanitizeNonNegativeDecimalInput, sanitizePositiveIntegerInput } from "@/lib/numeric-input"
import { CheckCircle2Icon, CircleIcon } from "./icons"
import MachineVisual from "./machine-visual"

type SetState = "idle" | "done"
type SaveState = "idle" | "saving" | "success" | "error"

type ExerciseRecord = {
  id: string
  machineId: string
  name: string
  supersetGroupId: string | null
  targetValues: Record<ExerciseField, number>
  completions: SetState[]
  actualSetReps: Record<number, string>
  actualSetWeights: Record<number, string>
  actualValues: Partial<Record<ExerciseField, string>>
  backendSetIds: Record<number, number>
}

type ExerciseRecordGroup = {
  id: string
  isSuperset: boolean
  records: ExerciseRecord[]
}

type RemoteExerciseGroup = {
  key: string
  normalizedName: string
  machineId: string
  exerciseName: string
  sets: NonNullable<ApiTodayLog["sets"]>
}

function getMachineIdFromName(name: string) {
  const matchedMachine = findMachineByExerciseName(name)
  const normalizedName = normalizeExerciseName(name)

  if (matchedMachine) {
    return matchedMachine.id
  }

  return normalizedName ? `exercise-${normalizedName}` : "exercise-unknown"
}

function formatMetricInput(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return ""
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? String(parsed) : ""
}

function parseNumberInput(value: string | undefined, fallback: number) {
  if (!value?.trim()) {
    return fallback
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseIntegerInput(value: string | undefined, fallback: number) {
  if (!value?.trim()) {
    return fallback
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback
}

function createLocalExerciseRecord(exercise: ExerciseDraft): ExerciseRecord {
  const profile = getExerciseMetricProfile(exercise.machineId)
  const completionCount = profile.trackingMode === "setBased" ? Math.max(1, Number(exercise.sets) || 1) : 1
  const repsInput = formatMetricInput(exercise.reps)
  const weightInput = formatMetricInput(exercise.weight)
  const setsInput = formatMetricInput(exercise.sets)
  const actualSetReps: Record<number, string> = {}
  const actualSetWeights: Record<number, string> = {}

  for (let index = 0; index < completionCount; index += 1) {
    actualSetReps[index] = repsInput
    actualSetWeights[index] = weightInput
  }

  return {
    id: exercise.id,
    machineId: exercise.machineId,
    name: exercise.machineName,
    supersetGroupId: exercise.supersetGroupId,
    targetValues: {
      weight: Number(exercise.weight) || 0,
      reps: Number(exercise.reps) || 0,
      sets: Number(exercise.sets) || 0,
    },
    completions: Array.from({ length: completionCount }, () => "idle" as const),
    actualSetReps,
    actualSetWeights,
    actualValues:
      profile.trackingMode === "singleSession"
        ? {
            weight: weightInput,
            reps: repsInput,
            sets: setsInput,
          }
        : {},
    backendSetIds: {},
  }
}

function createRemoteExerciseGroups(todayLog: ApiTodayLog | null | undefined) {
  const groups = new Map<string, RemoteExerciseGroup>()

  for (const set of todayLog?.sets ?? []) {
    const exerciseName = set.exercise_name?.trim() || `운동 ${set.exercise}`
    const normalizedName = normalizeExerciseName(exerciseName)
    const key = `${set.exercise}:${normalizedName}`
    const existing = groups.get(key)

    if (existing) {
      existing.sets.push(set)
      continue
    }

    groups.set(key, {
      key,
      normalizedName,
      machineId: getMachineIdFromName(exerciseName),
      exerciseName,
      sets: [set],
    })
  }

  return Array.from(groups.values()).map((group) => ({
    ...group,
    sets: [...group.sets].sort((left, right) => left.set_number - right.set_number),
  }))
}

function createRemoteExerciseRecord(group: RemoteExerciseGroup, baseExercise?: ExerciseDraft): ExerciseRecord {
  const machineId = baseExercise?.machineId ?? group.machineId
  const profile = getExerciseMetricProfile(machineId)
  const firstSet = group.sets[0]
  const targetWeight = baseExercise ? Number(baseExercise.weight) || 0 : firstSet?.weight ?? 0
  const targetReps = baseExercise ? Number(baseExercise.reps) || 0 : firstSet?.reps ?? 0
  const targetSets = baseExercise ? Number(baseExercise.sets) || group.sets.length : group.sets.length
  const completionCount = profile.trackingMode === "setBased" ? Math.max(group.sets.length, targetSets, 1) : 1
  const actualSetReps: Record<number, string> = {}
  const actualSetWeights: Record<number, string> = {}
  const backendSetIds: Record<number, number> = {}

  for (let index = 0; index < completionCount; index += 1) {
    const set = group.sets[index]
    actualSetReps[index] = set ? formatMetricInput(set.reps) : formatMetricInput(baseExercise?.reps)
    actualSetWeights[index] = set ? formatMetricInput(set.weight) : formatMetricInput(baseExercise?.weight)

    if (set) {
      backendSetIds[index] = set.id
    }
  }

  return {
    id: baseExercise?.id ?? `remote-${group.key}`,
    machineId,
    name: baseExercise?.machineName ?? group.exerciseName,
    supersetGroupId: baseExercise?.supersetGroupId ?? null,
    targetValues: {
      weight: targetWeight,
      reps: targetReps,
      sets: targetSets,
    },
    completions: Array.from({ length: completionCount }, (_, index) => (group.sets[index]?.is_completed ? "done" : "idle")) as SetState[],
    actualSetReps,
    actualSetWeights,
    actualValues:
      profile.trackingMode === "singleSession"
        ? {
            weight: formatMetricInput(firstSet?.weight ?? baseExercise?.weight),
            reps: formatMetricInput(firstSet?.reps ?? baseExercise?.reps),
            sets: formatMetricInput(baseExercise?.sets ?? group.sets.length),
          }
        : {},
    backendSetIds,
  }
}

function createExerciseRecords(routines: RoutineMap, todayLog: ApiTodayLog | null | undefined) {
  const todayKey = getTodayDayKey()
  const routine = routines[todayKey]
  const remoteGroups = createRemoteExerciseGroups(todayLog)
  const records: ExerciseRecord[] = []

  if (routine && !isRestDay(routine.bodyParts)) {
    for (const exercise of routine.exercises) {
      const normalizedName = normalizeExerciseName(exercise.machineName)
      const matchedIndex = remoteGroups.findIndex(
        (group) => group.normalizedName === normalizedName || group.machineId === exercise.machineId,
      )
      const matchedGroup = matchedIndex >= 0 ? remoteGroups.splice(matchedIndex, 1)[0] : null

      records.push(matchedGroup ? createRemoteExerciseRecord(matchedGroup, exercise) : createLocalExerciseRecord(exercise))
    }
  }

  for (const group of remoteGroups) {
    records.push(createRemoteExerciseRecord(group))
  }

  return records
}

function groupExerciseRecords(exercises: ExerciseRecord[]): ExerciseRecordGroup[] {
  const groups: ExerciseRecordGroup[] = []

  for (let index = 0; index < exercises.length; index += 1) {
    const exercise = exercises[index]
    const nextExercise = exercises[index + 1]

    if (isSupersetPair(exercise, nextExercise)) {
      groups.push({
        id: exercise.supersetGroupId ?? exercise.id,
        isSuperset: true,
        records: [exercise, nextExercise],
      })
      index += 1
      continue
    }

    groups.push({
      id: exercise.id,
      isSuperset: false,
      records: [exercise],
    })
  }

  return groups
}

function getCompletion(exerciseGroups: ExerciseRecordGroup[]) {
  const totalSets = exerciseGroups.reduce((accumulator, group) => accumulator + group.records[0].completions.length, 0)
  const doneSets = exerciseGroups.reduce(
    (accumulator, group) => accumulator + group.records[0].completions.filter((state) => state === "done").length,
    0,
  )

  return {
    totalSets,
    doneSets,
    pct: totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0,
  }
}

function buildWorkoutSetUpdates(exercises: ExerciseRecord[]): ApiWorkoutSetUpdate[] {
  return exercises.flatMap((exercise) => {
    const profile = getExerciseMetricProfile(exercise.machineId)
    const defaultValues = getExerciseMetricDefaultValues(exercise.machineId)

    if (profile.trackingMode === "completionOnly") {
      const setId = exercise.backendSetIds[0]

      if (typeof setId !== "number") {
        return []
      }

      return [
        {
          set_id: setId,
          weight: Number(defaultValues.weight ?? 0),
          reps: Number(defaultValues.reps ?? 1),
          is_completed: exercise.completions[0] === "done",
        },
      ]
    }

    if (profile.trackingMode === "singleSession") {
      const setId = exercise.backendSetIds[0]

      if (typeof setId !== "number") {
        return []
      }

      return [
        {
          set_id: setId,
          weight: parseNumberInput(exercise.actualValues.weight, exercise.targetValues.weight),
          reps: parseIntegerInput(exercise.actualValues.reps, exercise.targetValues.reps),
          is_completed: exercise.completions[0] === "done",
        },
      ]
    }

    return exercise.completions.flatMap((state, index) => {
      const setId = exercise.backendSetIds[index]

      if (typeof setId !== "number") {
        return []
      }

      return [
        {
          set_id: setId,
          weight: parseNumberInput(exercise.actualSetWeights[index], exercise.targetValues.weight),
          reps: parseIntegerInput(exercise.actualSetReps[index], exercise.targetValues.reps),
          is_completed: state === "done",
        },
      ]
    })
  })
}

function hydrateExercisesWithTodayWorkout(exercises: ExerciseRecord[], todayLog: ApiTodayLog | null | undefined) {
  const remoteGroups = createRemoteExerciseGroups(todayLog)

  return exercises.map((exercise) => {
    const normalizedName = normalizeExerciseName(exercise.name)
    const matchedIndex = remoteGroups.findIndex(
      (group) => group.normalizedName === normalizedName || group.machineId === exercise.machineId,
    )

    if (matchedIndex < 0) {
      return exercise
    }

    const matchedGroup = remoteGroups.splice(matchedIndex, 1)[0]
    const completionCount = Math.max(exercise.completions.length, matchedGroup.sets.length)
    const nextCompletions = Array.from({ length: completionCount }, (_, index) => {
      if (exercise.completions[index]) {
        return exercise.completions[index]
      }

      return matchedGroup.sets[index]?.is_completed ? "done" : "idle"
    }) as SetState[]
    const nextActualSetReps = { ...exercise.actualSetReps }
    const nextActualSetWeights = { ...exercise.actualSetWeights }
    const nextBackendSetIds = { ...exercise.backendSetIds }

    for (let index = 0; index < matchedGroup.sets.length; index += 1) {
      const set = matchedGroup.sets[index]
      nextBackendSetIds[index] = set.id

      if (!nextActualSetReps[index]) {
        nextActualSetReps[index] = formatMetricInput(set.reps)
      }

      if (!nextActualSetWeights[index]) {
        nextActualSetWeights[index] = formatMetricInput(set.weight)
      }
    }

    return {
      ...exercise,
      completions: nextCompletions,
      actualSetReps: nextActualSetReps,
      actualSetWeights: nextActualSetWeights,
      backendSetIds: nextBackendSetIds,
    }
  })
}

export default function TodayScreen({ routines, token }: { routines: RoutineMap; token: string | null }) {
  const queryClient = useQueryClient()
  const resetTimerRef = useRef<number | null>(null)
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [exercises, setExercises] = useState<ExerciseRecord[]>(() => createExerciseRecords(routines, null))

  const todayWorkoutQuery = useQuery({
    queryKey: ["todayWorkout", token],
    queryFn: () => fetchTodayWorkout(token as string),
    enabled: Boolean(token),
  })
  const saveTodayWorkoutMutation = useMutation({
    mutationFn: (payloads: ApiWorkoutSetUpdate[]) => Promise.all(payloads.map((payload) => saveTodayWorkoutSet(token as string, payload))),
  })

  const todayWorkout = todayWorkoutQuery.data ?? null
  const today = new Date()
  const dayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"]
  const todayKey = getTodayDayKey(today)
  const todayRoutine = routines[todayKey]
  const dateStr = `${today.getMonth() + 1}월 ${today.getDate()}일`
  const dayStr = dayNames[today.getDay()]
  const todayLabel = DAY_META.find((day) => day.key === todayKey)?.full ?? dayStr

  useEffect(() => {
    setExercises(createExerciseRecords(routines, todayWorkout))
    setExpandedId(null)
  }, [routines, todayWorkout])

  useEffect(
    () => () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current)
      }
    },
    [],
  )

  const scheduleReset = () => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current)
    }

    resetTimerRef.current = window.setTimeout(() => {
      setSaveState("idle")
      setSaveMessage(null)
    }, 2500)
  }

  const hasRoutine = exercises.length > 0
  const exerciseGroups = useMemo(() => groupExerciseRecords(exercises), [exercises])

  const toggleSet = (exerciseId: string, setIndex: number) => {
    setExercises((previous) =>
      previous.map((exercise) => {
        const targetExercise = previous.find((item) => item.id === exerciseId)
        if (!targetExercise) {
          return exercise
        }

        const isSameGroup = targetExercise.supersetGroupId
          ? exercise.supersetGroupId === targetExercise.supersetGroupId
          : exercise.id === exerciseId

        if (!isSameGroup) {
          return exercise
        }

        const currentDoneCount = targetExercise.completions.filter((state) => state === "done").length
        const nextDoneCount = currentDoneCount === setIndex + 1 ? setIndex : setIndex + 1
        const nextCompletions = exercise.completions.map((_, index) => (index < nextDoneCount ? "done" : "idle")) as SetState[]
        return { ...exercise, completions: nextCompletions }
      }),
    )
  }

  const setActualReps = (exerciseId: string, setIndex: number, value: string) => {
    setExercises((previous) =>
      previous.map((exercise) =>
        exercise.id === exerciseId
          ? { ...exercise, actualSetReps: { ...exercise.actualSetReps, [setIndex]: value } }
          : exercise,
      ),
    )
  }

  const setActualValue = (exerciseId: string, field: ExerciseField, value: string) => {
    setExercises((previous) =>
      previous.map((exercise) =>
        exercise.id === exerciseId
          ? { ...exercise, actualValues: { ...exercise.actualValues, [field]: value } }
          : exercise,
      ),
    )
  }

  const { totalSets, doneSets, pct } = useMemo(() => getCompletion(exerciseGroups), [exerciseGroups])
  const remaining = totalSets - doneSets
  const supersetGroupCount = exerciseGroups.filter((group) => group.isSuperset).length
  const remainingLabel =
    remaining > 0 ? `아직 ${remaining}개 남았어요` : totalSets > 0 ? "오늘 기록을 모두 마쳤어요" : "기록할 세트가 없어요"
  const routineHintLabel =
    totalSets > 0
      ? remaining > 0
        ? `다음은 ${remaining === totalSets ? "첫 세트" : "남은 세트"}부터 기록하세요`
        : "기록을 저장하면 오늘 운동이 정리됩니다"
      : "오늘은 기록할 운동이 없습니다"
  const bodyPartLabel = hasWorkoutBodyParts(todayRoutine?.bodyParts ?? [])
    ? formatBodyParts(todayRoutine.bodyParts)
    : hasRoutine
      ? "서버 기준 오늘 운동"
      : ""
  const topLevelError = todayWorkoutQuery.error
    ? getReadableApiError(todayWorkoutQuery.error, "오늘 운동을 불러오지 못했습니다.")
    : null
  const isSaving = saveTodayWorkoutMutation.isPending

  const handleSave = async () => {
    if (!token) {
      setSaveState("error")
      setSaveMessage("로그인 후 오늘 운동을 저장할 수 있습니다.")
      scheduleReset()
      return
    }

    let nextExercises = exercises
    let payloads = buildWorkoutSetUpdates(nextExercises)

    if (payloads.length === 0) {
      try {
        const refreshedTodayWorkout = await todayWorkoutQuery.refetch()
        nextExercises = hydrateExercisesWithTodayWorkout(exercises, refreshedTodayWorkout.data)
        setExercises(nextExercises)
        queryClient.setQueryData(["todayWorkout", token], refreshedTodayWorkout.data ?? null)
        payloads = buildWorkoutSetUpdates(nextExercises)
      } catch (error) {
        setSaveState("error")
        setSaveMessage(getReadableApiError(error, "오늘 운동 세트를 다시 불러오지 못했습니다."))
        scheduleReset()
        return
      }
    }

    if (payloads.length === 0) {
      setSaveState("error")
      setSaveMessage("백엔드에서 오늘 운동 세트를 아직 생성하지 않았습니다. /me/workouts/today/ 응답에 sets가 내려와야 저장할 수 있습니다.")
      scheduleReset()
      return
    }

    setSaveState("saving")
    setSaveMessage(null)

    try {
      await saveTodayWorkoutMutation.mutateAsync(payloads)
      await syncTodayWorkout(token, {
        is_completed: payloads.length > 0 && payloads.every((payload) => payload.is_completed),
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["todayWorkout", token] }),
        queryClient.invalidateQueries({ queryKey: ["grass", token] }),
      ])
      setSaveState("success")
      setSaveMessage("오늘 운동 기록을 서버에 저장했습니다.")
      scheduleReset()
    } catch (error) {
      setSaveState("error")
      setSaveMessage(getReadableApiError(error, "오늘 운동 저장에 실패했습니다."))
      scheduleReset()
    }
  }

  if (!hasRoutine) {
    return (
      <div className="flex h-full flex-col overflow-y-auto">
        <div className="px-4 pt-5 pb-3">
          <p className="text-[12px] font-semibold text-[#8B95A1]">{todayLabel}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[26px] font-bold tracking-tight text-[#191F28]">{dateStr}</span>
            <span className="text-[15px] text-[#8B95A1]">{dayStr}</span>
          </div>
        </div>

        <div className="px-4 pb-6">
          <div className="rounded-[24px] border border-[#E5E8EB] bg-[#FFFFFF] px-4 py-8 text-center">
            <p className="text-[18px] font-bold text-[#191F28]">
              {token && todayWorkoutQuery.isLoading
                ? "오늘 운동을 불러오는 중입니다"
                : isRestDay(todayRoutine?.bodyParts ?? [])
                  ? "오늘은 휴식일입니다"
                  : "오늘 루틴이 비어 있습니다"}
            </p>
            <p className="mt-2 text-[13px] leading-6 text-[#8B95A1]">
              {topLevelError
                ? topLevelError
                : "루틴 탭에서 오늘 운동을 추가하면 이 화면에서 바로 기록할 수 있습니다"}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-5 pb-3">
          <p className="text-[12px] font-semibold text-[#8B95A1]">{todayLabel}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[26px] font-bold tracking-tight text-[#191F28]">{dateStr}</span>
            <span className="text-[15px] text-[#8B95A1]">{dayStr}</span>
          </div>
          {bodyPartLabel ? <p className="mt-1.5 text-[13px] text-[#6B7684]">{bodyPartLabel}</p> : null}
        </div>

        {topLevelError ? (
          <div className="px-4 pb-3">
            <div className="rounded-[18px] border border-[#F5C2C7] bg-[#FFF5F6] px-4 py-3">
              <p className="text-[12px] font-semibold text-[#D14343]">불러오기 오류</p>
              <p className="mt-1 text-[13px] text-[#6B7684]">{topLevelError}</p>
            </div>
          </div>
        ) : null}

        <div className="px-4 mb-4">
          <div className="rounded-[26px] border border-[#E5E8EB] bg-[#FFFFFF] p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[12px] font-semibold text-[#8B95A1]">오늘 진행률</p>
                <p className="mt-1 text-[32px] font-bold leading-none text-[#191F28]">{pct}%</p>
                <p className="mt-2 text-[13px] font-medium text-[#4E5968]">{remainingLabel}</p>
              </div>
              <div className="text-right">
                <p className="text-[12px] font-semibold text-[#8B95A1]">완료 목표</p>
                <p className="mt-1 text-[18px] font-bold text-[#191F28]">
                  {doneSets}/{totalSets}
                </p>
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E5E8EB]">
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
                <p className="text-[11px] font-semibold text-[#8B95A1]">남은 목표</p>
                <p className="mt-1 text-[18px] font-bold text-[#191F28]">{remaining}개</p>
              </div>
              <div className="rounded-[18px] bg-[#F7F8FA] px-3 py-3">
                <p className="text-[11px] font-semibold text-[#8B95A1]">묶음 구성</p>
                <p className="mt-1 text-[18px] font-bold text-[#191F28]">
                  {exerciseGroups.length}개
                  {supersetGroupCount > 0 ? <span className="ml-1 text-[12px] font-semibold text-[#8B95A1]">· 슈퍼세트 {supersetGroupCount}개</span> : null}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-[18px] bg-[#EBF3FE] px-3 py-3">
              <p className="text-[11px] font-semibold text-[#3182F6]">안내</p>
              <p className="mt-1 text-[13px] font-medium text-[#1F3D78]">{routineHintLabel}</p>
            </div>
          </div>
        </div>

        <div className="px-4 mb-2">
          <div className="rounded-[20px] bg-[#FFFFFF] px-4 py-3 shadow-[inset_0_0_0_1px_rgba(229,232,235,1)]">
            <span className="text-[13px] font-semibold text-[#4E5968]">오늘 운동</span>
            <p className="mt-1 text-[12px] text-[#8B95A1]">
              근력 운동은 세트 단위, 유산소는 완료 버튼으로 기록됩니다. 지금 남은 세트부터 차례로 처리하면 됩니다
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-4 pb-4">
          {exerciseGroups.map((group) => {
            const primaryExercise = group.records[0]
            const profile = getExerciseMetricProfile(primaryExercise.machineId)
            const isCompletionOnly = profile.trackingMode === "completionOnly"
            const sanitizeMetricValue =
              profile.trackingMode === "singleSession" ? sanitizeNonNegativeDecimalInput : sanitizePositiveIntegerInput
            const metricInputMode = profile.trackingMode === "singleSession" ? "decimal" : "numeric"
            const metricPattern = profile.trackingMode === "singleSession" ? "[0-9]*[.]?[0-9]*" : "[0-9]*"
            const doneCount = primaryExercise.completions.filter((state) => state === "done").length
            const isExpanded = expandedId === group.id
            const isDone = doneCount === primaryExercise.completions.length
            const nextPendingSetIndex = primaryExercise.completions.findIndex((state) => state !== "done")
            const totalGroupSets = group.records.reduce((accumulator, record) => accumulator + record.completions.length, 0)
            const completedGroupSets = group.records.reduce(
              (accumulator, record) => accumulator + record.completions.filter((state) => state === "done").length,
              0,
            )

            if (group.isSuperset) {
              return (
                <div
                  key={group.id}
                  className={`overflow-hidden rounded-2xl border transition-colors ${
                    isDone ? "border-[#2CB52C] bg-[#F6FFF6]" : "border-[#E5E8EB] bg-[#FFFFFF]"
                  }`}
                >
                  <button
                    className="flex w-full items-start justify-between px-4 py-3"
                    onClick={() => setExpandedId(isExpanded ? null : group.id)}
                    type="button"
                  >
                    <div className="min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        {isDone ? (
                          <CheckCircle2Icon className="shrink-0 text-[#2CB52C]" size={18} />
                        ) : (
                          <CircleIcon className="shrink-0 text-[#E5E8EB]" size={18} />
                        )}
                        <span className="rounded-full bg-[#EBF3FE] px-2 py-0.5 text-[10px] font-semibold text-[#3182F6]">
                          슈퍼세트
                        </span>
                      </div>
                      <p className="mt-2 truncate text-[14px] font-semibold text-[#191F28]">
                        {formatSupersetExerciseNames(group.records.map((record) => ({ machineName: record.name })))}
                      </p>
                      <p className="mt-1 text-[12px] text-[#8B95A1]">
                        한 라운드에 함께 진행됩니다 · {completedGroupSets}/{totalGroupSets}세트 완료
                      </p>
                    </div>
                    <div className="ml-2 shrink-0 text-right">
                      <p className={`text-[12px] font-semibold ${isDone ? "text-[#2CB52C]" : "text-[#3182F6]"}`}>
                        {doneCount}/{primaryExercise.completions.length}
                      </p>
                      <p className="mt-1 text-[11px] text-[#8B95A1]">{isExpanded ? "세부 닫기" : "세부 기록"}</p>
                    </div>
                  </button>

                  <div className="flex flex-col gap-2 px-4 pb-3">
                    {group.records.map((record) => {
                      const targetSummary = formatExerciseMetricSummary({
                        machineId: record.machineId,
                        weight: record.targetValues.weight > 0 ? String(record.targetValues.weight) : "",
                        reps: record.targetValues.reps > 0 ? String(record.targetValues.reps) : "",
                        sets: record.targetValues.sets > 0 ? String(record.targetValues.sets) : "",
                      })

                      return (
                        <div key={record.id} className="flex items-center justify-between rounded-xl bg-[#F8FAFC] px-3 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <MachineVisual machineId={record.machineId} size={36} />
                            <span className="truncate text-[13px] font-medium text-[#191F28]">{record.name}</span>
                          </div>
                          <span className="text-[12px] text-[#8B95A1]">목표 {targetSummary}</span>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex flex-wrap gap-2 px-4 pb-3">
                    {primaryExercise.completions.map((state, index) => (
                      <button
                        key={index}
                        className={`h-10 w-10 rounded-xl text-[13px] font-bold transition-all active:scale-95 ${
                          state === "done"
                            ? "bg-[#3182F6] text-white"
                            : index === nextPendingSetIndex
                              ? "border-2 border-[#3182F6] bg-[#EBF3FE] text-[#3182F6]"
                              : "border border-[#E5E8EB] bg-[#F8FAFC] text-[#8B95A1]"
                        }`}
                        onClick={() => toggleSet(primaryExercise.id, index)}
                        type="button"
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>

                  {isExpanded ? (
                    <div className="border-t border-[#E5E8EB] px-4 pb-4 pt-3">
                      <div className="flex flex-col gap-3">
                        {group.records.map((record) => (
                          <div key={record.id} className="rounded-xl bg-[#F8FAFC] px-3 py-3">
                            <p className="mb-2 text-[12px] font-semibold text-[#4E5968]">{record.name}</p>
                            <div className="grid grid-cols-5 gap-2">
                              {Array.from({ length: record.completions.length }, (_, index) => (
                                <div key={index} className="flex flex-col items-center gap-1">
                                  <span className="text-[11px] text-[#8B95A1]">{index + 1}세트</span>
                                  <input
                                    className="w-full rounded-lg border border-[#E5E8EB] bg-[#FFFFFF] py-2 text-center text-[13px] font-semibold text-[#191F28] outline-none"
                                    onChange={(event) => setActualReps(record.id, index, sanitizePositiveIntegerInput(event.target.value))}
                                    placeholder={String(record.targetValues.reps)}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    type="text"
                                    value={record.actualSetReps[index] ?? ""}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            }

            const exercise = group.records[0]
            const targetSummary = formatExerciseMetricSummary({
              machineId: exercise.machineId,
              weight: exercise.targetValues.weight > 0 ? String(exercise.targetValues.weight) : "",
              reps: exercise.targetValues.reps > 0 ? String(exercise.targetValues.reps) : "",
              sets: exercise.targetValues.sets > 0 ? String(exercise.targetValues.sets) : "",
            })

            return (
              <div
                key={group.id}
                className={`overflow-hidden rounded-2xl border transition-colors ${
                  isDone ? "border-[#2CB52C] bg-[#F6FFF6]" : "border-[#E5E8EB] bg-[#FFFFFF]"
                }`}
              >
                <button
                  className="flex w-full items-center justify-between px-4 py-3"
                  onClick={() => setExpandedId(isExpanded ? null : group.id)}
                  type="button"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    {isDone ? (
                      <CheckCircle2Icon className="shrink-0 text-[#2CB52C]" size={18} />
                    ) : (
                      <CircleIcon className="shrink-0 text-[#E5E8EB]" size={18} />
                    )}
                    <MachineVisual machineId={exercise.machineId} size={36} />
                    <div className="min-w-0 text-left">
                      <p className="truncate text-[14px] font-semibold text-[#191F28]">{exercise.name}</p>
                      <p className="text-[12px] text-[#8B95A1]">목표 {targetSummary}</p>
                    </div>
                  </div>
                    <div className="ml-2 shrink-0 text-right">
                      <p className={`text-[12px] font-semibold ${isDone ? "text-[#2CB52C]" : "text-[#3182F6]"}`}>
                        {profile.trackingMode === "setBased" ? `${doneCount}/${exercise.completions.length}` : isDone ? "완료" : "대기"}
                      </p>
                      <p className="mt-1 text-[11px] text-[#8B95A1]">{isExpanded ? "세부 닫기" : "세부 기록"}</p>
                    </div>
                  </button>

                {profile.trackingMode === "setBased" ? (
                  <div className="flex flex-wrap gap-2 px-4 pb-3">
                    {exercise.completions.map((state, index) => (
                      <button
                        key={index}
                        className={`h-10 w-10 rounded-xl text-[13px] font-bold transition-all active:scale-95 ${
                          state === "done"
                            ? "bg-[#3182F6] text-white"
                            : index === nextPendingSetIndex
                              ? "border-2 border-[#3182F6] bg-[#EBF3FE] text-[#3182F6]"
                              : "border border-[#E5E8EB] bg-[#F8FAFC] text-[#8B95A1]"
                        }`}
                        onClick={() => toggleSet(exercise.id, index)}
                        type="button"
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 pb-3">
                    <button
                      className={`h-11 w-full rounded-xl text-[13px] font-semibold transition-all active:scale-[0.99] ${
                        isDone ? "bg-[#2CB52C] text-white" : "border border-[#E5E8EB] bg-[#F8FAFC] text-[#4E5968]"
                      }`}
                      onClick={() => toggleSet(exercise.id, 0)}
                      type="button"
                    >
                      {isDone ? "완료 취소" : "기록 완료"}
                    </button>
                  </div>
                )}

                {isExpanded ? (
                  <div className="border-t border-[#E5E8EB] px-4 pb-4 pt-1">
                    {profile.trackingMode === "setBased" ? (
                      <>
                        <p className="mb-2 text-[12px] font-medium text-[#8B95A1]">실제 횟수 기록</p>
                        <div className="grid grid-cols-5 gap-2">
                          {Array.from({ length: exercise.completions.length }, (_, index) => (
                            <div key={index} className="flex flex-col items-center gap-1">
                              <span className="text-[11px] text-[#8B95A1]">{index + 1}세트</span>
                              <input
                                className="w-full rounded-lg border border-[#E5E8EB] bg-[#F8FAFC] py-2 text-center text-[13px] font-semibold text-[#191F28] outline-none"
                                onChange={(event) => setActualReps(exercise.id, index, sanitizePositiveIntegerInput(event.target.value))}
                                placeholder={String(exercise.targetValues.reps)}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                type="text"
                                value={exercise.actualSetReps[index] ?? ""}
                              />
                            </div>
                          ))}
                        </div>
                      </>
                    ) : isCompletionOnly ? (
                      <div className="rounded-xl bg-[#F8FAFC] px-3 py-3">
                        <p className="text-[12px] font-semibold text-[#4E5968]">완료 체크형 운동</p>
                        <p className="mt-1 text-[12px] leading-5 text-[#8B95A1]">
                          세트 입력 없이 오늘 했는지만 체크하면 저장됩니다.
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="mb-2 text-[12px] font-medium text-[#8B95A1]">{getExerciseMetricHint(exercise.machineId)}</p>
                        <div className="flex flex-col gap-2">
                          {profile.fields.map((field) => (
                            <label key={field.field} className="flex items-center justify-between gap-3 rounded-xl bg-[#F8FAFC] px-3 py-3">
                              <span className="text-[13px] font-medium text-[#4E5968]">{field.label}</span>
                              <div className="flex items-center gap-1">
                                <input
                                  className="w-24 bg-transparent text-right text-[13px] font-semibold text-[#191F28] outline-none"
                                  inputMode={metricInputMode}
                                  onChange={(event) =>
                                    setActualValue(exercise.id, field.field, sanitizeMetricValue(event.target.value))
                                  }
                                  placeholder={
                                    exercise.targetValues[field.field] > 0 ? String(exercise.targetValues[field.field]) : field.placeholder
                                  }
                                  pattern={metricPattern}
                                  type="text"
                                  value={exercise.actualValues[field.field] ?? ""}
                                />
                                <span className="text-[11px] text-[#8B95A1]">{field.unit}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      <div className="border-t border-[#EEF1F4] bg-[rgba(255,255,255,0.96)] px-4 py-3 backdrop-blur">
        {saveMessage ? (
          <p className={`mb-2 text-[12px] font-medium ${saveState === "error" ? "text-[#D14343]" : "text-[#4E5968]"}`}>{saveMessage}</p>
        ) : null}
        <button
          className={`w-full rounded-2xl py-4 text-[15px] font-semibold text-white transition-all active:opacity-90 ${
            saveState === "success"
              ? "bg-[#2CB52C]"
              : saveState === "error"
                ? "bg-[#D14343]"
                : isSaving
                  ? "bg-[#3182F6]"
                  : "bg-[#191F28]"
          }`}
          disabled={isSaving}
          onClick={handleSave}
          type="button"
        >
          {saveState === "success" ? "저장 완료!" : isSaving ? "저장 중..." : "오늘 기록 저장"}
        </button>
      </div>
    </div>
  )
}
