"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchMyGrass } from "@/lib/api"
import { getReadableApiError } from "@/lib/api-client"

type DayData = {
  date: number
  fullDate: string
  pct: number
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

function buildMonthCells(entries: Array<{ date: string; is_completed: boolean }>, monthDate: Date) {
  const entryMap = new Map(entries.map((entry) => [entry.date, entry.is_completed]))
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
    cells.push({
      date: day,
      fullDate,
      pct: entryMap.get(fullDate) ? 100 : 0,
    })
  }

  return cells
}

function calculateStreak(entries: Array<{ date: string; is_completed: boolean }>) {
  const completed = new Set(entries.filter((entry) => entry.is_completed).map((entry) => entry.date))
  let streak = 0
  const cursor = new Date()

  while (completed.has(toLocalDateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export default function GrassScreen({ token }: { token: string | null }) {
  const todayKey = toLocalDateKey(new Date())
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey)
  const {
    data: grassEntries = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ["grass", token],
    queryFn: () => fetchMyGrass(token as string),
    enabled: Boolean(token),
  })

  if (!token) {
    return (
      <div className="flex h-full flex-col overflow-y-auto px-4 pt-5 pb-6">
        <h2 className="text-[20px] font-bold tracking-tight text-[#191F28]">운동 잔디</h2>
        <div className="mt-4 rounded-2xl border border-[#E5E8EB] bg-[#FFFFFF] px-4 py-5">
          <p className="text-[14px] font-semibold text-[#191F28]">로그인 이후 잔디 기록을 불러옵니다</p>
        </div>
      </div>
    )
  }

  const monthDate = useMemo(() => new Date(), [])
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
  const workoutCount = completedEntries.length
  const avgPct = Math.round((workoutCount / new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate()) * 100)
  const streak = calculateStreak(grassEntries)
  const recentEntries = [...completedEntries].reverse().slice(0, 5)
  const weekDayLabels = ["월", "화", "수", "목", "금", "토", "일"]

  if (isLoading) {
    return <div className="min-h-full bg-[#F7F8FA]" />
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
                className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${
                  selectedDay.pct > 0
                    ? "border border-[#B8EFB8] bg-[#F6FFF6] text-[#2CB52C]"
                    : "border border-[#E5E8EB] bg-[#FFFFFF] text-[#8B95A1]"
                }`}
              >
                {selectedDay.pct > 0 ? "완료" : "미기록"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "상태", value: selectedDay.pct > 0 ? "운동 완료" : "기록 없음" },
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
        <p className="mb-2 text-[13px] font-semibold text-[#4E5968]">최근 완료 기록</p>
        {recentEntries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E5E8EB] py-8 text-center">
            <p className="text-[13px] font-medium text-[#191F28]">아직 완료 기록이 없습니다</p>
            <p className="mt-1 text-[12px] text-[#8B95A1]">오늘 운동을 완료하면 잔디가 채워집니다</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentEntries.map((entry) => {
              const date = parseDate(entry.date)
              const isSelected = entry.date === selectedDateKey

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
                    <div className="h-3 w-3 rounded-sm bg-[#2CB52C]" />
                    <div>
                      <p className="text-[13px] font-semibold text-[#191F28]">
                        {date.getMonth() + 1}월 {date.getDate()}일
                      </p>
                      <p className="text-[12px] text-[#8B95A1]">운동 완료</p>
                    </div>
                  </div>
                  <p className="text-[13px] font-bold text-[#2CB52C]">100%</p>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
