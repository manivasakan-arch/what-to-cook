# What to Cook? Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A browser-only Next.js app that randomly picks South Indian Tamil breakfast/lunch/dinner dishes, never repeats a dish within 7 days, and auto re-rolls so the day's picks meet a protein goal.

**Architecture:** Pure selection/history logic lives in `lib/` with zero React or storage coupling and is fully unit-tested. A `Store` interface abstracts persistence; v1 ships `LocalStorageStore`. A client-side `StoreProvider` React context hydrates state from the store and exposes actions. Four App Router pages (Home, Dish detail, Library, Settings) render on top.

**Tech Stack:** Next.js (App Router) + TypeScript, Tailwind CSS, Vitest (node env, injected in-memory Storage for store tests), Agentation (dev) mounted in the root layout.

**Reference spec:** `docs/superpowers/specs/2026-05-24-what-to-cook-design.md`

---

## File Structure

```
what-to-cook/
  app/
    layout.tsx              root layout, Tailwind, nav, <Agentation/>
    globals.css             Tailwind directives
    page.tsx                Home (spin, slots, protein ring, lock)
    library/page.tsx        Library (list, filter, search, CRUD)
    settings/page.tsx       Settings (protein goal, reset history)
    dish/[id]/page.tsx      Dish detail (ingredients, steps, video, edit)
  components/
    StoreProvider.tsx       client context: data + actions
    ProteinRing.tsx         protein total vs goal display
    MealCard.tsx            one meal slot card
    DishForm.tsx            add/edit dish form
  lib/
    types.ts                Dish, Meal, AppSettings, HistoryEntry
    selection.ts            dishesForMeal, pickForMeal, generateMenu, respinMeal, proteinTotal
    history.ts              usedInLast7Days, todayIso
    store.ts                Store interface, LocalStorageStore, DEFAULT_SETTINGS, KEYS
    seed.ts                 SEED_DISHES starter dataset (expand to ~100)
    __tests__/
      selection.test.ts
      history.test.ts
      store.test.ts
  vitest.config.ts
  package.json, tsconfig.json, tailwind/postcss config (from scaffold)
```

---

## Task 1: Scaffold Next.js app into the existing repo

The repo already contains `.git` and `docs/`. `create-next-app` refuses to scaffold into a non-empty dir, so scaffold in a temp dir and copy in (proven workaround for this machine).

**Files:**
- Create: project scaffold (app/, package.json, tsconfig.json, tailwind config, etc.)

- [ ] **Step 1: Scaffold in a temp directory**

Run:
```bash
rm -rf /tmp/wtc-scaffold && \
npx --yes create-next-app@latest /tmp/wtc-scaffold \
  --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --no-turbopack --use-npm
```
Expected: completes with "Success! Created ... at /tmp/wtc-scaffold".

- [ ] **Step 2: Copy scaffold into the repo (preserve .git and docs)**

Run:
```bash
cd /tmp/wtc-scaffold && \
rsync -a --exclude='.git' ./ /Users/manivasakanjay/code/what-to-cook/ && \
cd /Users/manivasakanjay/code/what-to-cook && ls app package.json
```
Expected: `app` dir and `package.json` listed in the repo.

- [ ] **Step 3: Install Vitest and Agentation**

Run:
```bash
cd /Users/manivasakanjay/code/what-to-cook && \
npm install -D vitest agentation
```
Expected: both added to devDependencies, no errors.

- [ ] **Step 4: Add the test script and Vitest config**

Edit `package.json` `scripts` to include:
```json
"test": "vitest run",
"test:watch": "vitest"
```

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/__tests__/**/*.test.ts"],
  },
});
```

- [ ] **Step 5: Verify the dev server boots**

Run:
```bash
cd /Users/manivasakanjay/code/what-to-cook && npm run build
```
Expected: build succeeds (default scaffold compiles).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Tailwind, Vitest, Agentation"
```

---

## Task 2: Domain types

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Write the types**

```ts
// lib/types.ts
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
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/manivasakanjay/code/what-to-cook && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add domain types"
```

---

## Task 3: Selection logic (TDD)

