import type { Weekday } from "@/types";

export const weekdayOrder: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const weekdayLabels: Record<Weekday, string> = {
  mon: "월요일",
  tue: "화요일",
  wed: "수요일",
  thu: "목요일",
  fri: "금요일",
  sat: "토요일",
  sun: "일요일",
};

export const weekdayShortLabels: Record<Weekday, string> = {
  mon: "월",
  tue: "화",
  wed: "수",
  thu: "목",
  fri: "금",
  sat: "토",
  sun: "일",
};

export function getCurrentWeekday(date = new Date()): Weekday {
  const day = date.getDay();

  switch (day) {
    case 0:
      return "sun";
    case 1:
      return "mon";
    case 2:
      return "tue";
    case 3:
      return "wed";
    case 4:
      return "thu";
    case 5:
      return "fri";
    default:
      return "sat";
  }
}

export function getTodayIsoDate(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function formatHeroDate(date = new Date()): string {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

export function formatMiniDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
  }).format(date);
}

