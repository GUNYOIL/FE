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
  { id: "box-squat", name: "박스 스쿼트", category: "legs", muscle: "대퇴사두/둔근" },
  { id: "romanian-deadlift", name: "루마니안 데드리프트", category: "legs", muscle: "햄스트링/둔근" },
  { id: "conventional-deadlift", name: "컨벤셔널 데드리프트", category: "legs", muscle: "후면사슬/척추기립근" },
  { id: "clean-deadlift", name: "클린 데드리프트", category: "legs", muscle: "하체/후면사슬" },
  { id: "dumbbell-lunge", name: "덤벨 런지", category: "legs", muscle: "대퇴사두/둔근" },
  { id: "bulgarian-split-squat", name: "불가리안 스플릿 스쿼트", category: "legs", muscle: "대퇴사두/둔근" },
  { id: "barbell-hip-thrust", name: "바벨 힙 쓰러스트", category: "legs", muscle: "둔근" },
  { id: "shoulder-press", name: "숄더 프레스 머신", category: "shoulder", muscle: "전면 삼각근" },
  { id: "lateral-raise", name: "레터럴 레이즈 머신", category: "shoulder", muscle: "측면 삼각근" },
  { id: "dumbbell-press", name: "덤벨 숄더 프레스", category: "shoulder", muscle: "삼각근" },
  { id: "rear-delt", name: "리어 델트 머신", category: "shoulder", muscle: "후면 삼각근" },
  { id: "barbell-overhead-press", name: "바벨 오버헤드 프레스", category: "shoulder", muscle: "전면 어깨" },
  { id: "arnold-press", name: "아놀드 프레스", category: "shoulder", muscle: "전면/측면 어깨" },
  { id: "side-lateral-raise", name: "사이드 레터럴 레이즈", category: "shoulder", muscle: "측면 어깨" },
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
  { id: "ab-wheel", name: "ab 롤 아웃", category: "core", muscle: "복근/코어" },
  { id: "stabilization-training", name: "안정화 트레이닝", category: "core", muscle: "안정화/코어" },
  { id: "coordination-training", name: "협응력 트레이닝", category: "cardio", muscle: "협응력/전신" },
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

export type ExerciseField = "weight" | "reps" | "sets"

export type ExerciseMetricFieldDefinition = {
  field: ExerciseField
  label: string
  unit: string
  placeholder: string
}

export type ExerciseMetricProfile = {
  trackingMode: "setBased" | "singleSession" | "completionOnly"
  fields: readonly ExerciseMetricFieldDefinition[]
  defaultValues?: Partial<Record<ExerciseField, string>>
  presetValues?: readonly { label: string; values: Partial<Record<ExerciseField, string>> }[]
}

export type DayKey = (typeof DAY_META)[number]["key"]
export type BodyPart = (typeof BODY_PARTS)[number]
export type PerformanceTrainingPart = (typeof PERFORMANCE_TRAINING_PARTS)[number]
export type RoutineFocus = BodyPart | PerformanceTrainingPart
export type GoalKey = (typeof GOAL_OPTIONS)[number]["key"]
export type MachineCategoryKey = (typeof MACHINE_CATEGORIES)[number]["key"]
export type MachineId = (typeof MACHINES)[number]["id"]
export type MachineVisualKey =
  | "machine"
  | "chest"
  | "back"
  | "legs"
  | "shoulder"
  | "arms"
  | "core"
  | "cardio"
  | "bench"
  | "pressMachine"
  | "fly"
  | "latPulldown"
  | "row"
  | "pullUp"
  | "legPress"
  | "legExtension"
  | "legCurl"
  | "squat"
  | "hinge"
  | "lunge"
  | "hipThrust"
  | "calfRaise"
  | "shoulderPress"
  | "raise"
  | "curl"
  | "triceps"
  | "backExtension"
  | "treadmill"
  | "cycle"
  | "elliptical"
  | "rowErg"
export type Gender = "male" | "female"

export type ExerciseDraft = {
  id: string
  machineId: string
  machineName: string
  weight: string
  reps: string
  sets: string
  supersetGroupId: string | null
}

export type DayRoutineDraft = {
  bodyParts: RoutineFocus[]
  exercises: ExerciseDraft[]
}

export type RoutineMap = Record<DayKey, DayRoutineDraft>

export type RoutineExerciseGroup = {
  id: string
  isSuperset: boolean
  supersetGroupId: string | null
  exercises: ExerciseDraft[]
}

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
  quickProteinValues?: Record<string, string>
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
] as const

