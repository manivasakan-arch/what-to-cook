import { AppSettings, Dish, HistoryEntry } from "./types";

export const KEYS = {
  dishes: "wtc.dishes",
  settings: "wtc.settings",
  history: "wtc.history",
} as const;

export const DEFAULT_SETTINGS: AppSettings = { proteinGoalGrams: 60 };

export interface Store {
  getDishes(): Dish[];
  saveDish(dish: Dish): void;
  deleteDish(id: string): void;
  getSettings(): AppSettings;
  saveSettings(settings: AppSettings): void;
  getHistory(): HistoryEntry[];
  lockMenu(entry: HistoryEntry): void;
  resetHistory(): void;
}

export class LocalStorageStore implements Store {
  constructor(private storage: Storage, private seed: Dish[]) {}

  getDishes(): Dish[] {
    const raw = this.storage.getItem(KEYS.dishes);
    if (raw === null) {
      this.storage.setItem(KEYS.dishes, JSON.stringify(this.seed));
      return this.seed;
    }
    return JSON.parse(raw) as Dish[];
  }

  saveDish(dish: Dish): void {
    const all = this.getDishes();
    const i = all.findIndex((d) => d.id === dish.id);
    if (i >= 0) all[i] = dish;
    else all.push(dish);
    this.storage.setItem(KEYS.dishes, JSON.stringify(all));
  }

  deleteDish(id: string): void {
    const all = this.getDishes().filter((d) => d.id !== id);
    this.storage.setItem(KEYS.dishes, JSON.stringify(all));
  }

  getSettings(): AppSettings {
    const raw = this.storage.getItem(KEYS.settings);
    return raw === null ? DEFAULT_SETTINGS : (JSON.parse(raw) as AppSettings);
  }

  saveSettings(settings: AppSettings): void {
    this.storage.setItem(KEYS.settings, JSON.stringify(settings));
  }

  getHistory(): HistoryEntry[] {
    const raw = this.storage.getItem(KEYS.history);
    return raw === null ? [] : (JSON.parse(raw) as HistoryEntry[]);
  }

  lockMenu(entry: HistoryEntry): void {
    const history = this.getHistory().filter((e) => e.date !== entry.date);
    history.push(entry);
    this.storage.setItem(KEYS.history, JSON.stringify(history));
  }

  resetHistory(): void {
    this.storage.setItem(KEYS.history, JSON.stringify([]));
  }
}
