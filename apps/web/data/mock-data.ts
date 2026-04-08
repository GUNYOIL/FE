import { getTodayIsoDate, weekdayOrder } from "@/lib/date";
import type {
  DayRoutine,
  HistoryEntry,
  MealInfo,
  ProteinItem,
  TabItem,
  UserProfile,
  Weekday,
  WorkoutRecords,
} from "@/types";

export const machineLibrary = [
  "체스트 프레스",
  "랫 풀다운",
  "레그 프레스",
  "숄더 프레스",
  "시티드 로우",
  "스미스 머신",
  "펙덱 플라이",
  "레그 컬",
  "케이블 크로스오버",
  "케이블 푸시다운",
  "덤벨 벤치",
  "덤벨 컬",
  "덤벨 숄더 프레스",
  "덤벨 로우",
  "스쿼트 랙",
  "어시스트 풀업",
  "러닝머신 걷기",
  "폼롤러",
];

export const tabItems: TabItem[] = [
  {
    id: "home",
    label: "홈",
    description: "오늘 요약",
  },
  {
    id: "today",
    label: "기록",
    description: "오늘 운동",
  },
  {
    id: "routine",
    label: "루틴",
    description: "요일별 편집",
  },
  {
    id: "protein",
    label: "단백질",
    description: "식단과 보충",
  },
  {
    id: "grass",
    label: "잔디",
    description: "기록 흐름",
  },
  {
    id: "profile",
    label: "마이페이지",
    description: "기준과 설정",
  },
];

export const initialProfile: UserProfile = {
  name: "",
  email: "",
  gender: "male",
  height: 176,
  weight: 68,
  goal: "bulk",
};

export const initialRoutine: DayRoutine[] = [
  {
    day: "mon",
    label: "월요일",
    shortLabel: "월",
    theme: "",
    focus: "",
    exercises: [],
  },
  {
    day: "tue",
    label: "화요일",
    shortLabel: "화",
    theme: "",
    focus: "",
    exercises: [],
  },
  {
    day: "wed",
    label: "수요일",
    shortLabel: "수",
    theme: "",
    focus: "",
    exercises: [],
  },
  {
    day: "thu",
    label: "목요일",
    shortLabel: "목",
    theme: "",
    focus: "",
    exercises: [],
  },
  {
    day: "fri",
    label: "금요일",
    shortLabel: "금",
    theme: "",
    focus: "",
    exercises: [],
  },
  {
    day: "sat",
    label: "토요일",
    shortLabel: "토",
    theme: "",
    focus: "",
    exercises: [],
  },
  {
    day: "sun",
    label: "일요일",
    shortLabel: "일",
    theme: "",
    focus: "",
    exercises: [],
  },
];

function createInitialRecords(): WorkoutRecords {
  return {
    mon: {},
    tue: {},
    wed: {},
    thu: {},
    fri: {},
    sat: {},
    sun: {},
  };
}

export const initialRecords = createInitialRecords();

export const initialProteinItems: ProteinItem[] = [];

export const mealByDay: Record<Weekday, MealInfo> = {
  mon: {
    title: "닭가슴살 비빔밥 세트",
    items: ["닭가슴살 비빔밥", "계란국", "두부조림", "요구르트"],
    estimatedProtein: 32,
    note: "닭가슴살과 두부 기준으로 계산한 추정치입니다.",
  },
  tue: {
    title: "돼지 불고기 정식",
    items: ["돼지 불고기", "현미밥", "미역국", "콩나물무침"],
    estimatedProtein: 26,
    note: "고기 양에 따라 섭취량 차이가 커서 급식량 보정을 권장합니다.",
  },
  wed: {
    title: "치킨 스테이크 플레이트",
    items: ["치킨 스테이크", "감자구이", "양배추 샐러드", "우유"],
    estimatedProtein: 34,
    note: "우유 포함 기준입니다. 샐러드 토핑 추가 여부에 따라 달라질 수 있습니다.",
  },
  thu: {
    title: "제육 덮밥",
    items: ["제육 덮밥", "된장국", "김치", "삶은 계란"],
    estimatedProtein: 29,
    note: "삶은 계란 포함 기준입니다.",
  },
  fri: {
    title: "소고기 카레",
    items: ["소고기 카레", "밥", "샐러드", "우유"],
    estimatedProtein: 24,
    note: "운동 직후라면 우유나 닭가슴살을 추가하는 편이 좋습니다.",
  },
  sat: {
    title: "학교 휴무일 식단",
    items: ["자가 식사", "단백질 보충 기록 권장"],
    estimatedProtein: 18,
    note: "주말은 직접 기록하는 보충 섭취 비중이 큽니다.",
  },
  sun: {
    title: "회복일 식단",
    items: ["집밥", "우유", "계란", "두부"],
    estimatedProtein: 20,
    note: "회복일에도 기본 단백질 섭취는 유지하는 구성이 좋습니다.",
  },
};

export function createHistorySeed(): HistoryEntry[] {
  const entries: HistoryEntry[] = [];
  const today = new Date();

  for (let offset = 83; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);

    const day = date.getDay();
    const base =
      day === 0 ? 0 : day === 3 || day === 5 ? 78 : day === 6 ? 42 : 63;
    const variation = ((offset * 17) % 21) - 10;

    entries.push({
      date: date.toISOString().slice(0, 10),
      completion: Math.max(0, Math.min(100, base + variation)),
    });
  }

  const todayIso = getTodayIsoDate();
  return entries.map((entry) =>
    entry.date === todayIso ? { ...entry, completion: Math.max(entry.completion, 68) } : entry,
  );
}

export const completionHistorySeed = createHistorySeed();

export const selectedWeekOverview = weekdayOrder.map((day) => {
  const routine = initialRoutine.find((item) => item.day === day);

  return {
    day,
    focus: routine?.theme ?? "미설정",
    count: routine?.exercises.length ?? 0,
  };
});
