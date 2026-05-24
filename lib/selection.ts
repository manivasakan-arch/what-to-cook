import { Dish, Meal, MEALS, Category, ComboItem, MealCombo, DayPlan } from "./types";

const MAX_ATTEMPTS = 50;

function inMeal(d: Dish, meal: Meal): boolean {
  return d.meals.includes(meal);
}

export function poolOf(dishes: Dish[], category: Category, meal: Meal): Dish[] {
  return dishes.filter((d) => d.category === category && inMeal(d, meal));
}

/**
 * Pick a random dish from candidates.
 * softExcludedIds (last-7 window) are dropped first, relaxed if that empties the pool.
 * hardExcludedIds (already used today) are never relaxed.
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
  if (pool.length === 0) pool = eligible;
  return pool[Math.floor(rng() * pool.length)];
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function pickAccompaniment(
  dishes: Dish[],
  hero: Dish,
  cats: Category[],
  meal: Meal,
  soft: Set<string>,
  hard: Set<string>,
  rng: () => number
): Dish | null {
  if (hero.pairs) {
    for (const id of hero.pairs) {
      const d = dishes.find((x) => x.id === id && cats.includes(x.category) && !hard.has(x.id));
      if (d) return d;
    }
  }
  const candidates = dishes.filter((d) => cats.includes(d.category) && inMeal(d, meal));
  return pickFrom(candidates, soft, hard, rng);
}

function push(items: ComboItem[], role: string, dish: Dish | null, hard: Set<string>): void {
  if (dish) {
    items.push({ role, dish });
    hard.add(dish.id);
  }
}

export function composeBreakfast(dishes: Dish[], soft: Set<string>, hard: Set<string>, rng: () => number = Math.random): MealCombo {
  const items: ComboItem[] = [];
  const tiffin = pickFrom(poolOf(dishes, "tiffin", "breakfast"), soft, hard, rng);
  push(items, "Main", tiffin, hard);
  if (tiffin) {
    const acc = pickAccompaniment(dishes, tiffin, ["chutney", "sambar"], "breakfast", soft, hard, rng);
    push(items, acc ? cap(acc.category) : "Side", acc, hard);
  }
  return { meal: "breakfast", items };
}

export function composeLunch(dishes: Dish[], soft: Set<string>, hard: Set<string>, rng: () => number = Math.random): MealCombo {
  const items: ComboItem[] = [];
  const heroPool = [...poolOf(dishes, "kuzhambu", "lunch"), ...poolOf(dishes, "onepot", "lunch")];
  const hero = pickFrom(heroPool, soft, hard, rng);
  if (hero && hero.category === "onepot") {
    push(items, "Main", hero, hard);
    push(items, "Poriyal", pickFrom(poolOf(dishes, "poriyal", "lunch"), soft, hard, rng), hard);
    push(items, "Curd", pickFrom(poolOf(dishes, "curd", "lunch"), soft, hard, rng), hard);
  } else {
    push(items, "Rice", pickFrom(poolOf(dishes, "rice", "lunch"), soft, hard, rng), hard);
    push(items, "Kuzhambu", hero, hard);
    push(items, "Poriyal", pickFrom(poolOf(dishes, "poriyal", "lunch"), soft, hard, rng), hard);
    push(items, "Rasam", pickFrom(poolOf(dishes, "rasam", "lunch"), soft, hard, rng), hard);
    push(items, "Curd", pickFrom(poolOf(dishes, "curd", "lunch"), soft, hard, rng), hard);
  }
  return { meal: "lunch", items };
}

export function composeDinner(dishes: Dish[], soft: Set<string>, hard: Set<string>, rng: () => number = Math.random): MealCombo {
  const items: ComboItem[] = [];
  const heroPool = [...poolOf(dishes, "tiffin", "dinner"), ...poolOf(dishes, "onepot", "dinner")];
  const hero = pickFrom(heroPool, soft, hard, rng);
  if (hero && hero.category === "tiffin") {
    push(items, "Main", hero, hard);
    const acc = pickAccompaniment(dishes, hero, ["chutney", "sambar"], "dinner", soft, hard, rng);
    push(items, acc ? cap(acc.category) : "Side", acc, hard);
  } else if (hero) {
    push(items, "Main", hero, hard);
    push(items, "Curd", pickFrom(poolOf(dishes, "curd", "dinner"), soft, hard, rng), hard);
  }
  return { meal: "dinner", items };
}

export function comboProtein(combo: MealCombo | null): number {
  return combo ? combo.items.reduce((s, i) => s + i.dish.proteinGrams, 0) : 0;
}

export function planProtein(plan: DayPlan): number {
  return MEALS.reduce((s, m) => s + comboProtein(plan[m]), 0);
}

export interface MenuResult {
  plan: DayPlan;
  total: number;
  metGoal: boolean;
  attempts: number;
}

const COMPOSERS: Record<Meal, (d: Dish[], soft: Set<string>, hard: Set<string>, rng: () => number) => MealCombo> = {
  breakfast: composeBreakfast,
  lunch: composeLunch,
  dinner: composeDinner,
};

export function generateMenu(
  dishes: Dish[],
  usedLast7: Set<string>,
  goalGrams: number,
  rng: () => number = Math.random
): MenuResult {
  let best: { plan: DayPlan; total: number } | null = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const hard = new Set<string>();
    const plan: DayPlan = {
      breakfast: composeBreakfast(dishes, usedLast7, hard, rng),
      lunch: composeLunch(dishes, usedLast7, hard, rng),
      dinner: composeDinner(dishes, usedLast7, hard, rng),
    };
    const total = planProtein(plan);
    if (best === null || total > best.total) best = { plan, total };
    if (total >= goalGrams) return { plan, total, metGoal: true, attempts: attempt };
  }
  return { plan: best!.plan, total: best!.total, metGoal: false, attempts: MAX_ATTEMPTS };
}

export function respinCombo(
  dishes: Dish[],
  meal: Meal,
  usedLast7: Set<string>,
  current: DayPlan,
  rng: () => number = Math.random
): MealCombo {
  const hard = new Set<string>();
  for (const m of MEALS) {
    if (m !== meal && current[m]) current[m]!.items.forEach((i) => hard.add(i.dish.id));
  }
  return COMPOSERS[meal](dishes, usedLast7, hard, rng);
}

export function planIds(plan: DayPlan): string[] {
  const ids: string[] = [];
  for (const m of MEALS) {
    if (plan[m]) plan[m]!.items.forEach((i) => ids.push(i.dish.id));
  }
  return ids;
}
