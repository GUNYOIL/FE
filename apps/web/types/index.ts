export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type DashboardTab =
  | "home"
  | "routine"
  | "today"
  | "grass"
  | "protein"
  | "profile";

export type Gender = "male" | "female";
export type UserGoal = "bulk" | "maintenance" | "cut";

export interface UserProfile {
  name: string;
  email: string;
  gender: Gender;
  height: number;
  weight: number;
  goal: UserGoal;
}

export interface ExercisePlan {
  id: string;
  machine: string;
  focus: string;
  weight: number;
  reps: number;
  sets: number;
}

export interface DayRoutine {
  day: Weekday;
  label: string;
  shortLabel: string;
  theme: string;
  focus: string;
  exercises: ExercisePlan[];
}

export interface ExerciseRecord {
  completedSets: number;
  completedReps: number;
  completedWeight: number;
}

export type DayRecord = Record<string, ExerciseRecord>;
export type WorkoutRecords = Record<Weekday, DayRecord>;

export interface ProteinItem {
  id: string;
  name: string;
  grams: number;
}

export interface MealInfo {
  title: string;
  items: string[];
  estimatedProtein: number;
  note: string;
}

export interface HistoryEntry {
  date: string;
  completion: number;
}

export interface TabItem {
  id: DashboardTab;
  label: string;
  description: string;
}