export function createInitialQuickProteinValues() {
  return QUICK_PROTEIN_ITEMS.reduce((accumulator, item) => {
    accumulator[item.id] = String(item.protein)
    return accumulator
  }, {} as Record<string, string>)
}

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

const STRENGTH_PROFILE: ExerciseMetricProfile = {
  trackingMode: "setBased",
  fields: [
    { field: "weight", label: "무게", unit: "kg", placeholder: "0" },
    { field: "reps", label: "횟수", unit: "회", placeholder: "0" },
    { field: "sets", label: "세트", unit: "세트", placeholder: "0" },
  ],
  presetValues: SET_PRESETS.map((preset) => ({
    label: preset.label,
    values: {
      reps: preset.reps,
      sets: preset.sets,
    },
  })),
}

const BODYWEIGHT_PROFILE: ExerciseMetricProfile = {
  trackingMode: "setBased",
  fields: [
    { field: "reps", label: "횟수", unit: "회", placeholder: "0" },
    { field: "sets", label: "세트", unit: "세트", placeholder: "0" },
  ],
  presetValues: SET_PRESETS.map((preset) => ({
    label: preset.label,
    values: {
      reps: preset.reps,
      sets: preset.sets,
    },
  })),
}

const ASSISTANCE_PROFILE: ExerciseMetricProfile = {
  trackingMode: "setBased",
  fields: [
    { field: "weight", label: "보조무게", unit: "kg", placeholder: "0" },
    { field: "reps", label: "횟수", unit: "회", placeholder: "0" },
    { field: "sets", label: "세트", unit: "세트", placeholder: "0" },
  ],
  presetValues: SET_PRESETS.map((preset) => ({
    label: preset.label,
    values: {
      reps: preset.reps,
      sets: preset.sets,
    },
  })),
}

const TREADMILL_PROFILE: ExerciseMetricProfile = {
  trackingMode: "singleSession",
  fields: [
    { field: "weight", label: "인클라인", unit: "%", placeholder: "0" },
    { field: "reps", label: "속도", unit: "km/h", placeholder: "0" },
    { field: "sets", label: "시간", unit: "분", placeholder: "0" },
  ],
}

const CYCLE_PROFILE: ExerciseMetricProfile = {
  trackingMode: "singleSession",
  fields: [
    { field: "weight", label: "강도", unit: "레벨", placeholder: "0" },
    { field: "reps", label: "시간", unit: "분", placeholder: "0" },
    { field: "sets", label: "거리", unit: "km", placeholder: "0" },
  ],
}

const ELLIPTICAL_PROFILE: ExerciseMetricProfile = {
  trackingMode: "singleSession",
  fields: [
    { field: "weight", label: "강도", unit: "레벨", placeholder: "0" },
    { field: "reps", label: "시간", unit: "분", placeholder: "0" },
    { field: "sets", label: "거리", unit: "km", placeholder: "0" },
  ],
}

const ROWING_PROFILE: ExerciseMetricProfile = {
  trackingMode: "singleSession",
  fields: [
    { field: "weight", label: "강도", unit: "레벨", placeholder: "0" },
    { field: "reps", label: "시간", unit: "분", placeholder: "0" },
    { field: "sets", label: "거리", unit: "m", placeholder: "0" },
  ],
}

const COMPLETION_ONLY_PROFILE: ExerciseMetricProfile = {
  trackingMode: "completionOnly",
  fields: [],
  defaultValues: {
    weight: "0",
    reps: "1",
    sets: "1",
  },
}

const EXERCISE_METRIC_PROFILE_MAP: Partial<Record<MachineId, ExerciseMetricProfile>> = {
  "assisted-pullup": ASSISTANCE_PROFILE,
  "dip-machine": ASSISTANCE_PROFILE,
  "pull-up": BODYWEIGHT_PROFILE,
  "chin-up": BODYWEIGHT_PROFILE,
  "back-extension": BODYWEIGHT_PROFILE,
  "hanging-leg-raise": BODYWEIGHT_PROFILE,
  "ab-wheel": BODYWEIGHT_PROFILE,
  treadmill: TREADMILL_PROFILE,
  cycle: CYCLE_PROFILE,
  elliptical: ELLIPTICAL_PROFILE,
  rowing: ROWING_PROFILE,
  "stabilization-training": COMPLETION_ONLY_PROFILE,
  "coordination-training": COMPLETION_ONLY_PROFILE,
}