**Files:**
- Create: `lib/selection.ts`
- Test: `lib/__tests__/selection.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/__tests__/selection.test.ts
import { describe, it, expect } from "vitest";
import { Dish, MealPicks } from "../types";
import {
  dishesForMeal,
  pickForMeal,
  proteinTotal,
  generateMenu,
  respinMeal,
} from "../selection";

function dish(id: string, meals: Dish["meals"], protein: number): Dish {
  return {
    id, name: id, meals, ingredients: [], steps: [],
    proteinGrams: protein, youtubeUrl: "", isCustom: false,
  };
}

// rng that returns 0 always picks the first pool element
const first = () => 0;

const data: Dish[] = [
  dish("idli", ["breakfast", "dinner"], 6),
  dish("pongal", ["breakfast"], 8),
  dish("sambar-rice", ["lunch"], 12),
  dish("curd-rice", ["lunch", "dinner"], 9),
  dish("dosa", ["breakfast", "dinner"], 7),
];

describe("dishesForMeal", () => {
  it("returns only dishes tagged for the meal", () => {
    expect(dishesForMeal(data, "lunch").map((d) => d.id)).toEqual([
      "sambar-rice", "curd-rice",
    ]);
  });
});

describe("pickForMeal", () => {
  it("excludes soft-excluded ids", () => {
    const pick = pickForMeal(data, "breakfast", new Set(["idli"]), new Set(), first);
    expect(pick?.id).toBe("pongal");
  });

  it("relaxes soft exclusions when pool would be empty", () => {
    const soft = new Set(["idli", "pongal", "dosa"]);
    const pick = pickForMeal(data, "breakfast", soft, new Set(), first);
    expect(pick?.id).toBe("idli"); // relaxed back to full breakfast pool
  });

  it("never returns a hard-excluded dish even when relaxing", () => {
    const soft = new Set(["idli", "pongal", "dosa"]);
    const hard = new Set(["idli"]);
    const pick = pickForMeal(data, "breakfast", soft, hard, first);
    expect(pick?.id).toBe("pongal");
  });

  it("returns null when no dish is tagged for the meal", () => {
    const onlyBreakfast = [dish("idli", ["breakfast"], 6)];
    expect(pickForMeal(onlyBreakfast, "lunch", new Set(), new Set(), first)).toBeNull();
  });
});

describe("proteinTotal", () => {
  it("sums protein over present picks, ignoring nulls", () => {
    const picks: MealPicks = {
      breakfast: data[0], lunch: data[2], dinner: null,
    };
    expect(proteinTotal(picks)).toBe(18);
  });
});

describe("generateMenu", () => {
  it("never picks the same dish twice in one day", () => {
    // only one dish serves both breakfast and dinner, plus a lunch dish
    const small = [
      dish("idli", ["breakfast", "dinner"], 6),
      dish("dosa", ["breakfast", "dinner"], 7),
      dish("sambar-rice", ["lunch"], 12),
    ];
    const res = generateMenu(small, new Set(), 100, first);
    expect(res.picks.breakfast?.id).not.toBe(res.picks.dinner?.id);
  });

  it("returns metGoal true when a combo can reach the goal", () => {
    const res = generateMenu(data, new Set(), 20, first);
    expect(res.metGoal).toBe(true);
    expect(res.total).toBeGreaterThanOrEqual(20);
  });

  it("returns best effort with metGoal false and caps at 50 attempts", () => {
    const res = generateMenu(data, new Set(), 1000, first);
    expect(res.metGoal).toBe(false);
    expect(res.attempts).toBe(50);
    expect(res.total).toBeGreaterThan(0);
  });
});

describe("respinMeal", () => {
  it("avoids the other slots' current picks", () => {
    const picks: MealPicks = {
      breakfast: data[0], // idli
      lunch: data[2],
      dinner: data[4], // dosa
    };
    // breakfast pool [idli, pongal, dosa]; dosa is taken by dinner, idli is current => first available is pongal? 
    // hard-excluded = {dosa}. soft = none. first() picks index 0 of [idli, pongal] = idli
    const pick = respinMeal(data, "breakfast", new Set(), picks, first);
    expect(pick?.id).toBe("idli");
    expect(pick?.id).not.toBe("dosa");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/manivasakanjay/code/what-to-cook && npm test`
Expected: FAIL, cannot import from `../selection` (module not found).

- [ ] **Step 3: Implement the selection logic**

```ts
// lib/selection.ts
import { Dish, Meal, MEALS, MealPicks } from "./types";

const MAX_ATTEMPTS = 50;

export function dishesForMeal(dishes: Dish[], meal: Meal): Dish[] {
  return dishes.filter((d) => d.meals.includes(meal));
}

/**
 * Pick a random dish for a meal.
 * softExcludedIds (last-7 window) are dropped first, but relaxed if that empties the pool.
 * hardExcludedIds (same-day picks) are never relaxed.
 */
export function pickForMeal(
  dishes: Dish[],
  meal: Meal,
  softExcludedIds: Set<string>,
  hardExcludedIds: Set<string>,
  rng: () => number = Math.random
): Dish | null {
  const eligible = dishesForMeal(dishes, meal).filter((d) => !hardExcludedIds.has(d.id));
  if (eligible.length === 0) return null;
  let pool = eligible.filter((d) => !softExcludedIds.has(d.id));
  if (pool.length === 0) pool = eligible; // relax the 7-day window
  const idx = Math.floor(rng() * pool.length);
  return pool[idx];
}

export function proteinTotal(picks: MealPicks): number {
  return MEALS.reduce((sum, m) => sum + (picks[m]?.proteinGrams ?? 0), 0);
}

export interface MenuResult {
  picks: MealPicks;
  total: number;
  metGoal: boolean;
  attempts: number;
}

export function generateMenu(
  dishes: Dish[],
  usedLast7: Set<string>,
  goalGrams: number,
  rng: () => number = Math.random
): MenuResult {
  let best: { picks: MealPicks; total: number } | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const picks: MealPicks = { breakfast: null, lunch: null, dinner: null };
    const sameDay = new Set<string>();
    for (const meal of MEALS) {
      const pick = pickForMeal(dishes, meal, usedLast7, sameDay, rng);
      picks[meal] = pick;
      if (pick) sameDay.add(pick.id);
    }
    const total = proteinTotal(picks);
    if (best === null || total > best.total) best = { picks, total };
    if (total >= goalGrams) return { picks, total, metGoal: true, attempts: attempt };
  }

  return { picks: best!.picks, total: best!.total, metGoal: false, attempts: MAX_ATTEMPTS };
}

export function respinMeal(
  dishes: Dish[],
  meal: Meal,
  usedLast7: Set<string>,
  currentPicks: MealPicks,
  rng: () => number = Math.random
): Dish | null {
  const sameDay = new Set<string>();
  for (const m of MEALS) {
    if (m !== meal && currentPicks[m]) sameDay.add(currentPicks[m]!.id);
  }
  return pickForMeal(dishes, meal, usedLast7, sameDay, rng);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/manivasakanjay/code/what-to-cook && npm test`
