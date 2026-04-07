import {
  GOAL_OPTIONS,
  MACHINES,
  calculateProteinTarget,
  createEmptyRoutineMap,
  createExerciseId,
  getExerciseMetricDefaultValues,
  isExerciseConfigured,
  type DayKey,
  type OnboardingData,
  type RoutineFocus,
  type RoutineMap,
  type UserProfile,
} from "@/lib/app-config"
import { findMachineByExerciseName, getMachineNameCandidates, normalizeExerciseName } from "@/lib/exercise-name-matcher"
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
const API_CATEGORY_BY_MACHINE_CATEGORY = {
  chest: "CHEST",
  back: "BACK",
  legs: "LEGS",
  shoulder: "SHOULDERS",
  arms: "ARMS",
  core: "ABS",
  cardio: "CARDIO",
} satisfies Record<(typeof MACHINES)[number]["category"], ApiExerciseCategory>

function isGoalKey(value: string | null | undefined): value is UserProfile["goal"] {
  return GOAL_OPTIONS.some((option) => option.key === value)
}

function toSafeNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function getMachineIdFromExercise(exercise: ApiExercise) {
  const matchedMachine = findMachineByExerciseName(exercise.name)
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

function longestCommonSubstringLength(left: string, right: string) {
  if (!left || !right) {
    return 0
  }

  let best = 0
  const table = Array.from({ length: left.length + 1 }, () => Array<number>(right.length + 1).fill(0))

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      if (left[leftIndex - 1] !== right[rightIndex - 1]) {
        continue
      }

      table[leftIndex][rightIndex] = table[leftIndex - 1][rightIndex - 1] + 1
      best = Math.max(best, table[leftIndex][rightIndex])
    }
  }

  return best
}

function scoreExerciseNameMatch(candidates: string[], normalizedCatalogName: string) {
  let bestScore = 0

  for (const candidate of candidates) {
    if (candidate === normalizedCatalogName) {
      return 1
    }

    if (candidate.includes(normalizedCatalogName) || normalizedCatalogName.includes(candidate)) {
      bestScore = Math.max(bestScore, Math.min(candidate.length, normalizedCatalogName.length) / Math.max(candidate.length, normalizedCatalogName.length))
      continue
    }

    const sharedLength = longestCommonSubstringLength(candidate, normalizedCatalogName)
    if (sharedLength > 0) {
      bestScore = Math.max(bestScore, sharedLength / Math.max(candidate.length, normalizedCatalogName.length))
    }
  }

  return bestScore
}

function findCatalogExercise(catalogIndex: ExerciseCatalogIndex, machineId: string, machineName: string) {
  const directExerciseId = getExerciseIdFromMachine(machineId)

  if (directExerciseId !== null) {
    return catalogIndex.byId.get(directExerciseId) ?? null
  }

  const normalizedCandidates = getMachineNameCandidates(machineId, machineName).map(normalizeExerciseName)

  for (const candidate of normalizedCandidates) {
    const matchedByName = catalogIndex.byNormalizedName.get(candidate)
    if (matchedByName) {
      return matchedByName
    }
  }

  const machine = MACHINES.find((item) => item.id === machineId)
  const expectedCategory = machine ? API_CATEGORY_BY_MACHINE_CATEGORY[machine.category] : null
  let bestMatch: { exercise: ApiExercise; score: number } | null = null

  for (const catalogExercise of catalogIndex.byId.values()) {
    if (expectedCategory && catalogExercise.category !== expectedCategory) {
      continue
    }

    const score = scoreExerciseNameMatch(normalizedCandidates, normalizeExerciseName(catalogExercise.name))
    if (score < 0.55) {
      continue
    }

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = {
        exercise: catalogExercise,
        score,
      }
    }
  }

  return bestMatch?.exercise ?? null
}

export function matchCatalogExercise(exercises: ApiExercise[], machineId: string, machineName: string) {
  return findCatalogExercise(createExerciseCatalogIndex(exercises), machineId, machineName)
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
        const matchedExercise = findCatalogExercise(catalogIndex, exercise.machineId, exercise.machineName)

        if (!matchedExercise) {
          unresolvedExercises.add(exercise.machineName)
          return []
        }

        const defaultValues = getExerciseMetricDefaultValues(exercise.machineId)
        const targetWeight = Number(exercise.weight || defaultValues.weight) || 0
        const targetReps = Number(exercise.reps || defaultValues.reps) || 0
        const targetSets = Number(exercise.sets || defaultValues.sets) || 0

        return [
          {
            exercise: matchedExercise.id,
            target_weight: targetWeight,
            target_reps: targetReps,
            target_sets: targetSets,
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