const MACHINE_VISUAL_MAP: Record<MachineId, MachineVisualKey> = {
  fly: "fly",
  "chest-press": "pressMachine",
  "incline-press": "pressMachine",
  "barbell-bench": "bench",
  "dumbbell-bench": "bench",
  "incline-dumbbell-press": "bench",
  "decline-dumbbell-press": "bench",
  "dumbbell-fly": "fly",
  "weighted-dips": "bench",
  "lat-pulldown": "latPulldown",
  "seated-row": "row",
  "assisted-pullup": "pullUp",
  "dumbbell-row": "row",
  "barbell-row": "row",
  "pendlay-row": "row",
  "pull-up": "pullUp",
  "chin-up": "pullUp",
  "barbell-shrug": "row",
  "leg-press": "legPress",
  "leg-extension": "legExtension",
  "leg-curl": "legCurl",
  "smith-squat": "squat",
  "barbell-back-squat": "squat",
  "front-squat": "squat",
  "goblet-squat": "squat",
  "box-squat": "squat",
  "romanian-deadlift": "hinge",
  "conventional-deadlift": "hinge",
  "clean-deadlift": "hinge",
  "dumbbell-lunge": "lunge",
  "bulgarian-split-squat": "lunge",
  "barbell-hip-thrust": "hipThrust",
  "shoulder-press": "shoulderPress",
  "lateral-raise": "raise",
  "dumbbell-press": "shoulderPress",
  "rear-delt": "raise",
  "barbell-overhead-press": "shoulderPress",
  "arnold-press": "shoulderPress",
  "side-lateral-raise": "raise",
  "dumbbell-lateral-raise": "raise",
  "rear-delt-fly": "raise",
  "upright-row": "raise",
  "cable-pushdown": "triceps",
  "dumbbell-curl": "curl",
  "hammer-curl": "curl",
  "preacher-curl": "curl",
  "overhead-triceps": "triceps",
  "dip-machine": "triceps",
  "ez-bar-curl": "curl",
  "incline-dumbbell-curl": "curl",
  "concentration-curl": "curl",
  "skull-crusher": "triceps",
  "dumbbell-kickback": "triceps",
  "reverse-curl": "curl",
  "close-grip-bench": "bench",
  "back-extension": "backExtension",
  "glute-drive": "hipThrust",
  "calf-raise": "calfRaise",
  "ab-crunch": "core",
  "cable-crunch": "core",
  "hanging-leg-raise": "core",
  "weighted-sit-up": "core",
  "ab-wheel": "core",
  "stabilization-training": "core",
  "coordination-training": "cardio",
  treadmill: "treadmill",
  cycle: "cycle",
  elliptical: "elliptical",
  rowing: "rowErg",
}

const CATEGORY_VISUAL_MAP: Record<MachineCategoryKey, MachineVisualKey> = {
  all: "machine",
  chest: "chest",
  back: "back",
  legs: "legs",
  shoulder: "shoulder",
  arms: "arms",
  core: "core",
  cardio: "cardio",
}

const MACHINE_VISUAL_LABEL_MAP: Record<MachineVisualKey, string> = {
  machine: "기구",
  chest: "가슴",
  back: "등",
  legs: "하체",
  shoulder: "어깨",
  arms: "팔",
  core: "코어",
  cardio: "유산소",
  bench: "벤치",
  pressMachine: "프레스",
  fly: "플라이",
  latPulldown: "랫풀",
  row: "로우",
  pullUp: "풀업",
  legPress: "레그프레스",
  legExtension: "익스텐션",
  legCurl: "레그컬",
  squat: "스쿼트",
  hinge: "데드",
  lunge: "런지",
  hipThrust: "힙쓰러스트",
  calfRaise: "카프",
  shoulderPress: "숄더프레스",
  raise: "레이즈",
  curl: "컬",
  triceps: "삼두",
  backExtension: "백익스",
  treadmill: "런닝",
  cycle: "사이클",
  elliptical: "일립티컬",
  rowErg: "로잉",
}

const MACHINE_CATEGORY_ALIASES: Partial<Record<MachineId, MachineCategoryKey[]>> = {
  "dip-machine": ["arms", "chest", "shoulder"],
  "stabilization-training": ["shoulder", "arms", "core", "cardio"],
  "coordination-training": ["cardio", "legs", "shoulder", "core"],
}