Expected: PASS (all selection tests green).

- [ ] **Step 5: Commit**

```bash
git add lib/selection.ts lib/__tests__/selection.test.ts
git commit -m "feat: add dish selection logic with protein auto-reroll"
```

---

## Task 4: History helpers (TDD)

**Files:**
- Create: `lib/history.ts`
- Test: `lib/__tests__/history.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/__tests__/history.test.ts
import { describe, it, expect } from "vitest";
import { HistoryEntry } from "../types";
import { usedInLast7Days, todayIso } from "../history";

const today = new Date("2026-05-24T12:00:00Z");

const history: HistoryEntry[] = [
  { date: "2026-05-24", picks: { breakfast: "idli", lunch: "sambar-rice" } },
  { date: "2026-05-20", picks: { dinner: "dosa" } },           // within 7 days
  { date: "2026-05-16", picks: { breakfast: "pongal" } },      // exactly 8 days back -> excluded
];

describe("usedInLast7Days", () => {
  it("collects dish ids from entries within the last 7 days", () => {
    const ids = usedInLast7Days(history, today);
    expect(ids.has("idli")).toBe(true);
    expect(ids.has("sambar-rice")).toBe(true);
    expect(ids.has("dosa")).toBe(true);
  });

  it("excludes entries older than 7 days", () => {
    const ids = usedInLast7Days(history, today);
    expect(ids.has("pongal")).toBe(false);
  });
});

describe("todayIso", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(todayIso(new Date("2026-05-24T23:30:00"))).toBe("2026-05-24");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/manivasakanjay/code/what-to-cook && npm test`
Expected: FAIL, cannot import from `../history`.

- [ ] **Step 3: Implement the helpers**

```ts
// lib/history.ts
import { HistoryEntry, MEALS } from "./types";

export function todayIso(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Dish ids used within the 7 days ending at `today` (exclusive of the 8th day back). */
export function usedInLast7Days(history: HistoryEntry[], today: Date = new Date()): Set<string> {
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - 7);
  const ids = new Set<string>();
  for (const entry of history) {
    const entryDate = new Date(entry.date + "T00:00:00");
    if (entryDate > cutoff && entryDate <= today) {
      for (const meal of MEALS) {
        const id = entry.picks[meal];
        if (id) ids.add(id);
      }
    }
  }
  return ids;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/manivasakanjay/code/what-to-cook && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/history.ts lib/__tests__/history.test.ts
git commit -m "feat: add history window helpers"
```

---

## Task 5: Storage layer (TDD)

**Files:**
- Create: `lib/store.ts`
- Test: `lib/__tests__/store.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/__tests__/store.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/manivasakanjay/code/what-to-cook && npm test`
Expected: FAIL, cannot import from `../store`.

- [ ] **Step 3: Implement the store**

```ts
// lib/store.ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/manivasakanjay/code/what-to-cook && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/store.ts lib/__tests__/store.test.ts
git commit -m "feat: add localStorage-backed store with seeding"
```

---

## Task 6: Seed dataset (starter set)

Ships a real, schema-valid starter set. Expanding to ~100 dishes is follow-on data entry using the identical shape (same fields, real ingredients/steps, `~` protein estimates, best-pick or search YouTube URL). No app logic depends on the count.

**Files:**
- Create: `lib/seed.ts`

- [ ] **Step 1: Write the starter dataset**

```ts
// lib/seed.ts
import { Dish } from "./types";

// Helper: YouTube search fallback URL from a dish name.
export function youtubeSearch(name: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(name + " recipe")}`;
}

