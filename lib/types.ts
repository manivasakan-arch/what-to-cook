export type Meal = "breakfast" | "lunch" | "dinner";

export const MEALS: Meal[] = ["breakfast", "lunch", "dinner"];

export type DishKind = "main" | "side";

export interface Dish {
  id: string;
  name: string;
  nameTamil?: string;
  meals: Meal[];
  kind?: DishKind; // undefined treated as "main"
  ingredients: string[];
  steps: string[];
  proteinGrams: number;
  youtubeUrl: string;
  imageUrl?: string;
  isCustom: boolean;
}

export interface AppSettings {
  proteinGoalGrams: number;
}

export interface HistoryEntry {
  date: string; // ISO date "YYYY-MM-DD"
  picks: { breakfast?: string; lunch?: string; lunchSide?: string; dinner?: string };
}

// A full day: breakfast, lunch main + lunch poriyal side, dinner.
export type SlotKey = "breakfast" | "lunch" | "lunchSide" | "dinner";
export const SLOTS: SlotKey[] = ["breakfast", "lunch", "lunchSide", "dinner"];

export type DayPicks = Record<SlotKey, Dish | null>;
