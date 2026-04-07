import {
  GOAL_OPTIONS,
  MACHINES,
  calculateProteinTarget,
  createEmptyRoutineMap,
  createExerciseId,
  isExerciseConfigured,
  type DayKey,
  type OnboardingData,
  type RoutineFocus,
  type RoutineMap,
  type UserProfile,
} from "@/lib/app-config"
import type { OnboardingProfileDraft } from "@/lib/session"
import type { ApiExercise, ApiExerciseCategory, ApiGender, ApiRoutine, ApiRoutineWrite, ApiUser } from "@/lib/api-types"

type ExerciseCatalogIndex = {
  byId: Map<number, ApiExercise>
  byNormalizedName: Map<string, ApiExercise>
}

const DAY_INDEX_BY_KEY: Record<DayKey, number> = {
  mon: 0,
  tue: 1,
  wed: 2,
  thu: 3,
  fri: 4,
  sat: 5,
  sun: 6,
}

const DAY_KEY_BY_INDEX: Record<number, DayKey> = {
  0: "mon",
  1: "tue",
  2: "wed",
  3: "thu",
  4: "fri",
  5: "sat",
  6: "sun",
}

const PRIMARY_FOCUS_BY_CATEGORY: Record<ApiExerciseCategory, RoutineFocus> = {
  CHEST: "중부 가슴",
  BACK: "광배",
  LEGS: "대퇴사두",
  SHOULDERS: "전면 어깨",
  ARMS: "이두",
  ABS: "복근",
  CARDIO: "유산소",
}

function normalizeExerciseName(value: string) {
  return value.replace(/[^0-9A-Za-z가-힣]/g, "").toLowerCase()
}

function isGoalKey(value: string | null | undefined): value is UserProfile["goal"] {
  return GOAL_OPTIONS.some((option) => option.key === value)
}

function toSafeNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function getMachineIdFromExercise(exercise: ApiExercise) {
  const matchedMachine = MACHINES.find((machine) => normalizeExerciseName(machine.name) === normalizeExerciseName(exercise.name))
  return matchedMachine?.id ?? `exercise-${exercise.id}`
}

function getExerciseIdFromMachine(machineId: string) {
  const matched = machineId.match(/^exercise-(\d+)$/)
  return matched ? Number(matched[1]) : null
}

export function createExerciseCatalogIndex(exercises: ApiExercise[]): ExerciseCatalogIndex {
  return exercises.reduce<ExerciseCatalogIndex>(
    (accumulator, exercise) => {
      accumulator.byId.set(exercise.id, exercise)
      accumulator.byNormalizedName.set(normalizeExerciseName(exercise.name), exercise)
      return accumulator
    },
    {
      byId: new Map<number, ApiExercise>(),
      byNormalizedName: new Map<string, ApiExercise>(),
    },
  )
}

export function mapDraftGenderToApi(gender: OnboardingProfileDraft["gender"]): ApiGender {
  if (gender === "male") {
    return "M"
  }

  if (gender === "female") {
    return "F"
  }

  return null
}

export function mapApiGenderToDraft(gender: ApiGender): OnboardingProfileDraft["gender"] {
  if (gender === "M") {
    return "male"
  }

  if (gender === "F") {
    return "female"
  }

  return ""
}

export function isApiProfileComplete(user: ApiUser) {
  return mapApiGenderToDraft(user.gender) !== "" && toSafeNumber(user.height) > 0 && toSafeNumber(user.weight) > 0 && isGoalKey(user.goal)
}

export function apiUserToOnboardingProfileDraft(user: ApiUser): OnboardingProfileDraft {
  return {
    gender: mapApiGenderToDraft(user.gender),
    height: toSafeNumber(user.height) > 0 ? String(user.height) : "",
    weight: toSafeNumber(user.weight) > 0 ? String(user.weight) : "",
    goal: isGoalKey(user.goal) ? user.goal : "muscle_gain",
  }
}

export function apiUserToUserProfile(user: ApiUser): UserProfile | null {
  if (!isApiProfileComplete(user)) {
    return null
  }

  const gender = mapApiGenderToDraft(user.gender)
  if (gender !== "male" && gender !== "female") {
    return null
  }

  const goal = isGoalKey(user.goal) ? user.goal : "muscle_gain"
  const weight = Number(user.weight)

  return {
    gender,
    height: Number(user.height),
    weight,
    goal,
    proteinTarget: calculateProteinTarget(weight, goal),
  }
}

