"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchMyGrass } from "@/lib/api"
import { getReadableApiError } from "@/lib/api-client"
import type { ApiGrassEntry } from "@/lib/api-types"
import { GrassScreenSkeleton } from "./loading-skeletons"

type DayData = {
  date: number
  fullDate: string
  pct: number
  hasRecord: boolean
  isCompleted: boolean
}

function getGrassColor(pct: number) {
  if (pct === 0) return "#EAECEF"
  if (pct < 34) return "#B8EFB8"
  if (pct < 67) return "#5FD35F"
  if (pct < 100) return "#2CB52C"
  return "#1A8C1A"
}

function toLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`)
}

function formatMonthLabel(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
}

function normalizeCompletionPercent(value: unknown) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return 0
  }

  return Math.max(0, Math.min(100, Math.round(parsed)))
}

function getDayStatus(pct: number, isCompleted: boolean, hasRecord: boolean) {
  if (isCompleted || pct >= 100) {
    return {
      label: "완료",
      badgeClassName: "border border-[#B8EFB8] bg-[#F6FFF6] text-[#2CB52C]",
      detailLabel: "운동 완료",
    }
  }

  if (hasRecord && pct > 0) {
    return {
      label: "진행 중",
      badgeClassName: "border border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]",
      detailLabel: "운동 진행 중",
    }
  }

  return {
    label: "미기록",
    badgeClassName: "border border-[#E5E8EB] bg-[#FFFFFF] text-[#8B95A1]",
    detailLabel: "기록 없음",
  }
}

function buildMonthCells(entries: ApiGrassEntry[], monthDate: Date) {
  const entryMap = new Map(entries.map((entry) => [entry.date, entry]))
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7
  const cells: (DayData | null)[] = []

  for (let index = 0; index < startOffset; index += 1) {
    cells.push(null)
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const fullDate = toLocalDateKey(new Date(year, month, day))
    const entry = entryMap.get(fullDate)

    cells.push({
      date: day,
      fullDate,
      pct: normalizeCompletionPercent(entry?.completion_percent),
      hasRecord: Boolean(entry),
      isCompleted: Boolean(entry?.is_completed),
    })
  }

  return cells
}

function calculateStreak(entries: ApiGrassEntry[]) {
  const completed = new Set(entries.filter((entry) => entry.is_completed).map((entry) => entry.date))
  let streak = 0
  const cursor = new Date()

  while (completed.has(toLocalDateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export default function GrassScreen({
  previewEntries,
  token,
}: {
  previewEntries?: ApiGrassEntry[]
  token: string | null
}) {
  const todayKey = toLocalDateKey(new Date())
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey)
  const {
    data: remoteGrassEntries = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ["grass", token],
    queryFn: () => fetchMyGrass(token as string),
    enabled: Boolean(token),
  })
  const monthDate = useMemo(() => new Date(), [])
  const isPreviewMode = !token && Boolean(previewEntries?.length)
  const grassEntries = isPreviewMode ? (previewEntries ?? []) : remoteGrassEntries
  const daysInMonth = useMemo(() => new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate(), [monthDate])
  const monthEntries = useMemo(
    () =>
      grassEntries
        .filter((entry) => {
          const date = parseDate(entry.date)
          return date.getFullYear() === monthDate.getFullYear() && date.getMonth() === monthDate.getMonth()
        })
        .sort((left, right) => left.date.localeCompare(right.date)),
    [grassEntries, monthDate],
  )
  const cells = useMemo(() => buildMonthCells(monthEntries, monthDate), [monthEntries, monthDate])
  const selectedDay = cells.find((cell): cell is DayData => Boolean(cell && cell.fullDate === selectedDateKey))
  const completedEntries = monthEntries.filter((entry) => entry.is_completed)
  const recordedEntries = [...monthEntries]
    .filter((entry) => normalizeCompletionPercent(entry.completion_percent) > 0)
    .reverse()
    .slice(0, 5)
  const workoutCount = completedEntries.length
  const avgPct = Math.round(
    monthEntries.reduce((sum, entry) => sum + normalizeCompletionPercent(entry.completion_percent), 0) / daysInMonth,
  )
  const streak = calculateStreak(grassEntries)
  const weekDayLabels = ["월", "화", "수", "목", "금", "토", "일"]

  if (!token && !isPreviewMode) {
    return (
      <div className="flex h-full flex-col overflow-y-auto px-4 pt-5 pb-6">
        <h2 className="text-[20px] font-bold tracking-tight text-[#191F28]">운동 잔디</h2>
        <div className="mt-4 rounded-2xl border border-[#E5E8EB] bg-[#FFFFFF] px-4 py-5">
          <p className="text-[14px] font-semibold text-[#191F28]">로그인 이후 잔디 기록을 불러옵니다</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <GrassScreenSkeleton />
  }

  if (error) {
    return (
      <div className="flex h-full flex-col overflow-y-auto px-4 pt-5 pb-6">
        <h2 className="text-[20px] font-bold tracking-tight text-[#191F28]">운동 잔디</h2>
        <div className="mt-4 rounded-2xl border border-[#E5E8EB] bg-[#FFFFFF] px-4 py-5">
          <p className="text-[14px] font-semibold text-[#191F28]">잔디 기록을 불러오지 못했습니다</p>
          <p className="mt-1 text-[12px] leading-5 text-[#8B95A1]">{getReadableApiError(error)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="px-4 pt-5 pb-4">
        <h2 className="text-[20px] font-bold tracking-tight text-[#191F28]">운동 잔디</h2>
        <p className="mt-0.5 text-[13px] text-[#8B95A1]">{formatMonthLabel(monthDate)}</p>
        {isPreviewMode ? <p className="mt-1.5 text-[12px] font-medium text-[#3182F6]">샘플 기록으로 미리보기 중입니다</p> : null}
      </div>

      <div className="px-4 mb-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "이번 달 달성률", value: `${avgPct}%` },
            { label: "연속", value: `${streak}일` },
            { label: "이번 달 완료", value: `${workoutCount}회` },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-1 rounded-2xl border border-[#E5E8EB] bg-[#F8FAFC] px-3 py-3">
              <span className="text-[11px] font-medium text-[#8B95A1]">{label}</span>
              <span className="text-[20px] font-bold leading-none text-[#191F28]">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="rounded-2xl border border-[#E5E8EB] bg-[#FFFFFF] p-4">
          <div className="mb-1.5 grid grid-cols-7 gap-1">
            {weekDayLabels.map((day) => (
              <div key={day} className="text-center text-[10px] font-medium text-[#8B95A1]">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, index) => {
              if (!cell) {
                return <div key={`empty-${index}`} className="aspect-square" />
              }

              const isToday = cell.fullDate === todayKey
              const isSelected = cell.fullDate === selectedDateKey

              return (
                <button
                  key={cell.fullDate}
                  className={`relative aspect-square rounded-lg transition-all ${isSelected ? "ring-2 ring-[#3182F6] ring-offset-1" : ""}`}
                  onClick={() => setSelectedDateKey(cell.fullDate)}
                  style={{ backgroundColor: getGrassColor(cell.pct) }}
                  type="button"
                >
                  {isToday ? <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border border-white bg-[#3182F6]" /> : null}
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-medium text-[#8B95A1]">미기록</span>
            {["#EAECEF", "#B8EFB8", "#5FD35F", "#2CB52C", "#1A8C1A"].map((color) => (
              <div key={color} className="h-4 w-4 rounded" style={{ backgroundColor: color }} />
            ))}
            <span className="text-[11px] font-medium text-[#8B95A1]">완료</span>
          </div>
        </div>
      </div>

      {selectedDay ? (
        <div className="px-4 mb-4">
          <div className="rounded-2xl border border-[#E5E8EB] bg-[#F8FAFC] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[14px] font-semibold text-[#191F28]">
                {monthDate.getMonth() + 1}월 {selectedDay.date}일
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${getDayStatus(selectedDay.pct, selectedDay.isCompleted, selectedDay.hasRecord).badgeClassName}`}
              >
                {getDayStatus(selectedDay.pct, selectedDay.isCompleted, selectedDay.hasRecord).label}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "상태",
                  value: getDayStatus(selectedDay.pct, selectedDay.isCompleted, selectedDay.hasRecord).detailLabel,
                },
                { label: "달성률", value: `${selectedDay.pct}%` },
                { label: "날짜", value: `${selectedDay.date}일` },
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-[#8B95A1]">{item.label}</span>
                  <span className="text-[14px] font-semibold text-[#191F28]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="px-4 mb-6">
        <p className="mb-2 text-[13px] font-semibold text-[#4E5968]">최근 운동 기록</p>
        {recordedEntries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E5E8EB] py-8 text-center">
            <p className="text-[13px] font-medium text-[#191F28]">아직 운동 기록이 없습니다</p>
            <p className="mt-1 text-[12px] text-[#8B95A1]">오늘 운동을 저장하면 잔디가 채워집니다</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recordedEntries.map((entry) => {
              const date = parseDate(entry.date)
              const isSelected = entry.date === selectedDateKey
              const pct = normalizeCompletionPercent(entry.completion_percent)
              const status = getDayStatus(pct, entry.is_completed, true)

              return (
                <button
                  key={entry.date}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                    isSelected ? "border-[#3182F6] bg-[#EBF3FE]" : "border-[#E5E8EB] bg-[#FFFFFF]"
                  }`}
                  onClick={() => setSelectedDateKey(entry.date)}
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: getGrassColor(pct) }} />
                    <div>
                      <p className="text-[13px] font-semibold text-[#191F28]">
                        {date.getMonth() + 1}월 {date.getDate()}일
                      </p>
                      <p className="text-[12px] text-[#8B95A1]">{status.detailLabel}</p>
                    </div>
                  </div>
                  <p className={`text-[13px] font-bold ${entry.is_completed || pct >= 100 ? "text-[#2CB52C]" : "text-[#2563EB]"}`}>{pct}%</p>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