export function getMachineById(machineId: string) {
  return MACHINES.find((machine) => machine.id === machineId)
}

export function getMachineCategories(machineId: string, fallbackCategory?: MachineCategoryKey) {
  const machine = getMachineById(machineId)
  const aliasedCategories = MACHINE_CATEGORY_ALIASES[machineId as MachineId]

  if (aliasedCategories && aliasedCategories.length > 0) {
    return aliasedCategories
  }

  if (machine?.category) {
    return [machine.category]
  }

  return fallbackCategory ? [fallbackCategory] : []
}

export function doesMachineMatchCategory(machineId: string, category: MachineCategoryKey, fallbackCategory?: MachineCategoryKey) {
  if (category === "all") {
    return true
  }

  return getMachineCategories(machineId, fallbackCategory).includes(category)
}

export function getMachineVisualKey(machineId: string, fallbackCategory?: MachineCategoryKey): MachineVisualKey {
  const machine = getMachineById(machineId)
  return MACHINE_VISUAL_MAP[machineId as MachineId] ?? CATEGORY_VISUAL_MAP[machine?.category ?? fallbackCategory ?? "all"]
}

export function getMachineVisualLabel(machineId: string, fallbackCategory?: MachineCategoryKey) {
  return MACHINE_VISUAL_LABEL_MAP[getMachineVisualKey(machineId, fallbackCategory)]
}

export function getExerciseMetricProfile(machineId: string): ExerciseMetricProfile {
  return EXERCISE_METRIC_PROFILE_MAP[machineId as MachineId] ?? STRENGTH_PROFILE
}

export function getExerciseMetricDefaultValues(machineId: string) {
  return getExerciseMetricProfile(machineId).defaultValues ?? {}
}

export function isSetBasedExercise(machineId: string) {
  return getExerciseMetricProfile(machineId).trackingMode === "setBased"
}

export function canExerciseUseSuperset(machineId: string) {
  return isSetBasedExercise(machineId)
}

export function isSupersetPair(
  previousExercise?: Pick<ExerciseDraft, "supersetGroupId"> | null,
  currentExercise?: Pick<ExerciseDraft, "supersetGroupId"> | null,
) {
  return Boolean(
    previousExercise &&
      currentExercise &&
      previousExercise.supersetGroupId &&
      previousExercise.supersetGroupId === currentExercise.supersetGroupId,
  )
}

export function canToggleSupersetPair(exercises: ExerciseDraft[], index: number) {
  if (index <= 0) {
    return false
  }

  const previousExercise = exercises[index - 1]
  const currentExercise = exercises[index]

  if (!previousExercise || !currentExercise) {
    return false
  }

  if (!canExerciseUseSuperset(previousExercise.machineId) || !canExerciseUseSuperset(currentExercise.machineId)) {
    return false
  }

  return isSupersetPair(previousExercise, currentExercise) || (!previousExercise.supersetGroupId && !currentExercise.supersetGroupId)
}

function normalizeExerciseSupersetsInternal(exercises: ExerciseDraft[]) {
  const groupEntries = new Map<string, number[]>()

  exercises.forEach((exercise, index) => {
    if (!exercise.supersetGroupId) {
      return
    }

    const nextIndices = groupEntries.get(exercise.supersetGroupId) ?? []
    nextIndices.push(index)
    groupEntries.set(exercise.supersetGroupId, nextIndices)
  })

  return exercises.map((exercise) => {
    if (!exercise.supersetGroupId) {
      return { ...exercise, supersetGroupId: null }
    }

    const indices = groupEntries.get(exercise.supersetGroupId) ?? []
    const isValidPair =
      indices.length === 2 &&
      indices[1] === indices[0] + 1 &&
      indices.every((index) => canExerciseUseSuperset(exercises[index]?.machineId ?? ""))

    return {
      ...exercise,
      supersetGroupId: isValidPair ? exercise.supersetGroupId : null,
    }
  })
}

export function normalizeExerciseSupersets(exercises: ExerciseDraft[]) {
  return normalizeExerciseSupersetsInternal(exercises)
}

export function reorderExerciseDrafts(exercises: ExerciseDraft[], fromIndex: number, toIndex: number) {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= exercises.length ||
    toIndex >= exercises.length ||
    fromIndex === toIndex
  ) {
    return exercises
  }

  const nextExercises = [...exercises]
  const [movedExercise] = nextExercises.splice(fromIndex, 1)

  if (!movedExercise) {
    return exercises
  }

  nextExercises.splice(toIndex, 0, movedExercise)

  return normalizeExerciseSupersets(nextExercises)
}