export function buildUserUpdatePayload(email: string, profile: OnboardingProfileDraft | UserProfile, onboardingCompleted: boolean) {
  const height = typeof profile.height === "number" ? profile.height : Number(profile.height)
  const weight = typeof profile.weight === "number" ? profile.weight : Number(profile.weight)

  return {
    email,
    gender: mapDraftGenderToApi(profile.gender),
    height: height > 0 ? height : null,
    weight: weight > 0 ? weight : null,
    goal: profile.goal,
    onboarding_completed: onboardingCompleted,
  }
}

export function apiRoutinesToRoutineMap(apiRoutines: ApiRoutine[], catalog: ApiExercise[], fallback?: RoutineMap) {
  if (apiRoutines.length === 0 && fallback) {
    return structuredClone(fallback)
  }

  const catalogIndex = createExerciseCatalogIndex(catalog)
  const nextRoutines = fallback ? structuredClone(fallback) : createEmptyRoutineMap()

  for (const key of Object.keys(nextRoutines) as DayKey[]) {
    nextRoutines[key] = {
      bodyParts: [],
      exercises: [],
    }
  }

  for (const routine of apiRoutines) {
    const dayKey = DAY_KEY_BY_INDEX[routine.day_of_week]
    if (!dayKey) {
      continue
    }

    const details = [...(routine.details ?? [])].sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
    const bodyParts = Array.from(
      new Set(
        details
          .map((detail) => catalogIndex.byId.get(detail.exercise)?.category)
          .filter((category): category is ApiExerciseCategory => Boolean(category))
          .map((category) => PRIMARY_FOCUS_BY_CATEGORY[category]),
      ),
    )

    nextRoutines[dayKey] = {
      bodyParts,
      exercises: details.map((detail, index) => {
        const exercise = catalogIndex.byId.get(detail.exercise)
        const machineId = exercise ? getMachineIdFromExercise(exercise) : `exercise-${detail.exercise}`
        return {
          id: createExerciseId(dayKey, `${machineId}-${index}`),
          machineId,
          machineName: detail.exercise_name ?? exercise?.name ?? `운동 ${detail.exercise}`,
          weight: detail.target_weight > 0 ? String(detail.target_weight) : "",
          reps: detail.target_reps > 0 ? String(detail.target_reps) : "",
          sets: detail.target_sets > 0 ? String(detail.target_sets) : "",
          supersetGroupId: null,
        }
      }),
    }
  }

  return nextRoutines
}

export function routineMapToApiPayload(routines: RoutineMap, catalog: ApiExercise[]) {
  const catalogIndex = createExerciseCatalogIndex(catalog)
  const unresolvedExercises = new Set<string>()
  const payload = (Object.entries(routines) as Array<[DayKey, RoutineMap[DayKey]]>).map(([dayKey, routine]) => ({
    day_of_week: DAY_INDEX_BY_KEY[dayKey],
    details: routine.exercises
      .filter(isExerciseConfigured)
      .flatMap((exercise, index) => {
        const directExerciseId = getExerciseIdFromMachine(exercise.machineId)
        const matchedExercise =
          directExerciseId !== null
            ? catalogIndex.byId.get(directExerciseId)
            : catalogIndex.byNormalizedName.get(normalizeExerciseName(exercise.machineName))

        if (!matchedExercise) {
          unresolvedExercises.add(exercise.machineName)
          return []
        }

        return [
          {
            exercise: matchedExercise.id,
            target_weight: Number(exercise.weight) || 0,
            target_reps: Number(exercise.reps) || 0,
            target_sets: Number(exercise.sets) || 0,
            order: index + 1,
          },
        ]
      }),
  })) satisfies ApiRoutineWrite[]

  return {
    payload,
    unresolvedExercises: Array.from(unresolvedExercises),
  }
}

export function mergeRemoteOnboardingData(user: ApiUser, routines: RoutineMap, fallback?: OnboardingData | null): OnboardingData | null {
  const profile = apiUserToUserProfile(user)

  if (!profile) {
    return fallback ?? null
  }

  return {
    profile,
    routines,
  }
}
