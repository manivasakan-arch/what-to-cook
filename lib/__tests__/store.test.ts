import { describe, it, expect, beforeEach } from "vitest";
import { Dish } from "../types";
import { LocalStorageStore, DEFAULT_SETTINGS } from "../store";

// Minimal in-memory Storage so tests run in node env without jsdom.
class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() { return this.map.size; }
  clear() { this.map.clear(); }
  getItem(k: string) { return this.map.has(k) ? this.map.get(k)! : null; }
  key(i: number) { return Array.from(this.map.keys())[i] ?? null; }
  removeItem(k: string) { this.map.delete(k); }
  setItem(k: string, v: string) { this.map.set(k, v); }
}

function seedDish(id: string): Dish {
  return { id, name: id, meals: ["lunch"], ingredients: [], steps: [], proteinGrams: 10, youtubeUrl: "", isCustom: false };
}

let storage: MemoryStorage;
let store: LocalStorageStore;
const seed = [seedDish("a"), seedDish("b")];

beforeEach(() => {
  storage = new MemoryStorage();
  store = new LocalStorageStore(storage, seed);
});

describe("LocalStorageStore dishes", () => {
  it("seeds dishes on first read", () => {
    expect(store.getDishes().map((d) => d.id)).toEqual(["a", "b"]);
    expect(storage.getItem("wtc.dishes")).not.toBeNull();
  });

  it("does not re-seed after a delete persists", () => {
    store.getDishes();
    store.deleteDish("a");
    expect(store.getDishes().map((d) => d.id)).toEqual(["b"]);
  });

  it("saveDish updates an existing dish by id", () => {
    store.getDishes();
    const updated = { ...seedDish("a"), name: "Apple" };
    store.saveDish(updated);
    expect(store.getDishes().find((d) => d.id === "a")?.name).toBe("Apple");
    expect(store.getDishes().length).toBe(2);
  });

  it("saveDish adds a new dish", () => {
    store.getDishes();
    store.saveDish(seedDish("c"));
    expect(store.getDishes().map((d) => d.id)).toEqual(["a", "b", "c"]);
  });
});

describe("LocalStorageStore settings", () => {
  it("returns defaults when unset", () => {
    expect(store.getSettings()).toEqual(DEFAULT_SETTINGS);
  });
  it("persists saved settings", () => {
    store.saveSettings({ proteinGoalGrams: 80 });
    expect(store.getSettings().proteinGoalGrams).toBe(80);
  });
});

describe("LocalStorageStore history", () => {
  it("starts empty and appends locked menus", () => {
    expect(store.getHistory()).toEqual([]);
    store.lockMenu({ date: "2026-05-24", picks: { breakfast: "a" } });
    expect(store.getHistory()).toHaveLength(1);
  });
  it("overwrites an entry for the same date", () => {
    store.lockMenu({ date: "2026-05-24", picks: { breakfast: "a" } });
    store.lockMenu({ date: "2026-05-24", picks: { breakfast: "b" } });
    expect(store.getHistory()).toHaveLength(1);
    expect(store.getHistory()[0].picks.breakfast).toBe("b");
  });
});
