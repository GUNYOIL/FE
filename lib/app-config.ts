export const DAY_META = [
  { key: "mon", label: "월", full: "월요일" },
  { key: "tue", label: "화", full: "화요일" },
  { key: "wed", label: "수", full: "수요일" },
  { key: "thu", label: "목", full: "목요일" },
  { key: "fri", label: "금", full: "금요일" },
  { key: "sat", label: "토", full: "토요일" },
  { key: "sun", label: "일", full: "일요일" },
] as const

export const BODY_PARTS = [
  "상부 가슴",
  "중부 가슴",
  "하부 가슴",
  "광배",
  "상부 등",
  "척추기립근",
  "전면 어깨",
  "측면 어깨",
  "후면 어깨",
  "이두",
  "삼두",
  "전완",
  "대퇴사두",
  "햄스트링",
  "둔근",
  "종아리",
  "복근",
  "유산소",
  "전신",
  "휴식",
] as const
export const REST_DAY_BODY_PART = "휴식" as const
export const PERFORMANCE_TRAINING_PARTS = [
  "스트렝스 트레이닝",
  "순발력 트레이닝",
  "안정화 트레이닝",
  "근메스 트레이닝",
  "협응력 트레이닝",
] as const
export const PERFORMANCE_ROUTINE_OPTIONS = [...PERFORMANCE_TRAINING_PARTS, REST_DAY_BODY_PART] as const

export const GOAL_OPTIONS = [
  {
    key: "muscle_gain",
    label: "골격근 증가",
    helper: "강한 증량 루틴에 맞춰 단백질을 높게 잡습니다",
    proteinMultiplier: 2.1,
  },
  {
    key: "lean_mass",
    label: "린매스업",
    helper: "체지방을 크게 늘리지 않는 범위에서 증량합니다",
    proteinMultiplier: 1.9,
  },
  {
    key: "diet",
    label: "다이어트",
    helper: "감량 중 근손실 방지를 위해 단백질 비중을 유지합니다",
    proteinMultiplier: 2.0,
  },
  {
    key: "performance",
    label: "퍼포먼스 증가",
    helper: "중량과 수행 능력 향상에 맞춰 회복 중심으로 단백질을 잡습니다",
    proteinMultiplier: 1.8,
  },
  {
    key: "maintenance",
    label: "유지",
    helper: "현재 체형과 운동량을 유지하는 기준입니다",
    proteinMultiplier: 1.6,
  },
] as const

export const MACHINE_CATEGORIES = [
  { key: "all", label: "전체" },
  { key: "chest", label: "가슴" },
  { key: "back", label: "등" },
  { key: "legs", label: "하체" },
  { key: "shoulder", label: "어깨" },
  { key: "arms", label: "팔" },
  { key: "core", label: "복근" },
  { key: "cardio", label: "유산소" },
] as const

