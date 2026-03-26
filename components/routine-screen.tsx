"use client"

import {
  DAY_META,
  formatBodyParts,
  getRoutineDayCardPreview,
  getTodayDayKey,
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
  const configuredDays = DAY_META.filter((day) => {
    const routine = routines[day.key]
    return hasWorkoutBodyParts(routine.bodyParts)
  })
  const focusDay =
    DAY_META.find((day) => day.key === todayKey && hasWorkoutBodyParts(routines[day.key].bodyParts)) ?? configuredDays[0] ?? DAY_META[0]
  const focusRoutine = routines[focusDay.key]
  const totalSets = configuredDays.reduce((sum, day) => {
    return sum + routines[day.key].exercises.reduce((exerciseSum, exercise) => exerciseSum + (Number(exercise.sets) || 0), 0)
  }, 0)

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold text-[#8B95A1]">주간 계획</p>
            <h2 className="mt-1 text-[24px] font-bold tracking-tight text-[#191F28]">루틴</h2>
            <p className="mt-1.5 text-[13px] text-[#6B7684]">
              {hasWorkoutBodyParts(focusRoutine.bodyParts)
                ? `${focusDay.full} · ${formatBodyParts(focusRoutine.bodyParts)}`
                : "먼저 볼 루틴부터 정리합니다"}
            </p>
          </div>
          <button
            className="rounded-full bg-[#191F28] px-3.5 py-2 text-[12px] font-semibold text-white"
            onClick={onEdit}
            type="button"
          >
            수정
          </button>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
          <span className="shrink-0 rounded-full bg-[#FFFFFF] px-3 py-2 text-[12px] font-semibold text-[#191F28] shadow-[inset_0_0_0_1px_rgba(229,232,235,1)]">
            운동일 {configuredDays.length}일
          </span>
          <span className="shrink-0 rounded-full bg-[#FFFFFF] px-3 py-2 text-[12px] font-semibold text-[#191F28] shadow-[inset_0_0_0_1px_rgba(229,232,235,1)]">
            총 세트 {totalSets}
          </span>
          <span className="shrink-0 rounded-full bg-[#FFFFFF] px-3 py-2 text-[12px] font-semibold text-[#191F28] shadow-[inset_0_0_0_1px_rgba(229,232,235,1)]">
            대표 루틴 {focusDay.full}
          </span>
        </div>
      </div>

      <div className="px-4 mb-4">
        <p className="mb-2 text-[13px] font-semibold text-[#4E5968]">요일별 상태</p>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {DAY_META.map((day) => {
            const routine = routines[day.key]
            const isToday = day.key === todayKey
            const hasRoutine = hasWorkoutBodyParts(routine.bodyParts)
            const dayPreview = getRoutineDayCardPreview(routine.bodyParts)

            return (
              <div
                key={day.key}
                className={`flex w-[74px] flex-shrink-0 flex-col items-center justify-between gap-2 rounded-[20px] px-2 py-3 ${
                  isToday ? "border-[#3182F6] bg-[#EBF3FE]" : "border-[#E5E8EB] bg-[#F8FAFC]"
                }`}
              >
                <span className={`text-[13px] font-semibold ${isToday ? "text-[#3182F6]" : "text-[#4E5968]"}`}>
                  {day.label}
                </span>
                <div className="flex min-h-[34px] w-full flex-col items-center justify-center gap-1">
                  <span
                    className={`max-w-full truncate text-center text-[11px] font-semibold leading-none ${
                      isToday ? "text-[#3182F6]" : "text-[#6B7684]"
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
                <span className={`h-1.5 w-1.5 rounded-full ${hasRoutine ? "bg-[#2CB52C]" : "bg-[#E5E8EB]"}`} />
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-6">
        {DAY_META.map((day) => {
          const routine = routines[day.key]
          const isToday = day.key === todayKey
          const isRest = isRestDay(routine.bodyParts)
          const isEmpty = routine.bodyParts.length === 0

          return (
            <div
              key={day.key}
              className={`overflow-hidden rounded-[22px] border ${
                isToday ? "border-[#3182F6]" : "border-[#E5E8EB]"
              }`}
            >
              <div className={`flex items-center justify-between px-4 py-3 ${isToday ? "bg-[#EBF3FE]" : "bg-[#F8FAFC]"}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-[14px] font-semibold ${isToday ? "text-[#3182F6]" : "text-[#191F28]"}`}>
                    {day.full}
                  </span>
                  {isToday ? (
                    <span className="rounded-full border border-[#3182F6] bg-[#FFFFFF] px-2 py-0.5 text-[11px] font-semibold text-[#3182F6]">
                      오늘
                    </span>
                  ) : null}
                  {routine.bodyParts.length > 0 ? (
                    <span className="text-[12px] text-[#4E5968]">{formatBodyParts(routine.bodyParts)}</span>
                  ) : null}
                </div>
                {isEmpty || isRest ? (
                  <span className="rounded-full border border-[#E5E8EB] bg-[#FFFFFF] px-2.5 py-1 text-[12px] text-[#8B95A1]">
                    {isRest ? "휴식일" : "미설정"}
                  </span>
                ) : null}
              </div>

              {isEmpty || isRest ? (
                <div className="flex items-center justify-center bg-[#FFFFFF] px-4 py-4">
                  <span className="text-[13px] text-[#8B95A1]">
                    {isRest ? "오늘은 쉬어요" : "아직 설정된 운동이 없습니다"}
                  </span>
                </div>
              ) : (
                <div className="divide-y divide-[#E5E8EB] bg-[#FFFFFF]">
                  {routine.exercises.map((exercise) => (
                    <div key={exercise.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <MachineVisual machineId={exercise.machineId} size={36} />
                        <span className="truncate text-[13px] font-medium text-[#191F28]">{exercise.machineName}</span>
                      </div>
                      <span className="text-[12px] text-[#8B95A1]">
                        {exercise.weight}kg · {exercise.reps}회 · {exercise.sets}세트
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between bg-[#F8FAFC] px-4 py-2.5">
                    <span className="text-[12px] text-[#8B95A1]">총 세트</span>
                    <span className="text-[12px] font-semibold text-[#4E5968]">
                      {routine.exercises.reduce((sum, exercise) => sum + (Number(exercise.sets) || 0), 0)}세트
                    </span>
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
