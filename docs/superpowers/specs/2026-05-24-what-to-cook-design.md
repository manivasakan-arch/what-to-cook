# What to Cook? (Design Spec)

**Date:** 2026-05-24
**Status:** Approved for planning
**Scope:** v1, single implementation plan

## 1. Problem

At mealtime people waste energy deciding what to make. "What to Cook?" kills that decision fatigue for South Indian Tamil home cooking: it picks breakfast, lunch, and dinner for you at random, never repeats a dish within 7 days, and makes sure the day's picks add up to your protein goal. Every dish carries the ingredients, a step-by-step method, and a suggested YouTube video.

## 2. Goals (v1)

- Bundled dataset of ~100 real South Indian Tamil dishes, each tagged for one or more meals (breakfast / lunch / dinner).
- Each dish has: ingredients, ordered method steps, protein estimate, one suggested YouTube link.
- Home screen with a Spin action that randomly picks a dish for each of the three meals.
- No-repeat rule: a dish that was locked in is excluded from random picks for the next 7 days.
- Protein target: the user sets a daily goal (default 60g). The day's three picks should sum to at least the goal; the app auto re-rolls to try to reach it.
- Library with full add / edit / remove of dishes (seed dishes included).
- All data lives in the browser (localStorage), behind a storage interface so a server + database can replace it later.

## 3. Non-goals (v1)

Accounts/login, multi-device sync, grocery lists, serving-size scaling, food photos, dietary filters (veg/vegan/allergen), and calorie/macro tracking beyond protein. These are future work, explicitly out of scope.

## 4. Users and primary flow

Single user on their own browser. Primary flow:

1. Open Home. See three meal slots (Breakfast, Lunch, Dinner) and a protein ring.
2. Tap **Spin**. The app fills all three slots, auto re-rolling until the protein total meets the goal (or it reports the best it could do).
3. Optionally re-spin a single slot.
4. Tap a slot to open the dish detail (ingredients, steps, video).
5. Tap **Lock today's menu**. The three dishes are recorded as used (drive the 7-day no-repeat).

## 5. Tech stack

- Next.js (App Router) + TypeScript.
- Tailwind CSS.
- Client-side only; no server in v1.
- State persisted to localStorage through a storage module.
- Agentation mounted in the root layout (required before sharing any local link).

## 6. Data model

```ts
type Meal = "breakfast" | "lunch" | "dinner";

interface Dish {
  id: string;            // stable id (slug or uuid)
  name: string;          // English name
  nameTamil?: string;    // Tamil script, optional
  meals: Meal[];         // meals this dish suits (e.g. idli => breakfast + dinner)
  ingredients: string[]; // one line each, e.g. "1 cup idli rice"
  steps: string[];       // ordered method steps
  proteinGrams: number;  // estimate per serving (approximate)
  youtubeUrl: string;    // curated best-pick video, or search-URL fallback
  isCustom: boolean;     // true = user-added; false = seed dish
}

interface AppSettings {
  proteinGoalGrams: number; // default 60
}

interface HistoryEntry {
  date: string; // ISO date, e.g. "2026-05-24"
  picks: { breakfast?: string; lunch?: string; dinner?: string }; // dish ids
}
```

"Used in the last 7 days" is computed from `HistoryEntry` rows whose date is within 7 days of today. There is no separate "used" flag on a dish, so editing or deleting a dish never has to clean up state elsewhere.

## 7. Seed dataset

A bundled JSON file ships ~100 Tamil dishes spread across the three meals. Building it is a real sub-deliverable, researched from the web.

- **Protein values are estimates**, shown with a `~` prefix and a short disclaimer. They are not medical/nutrition-grade.
- **YouTube links**: a specific best-pick video where confident; otherwise a YouTube search URL built from the dish name (`https://www.youtube.com/results?search_query=<dish>+recipe`). The fallback guarantees no dead links.
- **No em dashes** anywhere in dish copy (per content rule).

Seeding behavior: on first run (no dishes stored), the seed JSON is loaded into storage. After that, the stored copy is the source of truth, so user edits and deletes persist and the seed is never re-applied over them.

## 8. Storage layer

A single interface isolates persistence so v1 localStorage can later be swapped for an API/database with no UI changes.

```ts
interface Store {
  getDishes(): Dish[];
  saveDish(dish: Dish): void;     // insert or update by id
  deleteDish(id: string): void;
  getSettings(): AppSettings;
  saveSettings(settings: AppSettings): void;
  getHistory(): HistoryEntry[];
  lockMenu(entry: HistoryEntry): void; // append, or replace today's entry
}
```

