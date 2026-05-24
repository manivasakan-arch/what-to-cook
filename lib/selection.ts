import { Dish, Meal, DayPicks, SlotKey, SLOTS } from "./types";

const MAX_ATTEMPTS = 50;

export function isSide(d: Dish): boolean {
  return d.kind === "side";
}

export function mainsForMeal(dishes: Dish[], meal: Meal): Dish[] {
  return dishes.filter((d) => d.meals.includes(meal) && !isSide(d));
}

export function sidesForMeal(dishes: Dish[], meal: Meal): Dish[] {
  return dishes.filter((d) => d.meals.includes(meal) && isSide(d));
}

/** Candidate dishes for a given day slot. */
export function candidatesForSlot(dishes: Dish[], slot: SlotKey): Dish[] {
  switch (slot) {
    case "breakfast": return mainsForMeal(dishes, "breakfast");
    case "lunch": return mainsForMeal(dishes, "lunch");
    case "lunchSide": return sidesForMeal(dishes, "lunch");
    case "dinner": return mainsForMeal(dishes, "dinner");
  }
}

/**
 * Pick a random dish from candidates.
 * softExcludedIds (last-7 window) are dropped first, relaxed if that empties the pool.
 * hardExcludedIds (same-day picks) are never relaxed.
 */
export function pickFrom(
  candidates: Dish[],
  softExcludedIds: Set<string>,
  hardExcludedIds: Set<string>,
  rng: () => number = Math.random
): Dish | null {
  const eligible = candidates.filter((d) => !hardExcludedIds.has(d.id));
  if (eligible.length === 0) return null;
  let pool = eligible.filter((d) => !softExcludedIds.has(d.id));
  if (pool.length === 0) pool = eligible; // relax the 7-day window
  const idx = Math.floor(rng() * pool.length);
  return pool[idx];
}

export function proteinTotal(picks: DayPicks): number {
  return SLOTS.reduce((sum, slot) => sum + (picks[slot]?.proteinGrams ?? 0), 0);
}

export interface MenuResult {
  picks: DayPicks;
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
  let best: { picks: DayPicks; total: number } | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const picks: DayPicks = { breakfast: null, lunch: null, lunchSide: null, dinner: null };
    const sameDay = new Set<string>();
    for (const slot of SLOTS) {
      const pick = pickFrom(candidatesForSlot(dishes, slot), usedLast7, sameDay, rng);
      picks[slot] = pick;
      if (pick) sameDay.add(pick.id);
    }
    const total = proteinTotal(picks);
    if (best === null || total > best.total) best = { picks, total };
    if (total >= goalGrams) return { picks, total, metGoal: true, attempts: attempt };
  }

  return { picks: best!.picks, total: best!.total, metGoal: false, attempts: MAX_ATTEMPTS };
}

export function respinSlot(
  dishes: Dish[],
  slot: SlotKey,
  usedLast7: Set<string>,
  current: DayPicks,
  rng: () => number = Math.random
): Dish | null {
  const hard = new Set<string>();
  for (const k of SLOTS) {
    if (k !== slot && current[k]) hard.add(current[k]!.id);
  }
  return pickFrom(candidatesForSlot(dishes, slot), usedLast7, hard, rng);
}
