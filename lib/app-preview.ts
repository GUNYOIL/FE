import {
  calculateProteinTarget,
  createEmptyRoutineMap,
  createInitialProteinState,
  getTodayDayKey,
  type ExerciseDraft,
  type GoalKey,
  type OnboardingData,
  type ProteinState,
  type RoutineMap,
} from "@/lib/app-config"
import type { ApiGrassEntry, ApiSchoolLunchResponse } from "@/lib/api-types"

function createExercise(
  id: string,
  machineId: string,
  machineName: string,
  weight: string,
  reps: string,
  sets: string,
  supersetGroupId: string | null = null,
): ExerciseDraft {
  return {
    id,
    machineId,
    machineName,
    weight,
    reps,
    sets,
    supersetGroupId,
  }
}

function toLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function buildPreviewRoutineMap(): RoutineMap {
  const routines = createEmptyRoutineMap()

  routines.mon = {
    bodyParts: ["중부 가슴", "전면 어깨", "삼두"],
    exercises: [
      createExercise("preview-mon-1", "chest-press", "체스트 프레스 머신", "35", "10", "4"),
      createExercise("preview-mon-2", "incline-press", "인클라인 프레스 머신", "25", "12", "3"),
      createExercise("preview-mon-3", "dip-machine", "어시스트 딥스", "15", "10", "3"),
    ],
  }
  routines.tue = {
    bodyParts: ["광배", "상부 등", "이두"],
    exercises: [
      createExercise("preview-tue-1", "lat-pulldown", "랫풀다운", "45", "12", "4"),
      createExercise("preview-tue-2", "seated-row", "시티드 로우", "35", "12", "3"),
      createExercise("preview-tue-3", "hammer-curl", "해머 컬", "10", "12", "3"),
    ],
  }
  routines.wed = {
    bodyParts: ["휴식"],
    exercises: [],
  }
  routines.thu = {
    bodyParts: ["대퇴사두", "햄스트링", "둔근"],
    exercises: [
      createExercise("preview-thu-1", "leg-press", "레그 프레스", "110", "12", "4"),
      createExercise("preview-thu-2", "leg-extension", "레그 익스텐션", "35", "15", "3"),
      createExercise("preview-thu-3", "leg-curl", "레그 컬", "30", "15", "3"),
    ],
  }
  routines.fri = {
    bodyParts: ["전면 어깨", "측면 어깨", "복근"],
    exercises: [
      createExercise("preview-fri-1", "shoulder-press", "숄더 프레스 머신", "25", "10", "4"),
      createExercise("preview-fri-2", "side-lateral-raise", "사이드 레터럴 레이즈", "6", "15", "3"),
      createExercise("preview-fri-3", "ab-crunch", "앱 크런치 머신", "30", "20", "3"),
    ],
  }
  routines.sat = {
    bodyParts: ["유산소", "협응력 트레이닝"],
    exercises: [
      createExercise("preview-sat-1", "rowing", "로잉 머신", "", "", "1"),
      createExercise("preview-sat-2", "coordination-training", "협응력 트레이닝", "", "", "1"),
    ],
  }
  routines.sun = {
    bodyParts: ["휴식"],
    exercises: [],
  }

  const todayKey = getTodayDayKey()

  if (routines[todayKey].bodyParts.length === 0 || routines[todayKey].bodyParts[0] === "휴식") {
    routines[todayKey] = {
      bodyParts: ["중부 가슴", "전면 어깨", "삼두"],
      exercises: [
        createExercise(`preview-${todayKey}-1`, "chest-press", "체스트 프레스 머신", "35", "10", "4"),
        createExercise(`preview-${todayKey}-2`, "incline-press", "인클라인 프레스 머신", "25", "12", "3"),
        createExercise(`preview-${todayKey}-3`, "dip-machine", "어시스트 딥스", "15", "10", "3"),
      ],
    }
  }

  return routines
}

export function createPreviewOnboardingData(): OnboardingData {
  const weight = 68
  const goal: GoalKey = "lean_mass"

  return {
    profile: {
      gender: "male",
      height: 175,
      weight,
      goal,
      proteinTarget: calculateProteinTarget(weight, goal),
    },
    routines: buildPreviewRoutineMap(),
  }
}

export function createPreviewProteinState(): ProteinState {
  const initial = createInitialProteinState()

  return {
    ...initial,
    log: [
      { id: "preview-log-1", label: "그릭요거트", protein: 11, time: "08:10" },
      { id: "preview-log-2", label: "프로틴 쉐이크", protein: 24, time: "13:20" },
      { id: "preview-log-3", label: "삶은 계란 2개", protein: 12, time: "18:40" },
    ],
  }
}

export function createPreviewGrassEntries(): ApiGrassEntry[] {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const dayCount = new Date(year, month + 1, 0).getDate()
  const intensityPattern = [25, 50, 75, 100, 0, 100, 40, 80]
  const entries: ApiGrassEntry[] = []

  for (let day = 1; day <= dayCount; day += 1) {
    const date = new Date(year, month, day)

    if (date > today) {
      break
    }

    const patternValue = intensityPattern[(day - 1) % intensityPattern.length]

    if (patternValue === 0) {
      continue
    }

    entries.push({
      date: toLocalDateKey(date),
      is_completed: patternValue >= 100,
      completion_percent: patternValue,
    })
  }

  return entries
}

export function createPreviewSchoolLunch(): ApiSchoolLunchResponse {
  return {
    date: toLocalDateKey(new Date()),
    meal_type: "lunch",
    meal_type_label: "점심",
    estimated_total_protein: "30",
    school_total_protein: "36",
    calories: "810.6 Kcal",
    nutrition_info: "탄수화물(g) : 112.1 / 단백질(g) : 22.7 / 지방(g) : 31.3",
    menus: [
      {
        name: "닭갈비 볶음",
        estimated_protein_grams: "16",
        selection_options: {
          none: "0",
          small: "8",
          medium: "16",
          large: "22",
        },
        default_selection: "medium",
      },
      {
        name: "계란국",
        estimated_protein_grams: "5",
        selection_options: {
          none: "0",
          small: "2",
          medium: "5",
          large: "7",
        },
        default_selection: "small",
      },
      {
        name: "두부조림",
        estimated_protein_grams: "9",
        selection_options: {
          none: "0",
          small: "4",
          medium: "9",
          large: "13",
        },
        default_selection: "medium",
      },
    ],
  }
}