v1 implementation: `LocalStorageStore`. Keys namespaced (e.g. `wtc.dishes`, `wtc.settings`, `wtc.history`).

## 9. Screens

Patterns below are grounded in reference screens (NYT Cooking, Julienne, MacroFactor, Miro spinner) pulled during design.

### 9.1 Home
- Three stacked meal cards: Breakfast, Lunch, Dinner. Each shows the picked dish name, `~Ng` protein, and a per-card re-spin icon. Tapping the card opens detail.
- A prominent **Spin** control at the top spins all three at once.
- **Protein ring**: picked total vs goal, turns green when the goal is met. When the goal cannot be reached, it shows the total plus an "X g short" note.
- **Lock today's menu** button records the three picks as used.

### 9.2 Dish detail
- Two columns: Ingredients on the left, ordered Steps on the right.
- Tag chips (meal(s), `~Ng` protein).
- Suggested YouTube video (embed or link) below.
- Edit button to open the dish form.

### 9.3 Library
- Filter chips: All / Breakfast / Lunch / Dinner, plus a search box.
- Grid of dish cards.
- Add (new dish form), Edit, Remove. Removing a seed dish is allowed.
- Dish form fields: name, optional Tamil name, meal checkboxes, ingredients (multiline), steps (multiline), protein grams, YouTube URL.

### 9.4 Settings
- Daily protein goal input (default 60g).
- Reset history (clears the no-repeat window).
- Note that protein values are estimates.

## 10. Core logic

All selection logic is pure functions, separated from React, so it is unit-testable.

### 10.1 Pick one meal
```
pickForMeal(meal, dishes, excludedIds) -> Dish | null
  pool = dishes where meals includes meal AND id not in excludedIds
  if pool empty: pool = dishes where meals includes meal   // relax 7-day rule
  if pool empty: return null                                // no dish tagged this meal
  return random dish from pool
```

### 10.2 Generate a full day
```
generateMenu(dishes, usedLast7Ids, goal) -> { picks, total, metGoal, attempts }
  best = null
  for attempt in 0..49:                 // hard cap 50, never loops forever
    chosenToday = {}
    for meal in [breakfast, lunch, dinner]:
      excluded = usedLast7Ids + ids already chosen this combo  // no same dish twice in one day
      pick = pickForMeal(meal, dishes, excluded)
      chosenToday[meal] = pick
    total = sum of proteinGrams over present picks
    track best (highest total seen)
    if total >= goal: return { picks: chosenToday, total, metGoal: true, attempt }
  return { picks: best.picks, total: best.total, metGoal: false, attempts: 50 }
```

### 10.3 Re-spin a single slot
Re-pick only that meal, excluding the last-7 set and the other two current picks. A single-slot re-spin updates the protein meter but does not trigger auto re-roll (auto re-roll is a whole-day operation).

### 10.4 Lock
Writes today's `HistoryEntry`. Those dish ids then count as used for the next 7 days. Locking again on the same day overwrites today's entry.

## 11. Edge cases and decisions

- **Goal unreachable** (common: Tamil veg breakfasts are low protein): after 50 attempts, show the best combo found and the shortfall. The user can still lock it. No infinite loop.
- **Pool dry after 7-day exclusion**: relax to the full meal pool (still avoiding the same dish twice in one day). Decision: relaxation is a flat "ignore the 7-day window," not an oldest-first ordering, to keep v1 simple.
- **No dish tagged for a meal** (e.g. user deleted all dinner dishes): that slot shows empty with a prompt to add a dish; the day's total is computed from the remaining picks.
- **Same dish in multiple meals**: allowed across days, but never twice in the same day.
- **Deleting a dish that is in today's unlocked picks**: the pick is dropped on next render; history rows already locked keep the id (detail link may 404, handled gracefully with a "dish removed" state).

## 12. Testing

Unit tests (pure logic):
- `pickForMeal`: respects exclusions; relaxes when pool empty; returns null when no dish for the meal.
- `generateMenu`: returns a goal-meeting combo when one exists; returns best-effort with `metGoal:false` after the cap when none exists; never repeats a dish within one day; caps at 50 attempts.
- Last-7-days computation from history.

React components: lighter coverage; manual verification in the browser (only when explicitly requested).

## 13. Future work

Accounts and multi-device sync (swap the storage layer for an API), grocery list, serving scaling, food images, dietary/allergen filters, broader macros. The storage interface and pure-logic separation are designed to make these additive, not rewrites.
