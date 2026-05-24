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
