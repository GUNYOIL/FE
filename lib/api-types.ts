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

export type ApiGrassEntry = {
  date: string
  is_completed: boolean
}

export type ApiProteinLogType = "quick" | "manual" | "meal" | "supplement"

export type ApiProteinLog = {
  id: number
  date: string
  amount: string
  type: ApiProteinLogType | string
  type_label?: string
  note?: string
  created_at?: string
}

export type ApiProteinOverview = {
  date: string
  target_amount: string | null
  consumed_amount: string
  remaining_amount: string | null
  progress_percent: number
  is_target_completed: boolean
  logs: ApiProteinLog[]
}

export type ApiMealLogType = "breakfast" | "lunch" | "dinner" | "snack" | string

export type ApiMealLog = {
  id: number
  date: string
  type: ApiMealLogType
  type_label?: string
  name: string
  calories?: number
  protein?: string
  carbs?: string
  fat?: string
  memo?: string
  created_at?: string
}

export type ApiMealOverview = {
  date: string
  total_calories: number
  total_protein: string
  total_carbs: string
  total_fat: string
  meals: ApiMealLog[]
}

export type ApiSchoolMealSelection = "none" | "small" | "medium" | "large"

export type ApiSchoolMealOption = Record<ApiSchoolMealSelection, string>

export type ApiSchoolMealMenu = {
  name: string
  estimated_protein_grams: string
  selection_options: ApiSchoolMealOption
  default_selection: ApiSchoolMealSelection
}

export type ApiSchoolLunchResponse = {
  date: string
  school?: Record<string, unknown>
  meal_type: "breakfast" | "lunch" | "dinner" | string
  meal_type_label?: string
  menus: ApiSchoolMealMenu[]
  estimated_total_protein: string
  school_total_protein: string | null
  calories: string | null
  nutrition_info: string | null
}

export type ApiProteinLogCreate = {
  date?: string
  amount: string
  type: ApiProteinLogType
  note?: string
}

export type ApiSchoolMealSelectionItemWrite = {
  menu_name: string
  selection: ApiSchoolMealSelection
  estimated_protein_grams: string
  final_protein_grams: string
}

export type ApiSchoolMealSelectionSave = {
  date?: string
  meal_type: "breakfast" | "lunch" | "dinner"
  items: ApiSchoolMealSelectionItemWrite[]
}