export const MACHINES = [
  { id: "fly", name: "플라잉 체스트 머신", category: "chest", muscle: "대흉근" },
  { id: "chest-press", name: "체스트 프레스 머신", category: "chest", muscle: "대흉근" },
  { id: "incline-press", name: "인클라인 프레스 머신", category: "chest", muscle: "상부 가슴" },
  { id: "barbell-bench", name: "바벨 벤치프레스", category: "chest", muscle: "중부 가슴/삼두" },
  { id: "dumbbell-bench", name: "덤벨 벤치프레스", category: "chest", muscle: "가슴/삼두" },
  { id: "incline-dumbbell-press", name: "인클라인 덤벨 프레스", category: "chest", muscle: "상부 가슴" },
  { id: "decline-dumbbell-press", name: "디클라인 덤벨 프레스", category: "chest", muscle: "하부 가슴" },
  { id: "dumbbell-fly", name: "덤벨 플라이", category: "chest", muscle: "가슴 스트레치" },
  { id: "weighted-dips", name: "웨이티드 딥스", category: "chest", muscle: "하부 가슴/삼두" },
  { id: "lat-pulldown", name: "랫풀다운", category: "back", muscle: "광배근" },
  { id: "seated-row", name: "시티드 로우", category: "back", muscle: "등 중앙" },
  { id: "assisted-pullup", name: "어시스트 풀업", category: "back", muscle: "광배근" },
  { id: "dumbbell-row", name: "원암 덤벨 로우", category: "back", muscle: "광배근" },
  { id: "barbell-row", name: "바벨 벤트오버 로우", category: "back", muscle: "광배/상부 등" },
  { id: "pendlay-row", name: "펜들레이 로우", category: "back", muscle: "상부 등/광배" },
  { id: "pull-up", name: "풀업", category: "back", muscle: "광배근" },
  { id: "chin-up", name: "친업", category: "back", muscle: "광배/이두" },
  { id: "barbell-shrug", name: "바벨 슈러그", category: "back", muscle: "승모근" },
  { id: "leg-press", name: "레그 프레스", category: "legs", muscle: "대퇴사두" },
  { id: "leg-extension", name: "레그 익스텐션", category: "legs", muscle: "대퇴사두" },
  { id: "leg-curl", name: "레그 컬", category: "legs", muscle: "햄스트링" },
  { id: "smith-squat", name: "스미스 스쿼트", category: "legs", muscle: "하체" },
  { id: "barbell-back-squat", name: "바벨 백 스쿼트", category: "legs", muscle: "대퇴사두/둔근" },
  { id: "front-squat", name: "프론트 스쿼트", category: "legs", muscle: "대퇴사두/코어" },
  { id: "goblet-squat", name: "고블릿 스쿼트", category: "legs", muscle: "하체/코어" },
  { id: "romanian-deadlift", name: "루마니안 데드리프트", category: "legs", muscle: "햄스트링/둔근" },
  { id: "dumbbell-lunge", name: "덤벨 런지", category: "legs", muscle: "대퇴사두/둔근" },
  { id: "bulgarian-split-squat", name: "불가리안 스플릿 스쿼트", category: "legs", muscle: "대퇴사두/둔근" },
  { id: "barbell-hip-thrust", name: "바벨 힙 쓰러스트", category: "legs", muscle: "둔근" },
  { id: "shoulder-press", name: "숄더 프레스 머신", category: "shoulder", muscle: "전면 삼각근" },
  { id: "lateral-raise", name: "레터럴 레이즈 머신", category: "shoulder", muscle: "측면 삼각근" },
  { id: "dumbbell-press", name: "덤벨 숄더 프레스", category: "shoulder", muscle: "삼각근" },
  { id: "rear-delt", name: "리어 델트 머신", category: "shoulder", muscle: "후면 삼각근" },
  { id: "barbell-overhead-press", name: "바벨 오버헤드 프레스", category: "shoulder", muscle: "전면 어깨" },
  { id: "arnold-press", name: "아놀드 프레스", category: "shoulder", muscle: "전면/측면 어깨" },
  { id: "dumbbell-lateral-raise", name: "덤벨 레터럴 레이즈", category: "shoulder", muscle: "측면 어깨" },
  { id: "rear-delt-fly", name: "덤벨 리어 델트 플라이", category: "shoulder", muscle: "후면 어깨" },
  { id: "upright-row", name: "바벨 업라이트 로우", category: "shoulder", muscle: "측면 어깨/승모" },
  { id: "cable-pushdown", name: "케이블 푸시다운", category: "arms", muscle: "삼두" },
  { id: "dumbbell-curl", name: "덤벨 컬", category: "arms", muscle: "이두" },
  { id: "hammer-curl", name: "해머 컬", category: "arms", muscle: "이두/전완" },
  { id: "preacher-curl", name: "프리처 컬", category: "arms", muscle: "이두" },
  { id: "overhead-triceps", name: "오버헤드 트라이셉스 익스텐션", category: "arms", muscle: "삼두" },
  { id: "dip-machine", name: "어시스트 딥스", category: "arms", muscle: "삼두/가슴" },
  { id: "ez-bar-curl", name: "EZ바 컬", category: "arms", muscle: "이두" },
  { id: "incline-dumbbell-curl", name: "인클라인 덤벨 컬", category: "arms", muscle: "이두" },
  { id: "concentration-curl", name: "컨센트레이션 컬", category: "arms", muscle: "이두" },
  { id: "skull-crusher", name: "스컬 크러셔", category: "arms", muscle: "삼두" },
  { id: "dumbbell-kickback", name: "덤벨 킥백", category: "arms", muscle: "삼두" },
  { id: "reverse-curl", name: "리버스 컬", category: "arms", muscle: "전완/이두" },
  { id: "close-grip-bench", name: "클로즈그립 벤치프레스", category: "arms", muscle: "삼두" },
  { id: "back-extension", name: "백 익스텐션", category: "back", muscle: "척추기립근" },
  { id: "glute-drive", name: "글루트 드라이브", category: "legs", muscle: "둔근" },
  { id: "calf-raise", name: "카프 레이즈 머신", category: "legs", muscle: "종아리" },
  { id: "ab-crunch", name: "앱 크런치 머신", category: "core", muscle: "복근" },
  { id: "cable-crunch", name: "케이블 크런치", category: "core", muscle: "복근" },
  { id: "hanging-leg-raise", name: "행잉 레그 레이즈", category: "core", muscle: "복근/고관절" },
  { id: "weighted-sit-up", name: "웨이티드 싯업", category: "core", muscle: "복근" },
  { id: "ab-wheel", name: "아브 휠 롤아웃", category: "core", muscle: "복근/코어" },
  { id: "treadmill", name: "런닝머신", category: "cardio", muscle: "전신" },
  { id: "cycle", name: "사이클", category: "cardio", muscle: "하체/심폐" },
  { id: "elliptical", name: "일립티컬", category: "cardio", muscle: "전신" },
  { id: "rowing", name: "로잉 머신", category: "cardio", muscle: "전신" },
] as const