// Starter set. Protein values are per-serving estimates (approximate).
// Expand toward ~100 dishes using this same structure.
export const SEED_DISHES: Dish[] = [
  {
    id: "idli", name: "Idli", nameTamil: "இட்லி",
    meals: ["breakfast", "dinner"],
    ingredients: ["2 cups idli rice", "1 cup urad dal", "1 tsp fenugreek seeds", "Salt to taste"],
    steps: [
      "Soak rice and dal separately for 4 to 6 hours.",
      "Grind to a smooth batter, mix, add salt, ferment overnight.",
      "Pour into idli moulds and steam 10 to 12 minutes.",
      "Serve hot with sambar and chutney.",
    ],
    proteinGrams: 6, youtubeUrl: youtubeSearch("Idli"), isCustom: false,
  },
  {
    id: "dosa", name: "Dosa", nameTamil: "தோசை",
    meals: ["breakfast", "dinner"],
    ingredients: ["3 cups dosa rice", "1 cup urad dal", "1 tsp fenugreek seeds", "Salt to taste", "Oil for cooking"],
    steps: [
      "Soak rice and dal 4 to 6 hours, grind to batter, ferment overnight.",
      "Heat a tawa, pour a ladle of batter and spread thin.",
      "Drizzle oil, cook until golden and crisp.",
      "Serve with chutney and sambar.",
    ],
    proteinGrams: 7, youtubeUrl: youtubeSearch("Plain Dosa"), isCustom: false,
  },
  {
    id: "ven-pongal", name: "Ven Pongal", nameTamil: "வெண் பொங்கல்",
    meals: ["breakfast"],
    ingredients: ["1 cup raw rice", "0.5 cup moong dal", "1 tsp pepper", "1 tsp cumin", "Ginger, ghee, cashews, curry leaves"],
    steps: [
      "Dry roast moong dal lightly.",
      "Pressure cook rice and dal together until soft.",
      "Temper pepper, cumin, ginger, cashews and curry leaves in ghee.",
      "Mix into the rice, add salt, serve hot.",
    ],
    proteinGrams: 9, youtubeUrl: youtubeSearch("Ven Pongal"), isCustom: false,
  },
  {
    id: "pesarattu", name: "Pesarattu", nameTamil: "பெசரட்டு",
    meals: ["breakfast", "dinner"],
    ingredients: ["1 cup whole green gram", "1 green chilli", "Small piece ginger", "Salt", "Oil"],
    steps: [
      "Soak green gram 4 hours.",
      "Grind with chilli, ginger and salt to a batter.",
      "Spread thin on a hot tawa, drizzle oil, cook both sides.",
      "Serve with ginger chutney.",
    ],
    proteinGrams: 14, youtubeUrl: youtubeSearch("Pesarattu"), isCustom: false,
  },
  {
    id: "sambar-rice", name: "Sambar Sadam", nameTamil: "சாம்பார் சாதம்",
    meals: ["lunch"],
    ingredients: ["1 cup rice", "0.5 cup toor dal", "Mixed vegetables", "Sambar powder", "Tamarind", "Tempering spices"],
    steps: [
      "Pressure cook rice, dal and vegetables.",
      "Add tamarind extract, sambar powder and salt, simmer.",
      "Temper mustard, curry leaves and red chilli, add in.",
      "Serve hot with ghee and appalam.",
    ],
    proteinGrams: 12, youtubeUrl: youtubeSearch("Sambar Sadam"), isCustom: false,
  },
  {
    id: "curd-rice", name: "Thayir Sadam", nameTamil: "தயிர் சாதம்",
    meals: ["lunch", "dinner"],
    ingredients: ["1.5 cups cooked rice", "1 cup curd", "0.25 cup milk", "Ginger, green chilli", "Mustard, curry leaves"],
    steps: [
      "Mash cooked rice lightly, cool.",
      "Mix in curd, milk and salt.",
      "Temper mustard, chilli, ginger and curry leaves, add in.",
      "Garnish with coriander, serve chilled.",
    ],
    proteinGrams: 9, youtubeUrl: youtubeSearch("Curd Rice"), isCustom: false,
  },
  {
    id: "lemon-rice", name: "Elumichai Sadam", nameTamil: "எலுமிச்சை சாதம்",
    meals: ["lunch"],
    ingredients: ["2 cups cooked rice", "2 lemons", "Peanuts", "Chana dal, urad dal", "Turmeric, curry leaves"],
    steps: [
      "Temper dals, peanuts, chilli and curry leaves with turmeric.",
      "Add to cooked rice with salt.",
      "Squeeze lemon juice, mix gently.",
      "Serve warm.",
    ],
    proteinGrams: 7, youtubeUrl: youtubeSearch("Lemon Rice"), isCustom: false,
  },
  {
    id: "chicken-chettinad", name: "Chettinad Chicken", nameTamil: "செட்டிநாடு கோழி",
    meals: ["lunch", "dinner"],
    ingredients: ["500g chicken", "Onion, tomato", "Chettinad masala", "Coconut", "Curry leaves"],
    steps: [
      "Dry roast and grind the Chettinad spices with coconut.",
      "Saute onions, tomato and chicken.",
      "Add the ground masala and water, cook until done.",
      "Finish with curry leaves, serve with rice or dosa.",
    ],
    proteinGrams: 32, youtubeUrl: youtubeSearch("Chettinad Chicken"), isCustom: false,
  },
  {
    id: "egg-kuzhambu", name: "Muttai Kuzhambu", nameTamil: "முட்டை குழம்பு",
    meals: ["lunch", "dinner"],
    ingredients: ["4 boiled eggs", "Onion, tomato", "Tamarind", "Sambar powder", "Coconut paste"],
    steps: [
      "Saute onion and tomato, add spice powders.",
      "Add tamarind extract and coconut paste, simmer.",
      "Slip in the boiled eggs, cook a few minutes.",
      "Serve with rice.",
    ],
    proteinGrams: 18, youtubeUrl: youtubeSearch("Egg Kuzhambu"), isCustom: false,
  },
];
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/manivasakanjay/code/what-to-cook && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/seed.ts
git commit -m "feat: add Tamil dish seed starter dataset"
```

---

## Task 7: StoreProvider context

Client-only context that hydrates from `LocalStorageStore` on mount and exposes data + actions.

**Files:**
- Create: `components/StoreProvider.tsx`

- [ ] **Step 1: Implement the provider**

```tsx
// components/StoreProvider.tsx
"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AppSettings, Dish, HistoryEntry } from "@/lib/types";
import { LocalStorageStore, Store, DEFAULT_SETTINGS } from "@/lib/store";
import { SEED_DISHES } from "@/lib/seed";

