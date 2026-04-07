export type ApiGender = "M" | "F" | "O" | "" | null

export type ApiUser = {
  id: number
  email: string
  gender: ApiGender
  height: number | null
  weight: number | null
  goal: string | null
  onboarding_completed: boolean
}

export type ApiAuthTokens = {
  accessToken: string
  refreshToken: string | null
}

export type ApiExerciseCategory = "CHEST" | "BACK" | "LEGS" | "SHOULDERS" | "ARMS" | "ABS" | "CARDIO"

export type ApiExercise = {
  id: number
  name: string
  category: ApiExerciseCategory
  category_display?: string
  target_muscle?: string
}

export type ApiRoutineDetail = {
  id?: number
  exercise: number
  exercise_name?: string
  target_weight: number
  target_reps: number
  target_sets: number
  order?: number
}

export type ApiRoutine = {
  id?: number
  day_of_week: number
  day_name?: string
  details?: ApiRoutineDetail[]
}

export type ApiRoutineWrite = {
  day_of_week: number
  details: Array<{
    exercise: number
    target_weight: number
    target_reps: number
    target_sets: number
    order: number
  }>
}
