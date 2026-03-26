"use client"

import {
  DAY_META,
  formatExerciseMetricSummary,
  formatBodyParts,
  formatSupersetExerciseNames,
  getRoutineDayCardPreview,
  getTodayDayKey,
  groupRoutineExercises,
  hasWorkoutBodyParts,
  isRestDay,
  type RoutineMap,
} from "@/lib/app-config"
import MachineVisual from "./machine-visual"

export default function RoutineScreen({
  onEdit,
  routines,
}: {
  onEdit: () => void
  routines: RoutineMap
}) {
  const todayKey = getTodayDayKey()
  const daySummaries = DAY_META.map((day) => {
    const routine = routines[day.key]
    const exerciseGroups = groupRoutineExercises(routine.exercises)
    const supersetCount = exerciseGroups.filter((group) => group.isSuperset).length

    return {
      day,
      routine,
      exerciseGroups,
      hasRoutine: hasWorkoutBodyParts(routine.bodyParts),
      isRest: isRestDay(routine.bodyParts),
      isToday: day.key === todayKey,
      supersetCount,
    }
  })

  const configuredDays = daySummaries.filter((item) => item.hasRoutine)
  const restDays = daySummaries.filter((item) => item.isRest)
  const emptyDays = daySummaries.filter((item) => !item.hasRoutine)
  const focusDay = (
    daySummaries.find((item) => item.isToday && item.hasRoutine)?.day ?? configuredDays[0]?.day ?? DAY_META[0]
  ) as (typeof DAY_META)[number]
  const focusRoutine = routines[focusDay.key]
  const totalExercises = configuredDays.reduce((sum, item) => sum + item.routine.exercises.length, 0)
  const totalSupersets = daySummaries.reduce((sum, item) => sum + item.supersetCount, 0)
  const routineStatusLabel = hasWorkoutBodyParts(focusRoutine.bodyParts)
    ? isRestDay(focusRoutine.bodyParts)
      ? "휴식일"
      : "운동일"
    : "미설정"

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="px-4 pt-5 pb-4">
        <div className="rounded-[28px] border border-[#E5E8EB] bg-[#FFFFFF] p-4 shadow-[0_20px_36px_-34px_rgba(15,23,42,0.24)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-[#8B95A1]">주간 계획</p>
              <h2 className="mt-1 text-[24px] font-bold tracking-tight text-[#191F28]">루틴</h2>
              <p className="mt-1.5 text-[13px] leading-6 text-[#6B7684]">
                {hasWorkoutBodyParts(focusRoutine.bodyParts)
                  ? `${focusDay.full} · ${formatBodyParts(focusRoutine.bodyParts)}`
                  : "먼저 볼 루틴부터 정리합니다"}
              </p>
            </div>
            <button
              className="shrink-0 rounded-full bg-[#191F28] px-3.5 py-2 text-[12px] font-semibold text-white"
              onClick={onEdit}
              type="button"
            >
              수정
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#EBF3FE] px-3 py-1.5 text-[12px] font-semibold text-[#3182F6]">
              {focusDay.full}
            </span>
            <span className="rounded-full bg-[#F8FAFC] px-3 py-1.5 text-[12px] font-semibold text-[#4E5968]">
              {routineStatusLabel}
            </span>
            <span className="rounded-full bg-[#F8FAFC] px-3 py-1.5 text-[12px] font-semibold text-[#4E5968]">
              {hasWorkoutBodyParts(focusRoutine.bodyParts) ? formatBodyParts(focusRoutine.bodyParts) : "요일 선택 필요"}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-[18px] bg-[#F8FAFC] px-3 py-3">
              <p className="text-[11px] font-semibold text-[#8B95A1]">운동일</p>
              <p className="mt-1 text-[17px] font-bold text-[#191F28]">{configuredDays.length}일</p>
            </div>
            <div className="rounded-[18px] bg-[#F8FAFC] px-3 py-3">
              <p className="text-[11px] font-semibold text-[#8B95A1]">총 운동</p>
              <p className="mt-1 text-[17px] font-bold text-[#191F28]">{totalExercises}개</p>
            </div>
            <div className="rounded-[18px] bg-[#F8FAFC] px-3 py-3">
              <p className="text-[11px] font-semibold text-[#8B95A1]">휴식일</p>
              <p className="mt-1 text-[17px] font-bold text-[#191F28]">{restDays.length}일</p>
            </div>
            <div className="rounded-[18px] bg-[#F8FAFC] px-3 py-3">
              <p className="text-[11px] font-semibold text-[#8B95A1]">슈퍼세트</p>
              <p className="mt-1 text-[17px] font-bold text-[#191F28]">{totalSupersets}개</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold text-[#4E5968]">요일별 상태</p>
            <p className="mt-1 text-[12px] text-[#8B95A1]">오늘은 파란색, 운동일은 초록색, 비어 있는 요일은 회색으로 표시됩니다</p>
          </div>
          <span className="shrink-0 whitespace-nowrap rounded-full bg-[#FFFFFF] px-3 py-1.5 text-[11px] font-semibold text-[#6B7684] shadow-[inset_0_0_0_1px_rgba(229,232,235,1)]">
            빈 요일 {emptyDays.length}일
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {daySummaries.map(({ day, hasRoutine, isRest, isToday, routine }) => {
            const dayPreview = getRoutineDayCardPreview(routine.bodyParts)

            return (
              <div
                key={day.key}
                className={`flex w-[84px] flex-shrink-0 flex-col gap-2 rounded-[20px] border px-2.5 py-3 ${
                  isToday
                    ? "border-[#3182F6] bg-[#EBF3FE]"
                    : hasRoutine
                      ? "border-[#DCE7FB] bg-[#F8FBFF]"
                      : "border-[#E5E8EB] bg-[#F8FAFC]"
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className={`text-[13px] font-semibold ${isToday ? "text-[#3182F6]" : "text-[#191F28]"}`}>
                    {day.label}
                  </span>
                  {isToday ? (
                    <span className="rounded-full bg-white px-1.5 py-0.5 text-[9px] font-semibold text-[#3182F6] shadow-[inset_0_0_0_1px_rgba(49,130,246,0.18)]">
                      오늘
                    </span>
                  ) : null}
                </div>
                <div className="min-h-[42px]">
                  <p className={`truncate text-[11px] font-semibold ${isToday ? "text-[#3182F6]" : "text-[#4E5968]"}`}>
                    {dayPreview.label}
                  </p>
                  {dayPreview.extraLabel ? (
                    <p className="mt-1 text-[10px] text-[#8B95A1]">{dayPreview.extraLabel}</p>
                  ) : (
                    <p className="mt-1 text-[10px] text-[#8B95A1]">{isRest ? "휴식일" : "미설정"}</p>
                  )}
                </div>
                <span
                  className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    isToday
                      ? "bg-[#3182F6] text-white"
                      : hasRoutine
                        ? "bg-[#EAF7EC] text-[#2CB52C]"
                        : "bg-[#EEF2F6] text-[#8B95A1]"
                  }`}
                >
                  {isToday ? "선택 중" : hasRoutine ? (isRest ? "휴식" : "운동") : "비어있음"}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold text-[#4E5968]">요일별 상세</p>
            <p className="mt-1 text-[12px] text-[#8B95A1]">각 요일의 부위, 운동 수, 슈퍼세트 구성을 한 번에 확인할 수 있습니다</p>
          </div>
          <span className="shrink-0 whitespace-nowrap rounded-full bg-[#F8FAFC] px-3 py-1.5 text-[11px] font-semibold text-[#6B7684]">
            오늘 포함 {configuredDays.length}일
          </span>
        </div>
        {daySummaries.map(({ day, routine, exerciseGroups, hasRoutine, isRest, isToday, supersetCount }) => {
          const isEmpty = !hasRoutine
          const exerciseCount = routine.exercises.length

          return (
            <div
              key={day.key}
              className={`overflow-hidden rounded-[22px] border shadow-[0_16px_32px_-34px_rgba(15,23,42,0.24)] ${
                isToday ? "border-[#3182F6]" : "border-[#E5E8EB]"
              }`}
            >
              <div className={`flex items-center justify-between px-4 py-3 ${isToday ? "bg-[#EBF3FE]" : "bg-[#F8FAFC]"}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[14px] font-semibold ${isToday ? "text-[#3182F6]" : "text-[#191F28]"}`}>
                      {day.full}
                    </span>
                    {isToday ? (
                      <span className="rounded-full border border-[#3182F6] bg-[#FFFFFF] px-2 py-0.5 text-[11px] font-semibold text-[#3182F6]">
                        오늘
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-[12px] text-[#4E5968]">
                    {hasRoutine ? formatBodyParts(routine.bodyParts) : "아직 설정된 운동이 없습니다"}
                  </p>
                </div>
                <div className="ml-2 flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      isEmpty
                        ? "border border-[#E5E8EB] bg-[#FFFFFF] text-[#8B95A1]"
                        : isRest
                          ? "bg-[#EEF2F6] text-[#6B7684]"
                          : "bg-[#EAF7EC] text-[#2CB52C]"
                    }`}
                  >
                    {isEmpty ? "미설정" : isRest ? "휴식일" : "운동일"}
                  </span>
                  {hasRoutine ? (
                    <span className="text-[11px] text-[#8B95A1]">
                      {exerciseCount}개 운동 · {supersetCount}개 슈퍼세트
                    </span>
                  ) : null}
                </div>
              </div>

              {isEmpty || isRest ? (
                <div className="flex items-center justify-center bg-[#FFFFFF] px-4 py-5">
                  <span className="text-[13px] text-[#8B95A1]">
                    {isRest ? "회복에 집중하는 날입니다" : "운동을 추가하면 이곳에 카드가 표시됩니다"}
                  </span>
                </div>
              ) : (
                <div className="divide-y divide-[#E5E8EB] bg-[#FFFFFF]">
                  {exerciseGroups.map((group) =>
                    group.isSuperset ? (
                      <div key={group.id} className="px-4 py-3">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded-full bg-[#EBF3FE] px-2 py-0.5 text-[10px] font-semibold text-[#3182F6]">
                            슈퍼세트
                          </span>
                          <span className="truncate text-[12px] font-semibold text-[#4E5968]">
                            {formatSupersetExerciseNames(group.exercises)}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2">
                          {group.exercises.map((exercise) => (
                            <div
                              key={exercise.id}
                              className="flex items-center justify-between rounded-xl bg-[#F8FAFC] px-3 py-3 ring-1 ring-inset ring-[#EEF2F6]"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <MachineVisual machineId={exercise.machineId} size={36} />
                                <div className="min-w-0">
                                  <p className="truncate text-[13px] font-medium text-[#191F28]">{exercise.machineName}</p>
                                  <p className="mt-1 text-[11px] text-[#8B95A1]">목표 {formatExerciseMetricSummary(exercise)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div key={group.id} className="flex items-center justify-between px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <MachineVisual machineId={group.exercises[0].machineId} size={36} />
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-[#191F28]">{group.exercises[0].machineName}</p>
                            <p className="mt-1 text-[11px] text-[#8B95A1]">목표 {formatExerciseMetricSummary(group.exercises[0])}</p>
                          </div>
                        </div>
                        <span className="ml-3 shrink-0 text-[12px] font-semibold text-[#4E5968]">
                          {group.exercises[0].sets ? `${group.exercises[0].sets}세트` : "기본 세트"}
                        </span>
                      </div>
                    ),
                  )}
                  <div className="flex items-center justify-between bg-[#F8FAFC] px-4 py-2.5">
                    <span className="text-[12px] text-[#8B95A1]">운동 수</span>
                    <span className="text-[12px] font-semibold text-[#4E5968]">{exerciseCount}개</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