interface StoreContextValue {
  ready: boolean;
  dishes: Dish[];
  settings: AppSettings;
  history: HistoryEntry[];
  saveDish: (dish: Dish) => void;
  deleteDish: (id: string) => void;
  saveSettings: (settings: AppSettings) => void;
  lockMenu: (entry: HistoryEntry) => void;
  resetHistory: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<Store | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = new LocalStorageStore(window.localStorage, SEED_DISHES);
    setStore(s);
    setDishes(s.getDishes());
    setSettings(s.getSettings());
    setHistory(s.getHistory());
    setReady(true);
  }, []);

  const saveDish = useCallback((dish: Dish) => { store!.saveDish(dish); setDishes(store!.getDishes()); }, [store]);
  const deleteDish = useCallback((id: string) => { store!.deleteDish(id); setDishes(store!.getDishes()); }, [store]);
  const saveSettings = useCallback((s: AppSettings) => { store!.saveSettings(s); setSettings(store!.getSettings()); }, [store]);
  const lockMenu = useCallback((e: HistoryEntry) => { store!.lockMenu(e); setHistory(store!.getHistory()); }, [store]);
  const resetHistory = useCallback(() => { store!.resetHistory(); setHistory(store!.getHistory()); }, [store]);

  return (
    <StoreContext.Provider value={{ ready, dishes, settings, history, saveDish, deleteDish, saveSettings, lockMenu, resetHistory }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/manivasakanjay/code/what-to-cook && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/StoreProvider.tsx
git commit -m "feat: add StoreProvider context"
```

---

## Task 8: Root layout, nav, and Agentation

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace the layout**

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Agentation } from "agentation";
import { StoreProvider } from "@/components/StoreProvider";

export const metadata: Metadata = {
  title: "What to Cook?",
  description: "Random South Indian Tamil meal picker with a protein goal.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900">
        <StoreProvider>
          <header className="border-b bg-white">
            <nav className="mx-auto flex max-w-3xl items-center gap-6 px-4 py-3 text-sm font-medium">
              <Link href="/" className="text-lg font-bold text-orange-600">What to Cook?</Link>
              <Link href="/library" className="hover:text-orange-600">Library</Link>
              <Link href="/settings" className="hover:text-orange-600">Settings</Link>
            </nav>
          </header>
          <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
          <Agentation />
        </StoreProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verify the import path for Agentation**

Run: `cd /Users/manivasakanjay/code/what-to-cook && node -e "console.log(Object.keys(require('agentation')))"`
Expected: output includes `Agentation`. If it is a default export instead, change the import to `import Agentation from "agentation";` and re-run the build in the next step.

- [ ] **Step 3: Build to verify**

Run: `cd /Users/manivasakanjay/code/what-to-cook && npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: add root layout, nav, and Agentation"
```

---

## Task 9: ProteinRing component

**Files:**
- Create: `components/ProteinRing.tsx`

- [ ] **Step 1: Implement the component**

```tsx
// components/ProteinRing.tsx
"use client";

export function ProteinRing({ total, goal }: { total: number; goal: number }) {
  const met = total >= goal;
  const pct = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 100;
  const short = Math.max(0, goal - total);
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-white p-4">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full"
        style={{ background: `conic-gradient(${met ? "#16a34a" : "#ea580c"} ${pct * 3.6}deg, #e7e5e4 0deg)` }}
      >
        <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-white">
          <span className="text-lg font-bold">{total}g</span>
          <span className="text-[10px] text-stone-500">of {goal}g</span>
        </div>
      </div>
      <div>
        <p className="font-semibold">{met ? "Protein goal met" : "Below protein goal"}</p>
        {!met && <p className="text-sm text-orange-600">{short}g short. Re-spin or add a protein side.</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/manivasakanjay/code/what-to-cook && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/ProteinRing.tsx
git commit -m "feat: add ProteinRing component"
```

---

## Task 10: MealCard component

**Files:**
- Create: `components/MealCard.tsx`

- [ ] **Step 1: Implement the component**

```tsx
// components/MealCard.tsx
"use client";
import Link from "next/link";
import { Dish, Meal } from "@/lib/types";

const LABELS: Record<Meal, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };

export function MealCard({ meal, dish, onRespin }: { meal: Meal; dish: Dish | null; onRespin: () => void }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">{LABELS[meal]}</span>
        <button onClick={onRespin} className="rounded-full border px-2 py-1 text-xs hover:bg-stone-100" aria-label={`Re-spin ${LABELS[meal]}`}>
          Re-spin
        </button>
      </div>
      {dish ? (
        <Link href={`/dish/${dish.id}`} className="block">
          <p className="text-lg font-semibold hover:text-orange-600">{dish.name}</p>
          {dish.nameTamil && <p className="text-sm text-stone-500">{dish.nameTamil}</p>}
          <p className="mt-1 text-sm text-stone-600">~{dish.proteinGrams}g protein</p>
        </Link>
      ) : (
        <p className="text-sm text-stone-400">No dish for this meal. Add one in the Library.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/manivasakanjay/code/what-to-cook && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/MealCard.tsx
git commit -m "feat: add MealCard component"
```

---

## Task 11: Home page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Implement the Home page**

```tsx
// app/page.tsx
"use client";
import { useState } from "react";
import { useStore } from "@/components/StoreProvider";
import { generateMenu, respinMeal, proteinTotal, MenuResult } from "@/lib/selection";
import { usedInLast7Days, todayIso } from "@/lib/history";
import { MealPicks, Meal, MEALS } from "@/lib/types";
import { ProteinRing } from "@/components/ProteinRing";
import { MealCard } from "@/components/MealCard";

const EMPTY: MealPicks = { breakfast: null, lunch: null, dinner: null };

export default function Home() {
  const { ready, dishes, settings, history, lockMenu } = useStore();
  const [picks, setPicks] = useState<MealPicks>(EMPTY);
  const [result, setResult] = useState<MenuResult | null>(null);
  const [locked, setLocked] = useState(false);

  if (!ready) return <p className="text-stone-500">Loading...</p>;

  const used = usedInLast7Days(history, new Date());

  function spin() {
    const r = generateMenu(dishes, used, settings.proteinGoalGrams);
    setPicks(r.picks);
    setResult(r);
    setLocked(false);
  }

  function respin(meal: Meal) {
    const next = respinMeal(dishes, meal, used, picks);
    const updated = { ...picks, [meal]: next };
    setPicks(updated);
    setResult({ ...(result ?? { metGoal: false, attempts: 0 }), picks: updated, total: proteinTotal(updated), metGoal: proteinTotal(updated) >= settings.proteinGoalGrams } as MenuResult);
    setLocked(false);
  }

  function lock() {
    lockMenu({
      date: todayIso(new Date()),
      picks: {
        breakfast: picks.breakfast?.id,
        lunch: picks.lunch?.id,
        dinner: picks.dinner?.id,
      },
    });
    setLocked(true);
  }

  const hasPicks = MEALS.some((m) => picks[m] !== null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Today&apos;s menu</h1>
        <button onClick={spin} className="rounded-full bg-orange-600 px-6 py-2 font-semibold text-white hover:bg-orange-700">
          Spin
        </button>
      </div>

      {hasPicks && <ProteinRing total={proteinTotal(picks)} goal={settings.proteinGoalGrams} />}

      <div className="grid gap-3">
        {MEALS.map((m) => (
          <MealCard key={m} meal={m} dish={picks[m]} onRespin={() => respin(m)} />
        ))}
      </div>

      {hasPicks && (
        <button onClick={lock} disabled={locked} className="w-full rounded-xl border bg-white py-3 font-semibold hover:bg-stone-100 disabled:opacity-50">
          {locked ? "Menu locked for today" : "Lock today's menu"}
        </button>
      )}

      {!hasPicks && <p className="text-stone-500">Tap Spin to get today&apos;s breakfast, lunch and dinner.</p>}
    </div>
  );
}
```

- [ ] **Step 2: Build to verify**

Run: `cd /Users/manivasakanjay/code/what-to-cook && npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add Home page with spin, re-spin, lock"
```

---

## Task 12: DishForm component

**Files:**
- Create: `components/DishForm.tsx`

- [ ] **Step 1: Implement the form**

```tsx
// components/DishForm.tsx
"use client";
import { useState } from "react";
import { Dish, Meal, MEALS } from "@/lib/types";
import { youtubeSearch } from "@/lib/seed";

const LABELS: Record<Meal, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `dish-${Date.now()}`;
}

export function DishForm({ initial, onSave, onCancel }: { initial?: Dish; onSave: (d: Dish) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [nameTamil, setNameTamil] = useState(initial?.nameTamil ?? "");
  const [meals, setMeals] = useState<Meal[]>(initial?.meals ?? []);
  const [ingredients, setIngredients] = useState((initial?.ingredients ?? []).join("\n"));
  const [steps, setSteps] = useState((initial?.steps ?? []).join("\n"));
  const [protein, setProtein] = useState(String(initial?.proteinGrams ?? 0));
  const [youtubeUrl, setYoutubeUrl] = useState(initial?.youtubeUrl ?? "");

  function toggleMeal(m: Meal) {
    setMeals((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || meals.length === 0) return;
    const dish: Dish = {
      id: initial?.id ?? slugify(name),
      name: name.trim(),
      nameTamil: nameTamil.trim() || undefined,
      meals,
      ingredients: ingredients.split("\n").map((s) => s.trim()).filter(Boolean),
      steps: steps.split("\n").map((s) => s.trim()).filter(Boolean),
      proteinGrams: Number(protein) || 0,
      youtubeUrl: youtubeUrl.trim() || youtubeSearch(name),
      isCustom: initial?.isCustom ?? true,
    };
    onSave(dish);
  }

  const field = "w-full rounded-lg border px-3 py-2";

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border bg-white p-4">
      <input className={field} placeholder="Dish name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className={field} placeholder="Tamil name (optional)" value={nameTamil} onChange={(e) => setNameTamil(e.target.value)} />
      <div className="flex gap-4 text-sm">
        {MEALS.map((m) => (
          <label key={m} className="flex items-center gap-1">
            <input type="checkbox" checked={meals.includes(m)} onChange={() => toggleMeal(m)} /> {LABELS[m]}
          </label>
        ))}
      </div>
      <textarea className={field} rows={4} placeholder="Ingredients, one per line" value={ingredients} onChange={(e) => setIngredients(e.target.value)} />
      <textarea className={field} rows={5} placeholder="Steps, one per line" value={steps} onChange={(e) => setSteps(e.target.value)} />
      <input className={field} type="number" placeholder="Protein grams (estimate)" value={protein} onChange={(e) => setProtein(e.target.value)} />
      <input className={field} placeholder="YouTube URL (blank = auto search link)" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
      <div className="flex gap-2">
        <button type="submit" className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700">Save</button>
        <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 hover:bg-stone-100">Cancel</button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/manivasakanjay/code/what-to-cook && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/DishForm.tsx
git commit -m "feat: add DishForm component"
```

---

## Task 13: Library page

**Files:**
- Create: `app/library/page.tsx`

- [ ] **Step 1: Implement the Library page**

```tsx
// app/library/page.tsx
"use client";
import { useState } from "react";
import { useStore } from "@/components/StoreProvider";
import { Dish, Meal, MEALS } from "@/lib/types";
import { DishForm } from "@/components/DishForm";
import Link from "next/link";

type Filter = "all" | Meal;
const FILTERS: Filter[] = ["all", ...MEALS];

export default function Library() {
  const { ready, dishes, saveDish, deleteDish } = useStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Dish | null>(null);
  const [adding, setAdding] = useState(false);

  if (!ready) return <p className="text-stone-500">Loading...</p>;

  const visible = dishes.filter((d) => {
    const mealOk = filter === "all" || d.meals.includes(filter);
    const q = query.trim().toLowerCase();
    const queryOk = !q || d.name.toLowerCase().includes(q) || (d.nameTamil ?? "").includes(query.trim());
    return mealOk && queryOk;
  });

  function handleSave(dish: Dish) {
    saveDish(dish);
    setEditing(null);
    setAdding(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Library</h1>
        <button onClick={() => { setAdding(true); setEditing(null); }} className="rounded-full bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700">Add dish</button>
      </div>

      {(adding || editing) && (
        <DishForm initial={editing ?? undefined} onSave={handleSave} onCancel={() => { setAdding(false); setEditing(null); }} />
      )}

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-3 py-1 text-sm capitalize ${filter === f ? "bg-stone-900 text-white" : "hover:bg-stone-100"}`}>
            {f}
          </button>
        ))}
        <input className="ml-auto rounded-lg border px-3 py-1 text-sm" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="grid gap-2">
        {visible.map((d) => (
          <div key={d.id} className="flex items-center justify-between rounded-xl border bg-white p-3">
            <div>
              <Link href={`/dish/${d.id}`} className="font-semibold hover:text-orange-600">{d.name}</Link>
              <p className="text-xs text-stone-500">{d.meals.join(", ")} · ~{d.proteinGrams}g</p>
            </div>
            <div className="flex gap-2 text-sm">
              <button onClick={() => { setEditing(d); setAdding(false); }} className="rounded border px-2 py-1 hover:bg-stone-100">Edit</button>
              <button onClick={() => deleteDish(d.id)} className="rounded border px-2 py-1 text-red-600 hover:bg-red-50">Remove</button>
            </div>
          </div>
        ))}
        {visible.length === 0 && <p className="text-stone-500">No dishes match.</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build to verify**

Run: `cd /Users/manivasakanjay/code/what-to-cook && npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/library/page.tsx
git commit -m "feat: add Library page with filter, search, CRUD"
```

---

## Task 14: Dish detail page

**Files:**
- Create: `app/dish/[id]/page.tsx`

- [ ] **Step 1: Implement the detail page**

```tsx
// app/dish/[id]/page.tsx
"use client";
import { use, useState } from "react";
import { useStore } from "@/components/StoreProvider";
import { DishForm } from "@/components/DishForm";
import Link from "next/link";

export default function DishDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { ready, dishes, saveDish } = useStore();
  const [editing, setEditing] = useState(false);

  if (!ready) return <p className="text-stone-500">Loading...</p>;

  const dish = dishes.find((d) => d.id === id);
  if (!dish) {
    return (
      <div className="space-y-2">
        <p className="text-stone-600">This dish was removed.</p>
        <Link href="/library" className="text-orange-600">Back to Library</Link>
      </div>
    );
  }

  if (editing) {
    return <DishForm initial={dish} onSave={(d) => { saveDish(d); setEditing(false); }} onCancel={() => setEditing(false)} />;
  }

  return (
    <article className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{dish.name}</h1>
          {dish.nameTamil && <p className="text-stone-500">{dish.nameTamil}</p>}
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {dish.meals.map((m) => <span key={m} className="rounded-full bg-stone-200 px-2 py-1 capitalize">{m}</span>)}
            <span className="rounded-full bg-orange-100 px-2 py-1 text-orange-700">~{dish.proteinGrams}g protein</span>
          </div>
        </div>
        <button onClick={() => setEditing(true)} className="rounded-lg border px-3 py-1 text-sm hover:bg-stone-100">Edit</button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-2 font-semibold">Ingredients</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {dish.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
          </ul>
        </section>
        <section>
          <h2 className="mb-2 font-semibold">Method</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {dish.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </section>
      </div>

      <a href={dish.youtubeUrl} target="_blank" rel="noopener noreferrer" className="inline-block rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700">
        Watch on YouTube
      </a>
      <p className="text-xs text-stone-400">Protein value is an estimate.</p>
    </article>
  );
}
```

- [ ] **Step 2: Build to verify**

Run: `cd /Users/manivasakanjay/code/what-to-cook && npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add "app/dish/[id]/page.tsx"
git commit -m "feat: add dish detail page"
```

---

## Task 15: Settings page

**Files:**
- Create: `app/settings/page.tsx`

- [ ] **Step 1: Implement the Settings page**

```tsx
// app/settings/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/components/StoreProvider";

export default function Settings() {
  const { ready, settings, saveSettings, resetHistory } = useStore();
  const [goal, setGoal] = useState("60");

  useEffect(() => { if (ready) setGoal(String(settings.proteinGoalGrams)); }, [ready, settings.proteinGoalGrams]);

  if (!ready) return <p className="text-stone-500">Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="space-y-2 rounded-xl border bg-white p-4">
        <label className="block font-semibold">Daily protein goal (grams)</label>
        <div className="flex items-center gap-2">
          <input className="w-32 rounded-lg border px-3 py-2" type="number" min={0} value={goal} onChange={(e) => setGoal(e.target.value)} />
          <button onClick={() => saveSettings({ proteinGoalGrams: Number(goal) || 0 })} className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700">Save</button>
        </div>
        <p className="text-xs text-stone-400">Protein values across the app are estimates.</p>
      </div>

      <div className="space-y-2 rounded-xl border bg-white p-4">
        <label className="block font-semibold">No-repeat history</label>
        <p className="text-sm text-stone-600">Clears the 7-day window so all dishes become eligible again.</p>
        <button onClick={resetHistory} className="rounded-lg border px-4 py-2 text-red-600 hover:bg-red-50">Reset history</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build to verify**

Run: `cd /Users/manivasakanjay/code/what-to-cook && npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/settings/page.tsx
git commit -m "feat: add Settings page"
```

---

## Task 16: Full verification

**Files:**
- None (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `cd /Users/manivasakanjay/code/what-to-cook && npm test`
Expected: all selection, history, and store tests PASS.

- [ ] **Step 2: Production build**

Run: `cd /Users/manivasakanjay/code/what-to-cook && npm run build`
Expected: build succeeds with all four routes (`/`, `/library`, `/settings`, `/dish/[id]`).

- [ ] **Step 3: Manual smoke test in the browser**

Run: `cd /Users/manivasakanjay/code/what-to-cook && npm run dev` then open the printed localhost URL.
Verify, in order:
1. Home loads; Spin fills all three slots; protein ring reflects the total and turns green when the goal is met.
2. Re-spin on one slot changes only that slot and never duplicates another slot's dish.
3. Lock today's menu; reload; spinning again does not pick today's locked dishes.
4. Library: add a dish, edit it, remove it; filter chips and search work.
5. Dish detail shows ingredients, steps, and a working YouTube link.
6. Settings: change the goal, save, return Home; the ring uses the new goal. Reset history re-enables locked dishes.
7. Agentation toolbar appears in the browser.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: verify What to Cook v1 end to end" --allow-empty
```

---

## Notes for the implementer

- **TDD applies to `lib/` only.** The selection, history, and store modules have tests (Tasks 3 to 5). React pages/components are verified by build + the manual smoke test in Task 16, matching the spec's testing strategy.
- **Agentation** is required before sharing any localhost link (user rule). It is wired in Task 8.
- **Seed expansion** to ~100 dishes is data entry using the `Dish` shape in `lib/seed.ts`; it needs no code changes.
- **No em dashes** in any dish copy or UI string (user content rule).
