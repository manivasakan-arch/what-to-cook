export type Meal = "breakfast" | "lunch" | "dinner";

export const MEALS: Meal[] = ["breakfast", "lunch", "dinner"];

export interface Dish {
  id: string;
  name: string;
  nameTamil?: string;
  meals: Meal[];
  ingredients: string[];
  steps: string[];
  proteinGrams: number;
  youtubeUrl: string;
  isCustom: boolean;
}

export interface AppSettings {
  proteinGoalGrams: number;
}

export interface HistoryEntry {
  date: string; // ISO date "YYYY-MM-DD"
  picks: { breakfast?: string; lunch?: string; dinner?: string };
}

export type MealPicks = Record<Meal, Dish | null>;