export const SET_PRESETS = [
  { label: "3세트 × 10회", sets: "3", reps: "10" },
  { label: "4세트 × 12회", sets: "4", reps: "12" },
  { label: "5세트 × 8회", sets: "5", reps: "8" },
] as const

export type DayKey = (typeof DAY_META)[number]["key"]
export type BodyPart = (typeof BODY_PARTS)[number]
export type PerformanceTrainingPart = (typeof PERFORMANCE_TRAINING_PARTS)[number]
export type RoutineFocus = BodyPart | PerformanceTrainingPart
export type GoalKey = (typeof GOAL_OPTIONS)[number]["key"]
export type MachineCategoryKey = (typeof MACHINE_CATEGORIES)[number]["key"]
export type Gender = "male" | "female"

export type ExerciseDraft = {
  id: string
  machineId: string
  machineName: string
  weight: string
  reps: string
  sets: string
}

export type DayRoutineDraft = {
  bodyParts: RoutineFocus[]
  exercises: ExerciseDraft[]
}

export type RoutineMap = Record<DayKey, DayRoutineDraft>

export type UserProfile = {
  gender: Gender
  height: number
  weight: number
  goal: GoalKey
  proteinTarget: number
}

export type ServingOption = "안 먹음" | "적게" | "보통" | "많이"

export type CafeteriaItem = {
  id: string
  name: string
  serving: ServingOption
}

export type ProteinLogEntry = {
  id: string
  label: string
  protein: number
  time: string
}

export type ProteinState = {
  cafeteria: CafeteriaItem[]
  quickCounts: Record<string, number>
  log: ProteinLogEntry[]
}

export type OnboardingData = {
  profile: UserProfile
  routines: RoutineMap
}

export const SERVING_PROTEIN: Record<ServingOption, number> = {
  "안 먹음": 0,
  "적게": 6,
  "보통": 12,
  "많이": 18,
}

export const DEFAULT_CAFETERIA_ITEMS: CafeteriaItem[] = [
  { id: "c1", name: "닭갈비 볶음", serving: "안 먹음" },
  { id: "c2", name: "계란국", serving: "안 먹음" },
  { id: "c3", name: "두부조림", serving: "안 먹음" },
  { id: "c4", name: "잡곡밥", serving: "안 먹음" },
]

export const QUICK_PROTEIN_ITEMS = [
  { id: "q1", name: "닭가슴살", protein: 23 },
  { id: "q2", name: "프로틴", protein: 24 },
  { id: "q3", name: "우유", protein: 8 },
  { id: "q4", name: "달걀", protein: 6 },
] as const

export function createEmptyRoutineMap(): RoutineMap {
  return {
    mon: { bodyParts: [], exercises: [] },
    tue: { bodyParts: [], exercises: [] },
    wed: { bodyParts: [], exercises: [] },
    thu: { bodyParts: [], exercises: [] },
    fri: { bodyParts: [], exercises: [] },
    sat: { bodyParts: [], exercises: [] },
    sun: { bodyParts: [], exercises: [] },
  }
}

export function getRoutineFocusOptions(goal: GoalKey): readonly RoutineFocus[] {
  return goal === "performance" ? PERFORMANCE_ROUTINE_OPTIONS : BODY_PARTS
}

export function getRoutineFocusLabel(goal: GoalKey) {
  return goal === "performance" ? "트레이닝 유형" : "운동 부위"
}

export function getRoutineFocusHint(goal: GoalKey) {
  return goal === "performance"
    ? "요일별로 훈련 유형을 고르고, 해당 훈련에 맞는 머신과 세트를 설정합니다"
    : "복수 선택 가능, 휴식은 단독 선택됩니다"
}