export function createSupersetGroupId(dayKey: DayKey) {
  return `${dayKey}-superset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function toggleSupersetPair(exercises: ExerciseDraft[], index: number, dayKey: DayKey) {
  if (!canToggleSupersetPair(exercises, index)) {
    return exercises
  }

  const previousExercise = exercises[index - 1]
  const currentExercise = exercises[index]

  if (isSupersetPair(previousExercise, currentExercise)) {
    return normalizeExerciseSupersets(
      exercises.map((exercise, exerciseIndex) =>
        exerciseIndex === index - 1 || exerciseIndex === index ? { ...exercise, supersetGroupId: null } : exercise,
      ),
    )
  }

  const supersetGroupId = createSupersetGroupId(dayKey)
  const sharedSets = previousExercise.sets || currentExercise.sets

  return normalizeExerciseSupersets(
    exercises.map((exercise, exerciseIndex) =>
      exerciseIndex === index - 1 || exerciseIndex === index
        ? {
            ...exercise,
            supersetGroupId,
            sets: sharedSets || exercise.sets,
          }
        : exercise,
    ),
  )
}

export function groupRoutineExercises(exercises: ExerciseDraft[]): RoutineExerciseGroup[] {
  const normalizedExercises = normalizeExerciseSupersets(exercises)
  const groups: RoutineExerciseGroup[] = []

  for (let index = 0; index < normalizedExercises.length; index += 1) {
    const exercise = normalizedExercises[index]
    const nextExercise = normalizedExercises[index + 1]

    if (isSupersetPair(exercise, nextExercise)) {
      groups.push({
        id: exercise.supersetGroupId ?? exercise.id,
        isSuperset: true,
        supersetGroupId: exercise.supersetGroupId,
        exercises: [exercise, nextExercise],
      })
      index += 1
      continue
    }

    groups.push({
      id: exercise.id,
      isSuperset: false,
      supersetGroupId: null,
      exercises: [exercise],
    })
  }

  return groups
}

export function formatSupersetExerciseNames(exercises: Pick<ExerciseDraft, "machineName">[]) {
  if (exercises.length === 0) {
    return ""
  }

  if (exercises.length === 1) {
    return exercises[0].machineName
  }

  return `${exercises[0].machineName} + ${exercises[1].machineName}`
}

export function isExerciseConfigured(exercise: Pick<ExerciseDraft, "machineId" | "weight" | "reps" | "sets">) {
  const profile = getExerciseMetricProfile(exercise.machineId)
  if (profile.trackingMode === "completionOnly") {
    return true
  }
  return profile.fields.every((field) => Number(exercise[field.field]) > 0)
}

export function formatExerciseMetricSummary(
  exercise: Pick<ExerciseDraft, "machineId" | "weight" | "reps" | "sets">,
  emptyLabel = "미입력",
) {
  const profile = getExerciseMetricProfile(exercise.machineId)
  if (profile.trackingMode === "completionOnly") {
    return "오늘 페이지에서 완료만 체크"
  }
  const values = profile.fields
    .map((field) => {
      const raw = exercise[field.field]
      return raw ? `${raw}${field.unit}` : ""
    })
    .filter(Boolean)

  return values.length > 0 ? values.join(" · ") : emptyLabel
}

export function getExerciseMetricHint(machineId: string) {
  const profile = getExerciseMetricProfile(machineId)
  if (profile.trackingMode === "completionOnly") {
    return "세트 입력 없이 오늘 페이지에서 완료 여부만 기록합니다"
  }
  return `${profile.fields.map((field) => field.label).join(", ")} 항목을 입력해 주세요`
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

export function getPrimaryMachineCategory(bodyParts: RoutineFocus[]): MachineCategoryKey {
  return getPreferredMachineCategories(bodyParts)[0] ?? "all"
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
        ? normalizeExerciseSupersetsInternal(
            parsedRoutine.exercises.flatMap((exercise) => {
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
                supersetGroupId:
                  typeof candidateExercise.supersetGroupId === "string" && candidateExercise.supersetGroupId.length > 0
                    ? candidateExercise.supersetGroupId
                    : null,
              },
            ]
          }),
          )
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
    quickProteinValues: createInitialQuickProteinValues(),
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
