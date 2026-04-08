import { mealByDay } from "@/data/mock-data";
import type { MealInfo, Weekday } from "@/types";

export async function fetchMealForDay(day: Weekday): Promise<MealInfo> {
  await new Promise((resolve) => {
    setTimeout(resolve, 320);
  });

  return mealByDay[day];
}