export function isRestDay(bodyParts: RoutineFocus[]) {
  return bodyParts.includes(REST_DAY_BODY_PART)
}

export function hasWorkoutBodyParts(bodyParts: RoutineFocus[]) {
  return bodyParts.length > 0 && !isRestDay(bodyParts)
}

export function formatBodyParts(bodyParts: RoutineFocus[], emptyLabel = "미설정") {
  if (bodyParts.length === 0) {
    return emptyLabel
  }

  if (isRestDay(bodyParts)) {
    return REST_DAY_BODY_PART
  }

  if (bodyParts.length > 2) {
    return `${bodyParts[0]} 외 ${bodyParts.length - 1}`
  }

  return bodyParts.join(" · ")
}

export function getRoutineDayCardPreview(bodyParts: RoutineFocus[]) {
  const compactLabelMap: Partial<Record<RoutineFocus, string>> = {
    "상부 가슴": "상부가슴",
    "중부 가슴": "중부가슴",
    "하부 가슴": "하부가슴",
    "상부 등": "상부등",
    "전면 어깨": "전면어깨",
    "측면 어깨": "측면어깨",
    "후면 어깨": "후면어깨",
    "스트렝스 트레이닝": "스트렝스",
    "순발력 트레이닝": "순발력",
    "안정화 트레이닝": "안정화",
    "근메스 트레이닝": "근메스",
    "협응력 트레이닝": "협응력",
  }

  if (bodyParts.length === 0) {
    return {
      label: "미설정",
      extraLabel: null as string | null,
    }
  }

  if (isRestDay(bodyParts)) {
    return {
      label: REST_DAY_BODY_PART,
      extraLabel: null as string | null,
    }
  }

  return {
    label: compactLabelMap[bodyParts[0]] ?? bodyParts[0].replaceAll(" ", ""),
    extraLabel: bodyParts.length > 1 ? `+${bodyParts.length - 1}` : null,
  }
}

export function toggleBodyPartSelection(
  currentBodyParts: RoutineFocus[],
  nextBodyPart: RoutineFocus,
  allowedOptions: readonly RoutineFocus[] = BODY_PARTS,
): RoutineFocus[] {
  if (nextBodyPart === REST_DAY_BODY_PART) {
    return isRestDay(currentBodyParts) ? [] : [REST_DAY_BODY_PART]
  }

  const nextSet = new Set(currentBodyParts.filter((bodyPart) => bodyPart !== REST_DAY_BODY_PART))
  if (nextSet.has(nextBodyPart)) {
    nextSet.delete(nextBodyPart)
  } else {
    nextSet.add(nextBodyPart)
  }

  return allowedOptions.filter(
    (bodyPart): bodyPart is Exclude<RoutineFocus, typeof REST_DAY_BODY_PART> =>
      bodyPart !== REST_DAY_BODY_PART && nextSet.has(bodyPart),
  )
}

export function getPreferredMachineCategories(bodyParts: RoutineFocus[]): MachineCategoryKey[] {
  const bodyPartToCategory: Partial<Record<RoutineFocus, MachineCategoryKey[]>> = {
    "상부 가슴": ["chest"],
    "중부 가슴": ["chest"],
    "하부 가슴": ["chest"],
    "광배": ["back"],
    "상부 등": ["back"],
    "척추기립근": ["back"],
    "전면 어깨": ["shoulder"],
    "측면 어깨": ["shoulder"],
    "후면 어깨": ["shoulder"],
    "이두": ["arms"],
    "삼두": ["arms"],
    "전완": ["arms"],
    "대퇴사두": ["legs"],
    "햄스트링": ["legs"],
    "둔근": ["legs"],
    "종아리": ["legs"],
    "복근": ["core"],
    "유산소": ["cardio"],
    "전신": ["legs", "back", "chest", "shoulder", "arms", "core", "cardio"],
    "스트렝스 트레이닝": ["legs", "back", "chest", "shoulder", "arms", "core"],
    "순발력 트레이닝": ["legs", "cardio", "shoulder", "core"],
    "안정화 트레이닝": ["shoulder", "arms", "core", "cardio"],
    "근메스 트레이닝": ["chest", "back", "legs", "shoulder", "arms", "core"],
    "협응력 트레이닝": ["cardio", "legs", "shoulder", "core"],
  }

  return bodyParts.reduce<MachineCategoryKey[]>((accumulator, bodyPart) => {
    const categories = bodyPartToCategory[bodyPart] ?? []
    categories.forEach((category) => {
      if (!accumulator.includes(category)) {
        accumulator.push(category)
      }
    })
    return accumulator
  }, [])
}

