import type {
  DayRoutine,
  ExercisePlan,
  ExerciseRecord,
  HistoryEntry,
  UserGoal,
} from "@/types";

export function clampPercentage(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateExerciseCompletion(
  exercise: ExercisePlan,
  record?: ExerciseRecord,
): number {
  if (!record) {
    return 0;
  }

  const setRatio = exercise.sets > 0 ? record.completedSets / exercise.sets : 1;
  const repRatio = exercise.reps > 0 ? record.completedReps / exercise.reps : 1;
  const weightRatio = exercise.weight > 0 ? record.completedWeight / exercise.weight : 1;

  return clampPercentage((setRatio * 0.45 + repRatio * 0.35 + weightRatio * 0.2) * 100);
}

export function calculateDayCompletion(
  routine?: DayRoutine,
  dayRecord: Record<string, ExerciseRecord> = {},
): number {
  if (!routine || routine.exercises.length === 0) {
    return 0;
  }

  const total = routine.exercises.reduce((sum, exercise) => {
    return sum + calculateExerciseCompletion(exercise, dayRecord[exercise.id]);
  }, 0);

  return clampPercentage(total / routine.exercises.length);
}

export function getProteinGoal(weight: number, goal: UserGoal): number {
  const multiplierByGoal: Record<UserGoal, number> = {
    bulk: 1.9,
    maintenance: 1.6,
    cut: 1.4,
  };

  return Math.round(weight * multiplierByGoal[goal]);
}

export function formatPercent(value: number): string {
  return `${clampPercentage(value)}%`;
}

export function getGrassColor(value: number): string {
  if (value <= 0) {
    return "#e5d9c7";
  }

  if (value < 25) {
    return "#d0dfc9";
  }

  if (value < 50) {
    return "#9db88f";
  }

  if (value < 75) {
    return "#5a865a";
  }

  return "#2f6645";
}

export function calculateStreak(history: HistoryEntry[]): number {
  let streak = 0;

  for (let index = history.length - 1; index >= 0; index -= 1) {
    if (history[index]?.completion > 0) {
      streak += 1;
      continue;
    }

    break;
  }

  return streak;
}

export function getWeeklyAverage(history: HistoryEntry[]): number {
  const recent = history.slice(-7);

  if (recent.length === 0) {
    return 0;
  }

  return clampPercentage(recent.reduce((sum, entry) => sum + entry.completion, 0) / recent.length);
}
