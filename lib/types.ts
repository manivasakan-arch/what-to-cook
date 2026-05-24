export type Meal = "breakfast" | "lunch" | "dinner";

export const MEALS: Meal[] = ["breakfast", "lunch", "dinner"];

// What role a dish plays in a composed plate.
export type Category =
  | "tiffin"   // breakfast / dinner light main (idli, dosa, pongal, parotta...)
  | "chutney"  // accompaniment for tiffin
  | "sambar"   // accompaniment for tiffin
  | "rice"     // plain rice, the thali base
  | "kuzhambu" // lunch gravy hero (vatha kuzhambu, mor kuzhambu...)
  | "poriyal"  // dry vegetable side
  | "rasam"    // thali rasam
  | "curd"     // curd / raita
  | "onepot";  // self-contained main (biryani, variety rice, fried rice, kothu...)

export interface Dish {
  id: string;
  name: string;
  nameTamil?: string;
  meals: Meal[];
  category: Category;
  pairs?: string[]; // signature accompaniment ids, tried before a random one
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
  date: string;   // ISO date "YYYY-MM-DD"
  ids: string[];  // every dish id used that day
}

// A composed plate for one meal.
export interface ComboItem {
  role: string; // "Main", "Chutney", "Rice", "Kuzhambu", "Poriyal", "Rasam", "Curd"
  dish: Dish;
}
export interface MealCombo {
  meal: Meal;
  items: ComboItem[];
}
export type DayPlan = Record<Meal, MealCombo | null>;