function normalizeBodyParts(value: unknown): RoutineFocus[] {
  const allRoutineFocuses = [...BODY_PARTS, ...PERFORMANCE_TRAINING_PARTS] as const
  const legacyAliases: Record<string, RoutineFocus[]> = {
    "가슴": ["상부 가슴", "중부 가슴", "하부 가슴"],
    "등": ["광배", "상부 등", "척추기립근"],
    "어깨": ["전면 어깨", "측면 어깨", "후면 어깨"],
    "팔": ["이두", "삼두", "전완"],
    "하체": ["대퇴사두", "햄스트링", "둔근", "종아리"],
  }

  if (typeof value === "string") {
    if (value in legacyAliases) {
      return legacyAliases[value]
    }

    return allRoutineFocuses.includes(value as RoutineFocus) ? toggleBodyPartSelection([], value as RoutineFocus, allRoutineFocuses) : []
  }

  if (!Array.isArray(value)) {
    return []
  }

  const filtered = value.flatMap((item) => {
    if (typeof item !== "string") {
      return []
    }

    if (item in legacyAliases) {
      return legacyAliases[item]
    }

    return allRoutineFocuses.includes(item as RoutineFocus) ? [item as RoutineFocus] : []
  })
  if (filtered.includes(REST_DAY_BODY_PART)) {
    return [REST_DAY_BODY_PART]
  }

  return allRoutineFocuses.filter(
    (bodyPart): bodyPart is Exclude<RoutineFocus, typeof REST_DAY_BODY_PART> =>
      bodyPart !== REST_DAY_BODY_PART && filtered.includes(bodyPart),
  )
}

export function normalizeRoutineMap(value: unknown): RoutineMap {
  const initial = createEmptyRoutineMap()

  if (!value || typeof value !== "object") {
    return initial
  }

  const candidate = value as Record<string, unknown>

  DAY_META.forEach((day) => {
    const rawRoutine = candidate[day.key]
    if (!rawRoutine || typeof rawRoutine !== "object") {
      return
    }

    const parsedRoutine = rawRoutine as {
      bodyParts?: unknown
      bodyPart?: unknown
      exercises?: unknown
    }

    initial[day.key] = {
      bodyParts: normalizeBodyParts(parsedRoutine.bodyParts ?? parsedRoutine.bodyPart),
      exercises: Array.isArray(parsedRoutine.exercises)
        ? parsedRoutine.exercises.flatMap((exercise) => {
            if (!exercise || typeof exercise !== "object") {
              return []
            }

            const candidateExercise = exercise as Partial<ExerciseDraft>
            if (typeof candidateExercise.id !== "string") {
              return []
            }

            return [
              {
                id: candidateExercise.id,
                machineId: typeof candidateExercise.machineId === "string" ? candidateExercise.machineId : "",
                machineName: typeof candidateExercise.machineName === "string" ? candidateExercise.machineName : "",
                weight: typeof candidateExercise.weight === "string" ? candidateExercise.weight : "",
                reps: typeof candidateExercise.reps === "string" ? candidateExercise.reps : "",
                sets: typeof candidateExercise.sets === "string" ? candidateExercise.sets : "",
              },
            ]
          })
        : [],
    }
  })

  return initial
}

export function createInitialProteinState(): ProteinState {
  return {
    cafeteria: DEFAULT_CAFETERIA_ITEMS.map((item) => ({ ...item })),
    quickCounts: QUICK_PROTEIN_ITEMS.reduce((accumulator, item) => {
      accumulator[item.id] = 0
      return accumulator
    }, {} as Record<string, number>),
    log: [],
  }
}

export function calculateProteinTarget(weight: number, goal: GoalKey): number {
  const option = GOAL_OPTIONS.find((item) => item.key === goal)
  if (!option || !Number.isFinite(weight) || weight <= 0) {
    return 0
  }

  return Math.round(weight * option.proteinMultiplier)
}

export function getGoalOption(goal: GoalKey) {
  return GOAL_OPTIONS.find((item) => item.key === goal) ?? GOAL_OPTIONS[0]
}

export function getTodayDayKey(date = new Date()): DayKey {
  return DAY_META[date.getDay() === 0 ? 6 : date.getDay() - 1].key
}

export function getDayMeta(dayKey: DayKey) {
  return DAY_META.find((day) => day.key === dayKey) ?? DAY_META[0]
}

export function createExerciseId(dayKey: DayKey, machineId: string) {
  return `${dayKey}-${machineId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}
