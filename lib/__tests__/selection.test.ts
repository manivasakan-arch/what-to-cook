import { describe, it, expect } from "vitest";
import { Dish, Category, Meal, DayPlan } from "../types";
import {
  pickFrom,
  poolOf,
  composeBreakfast,
  composeLunch,
  composeDinner,
  planProtein,
  generateMenu,
  respinCombo,
  planIds,
} from "../selection";

function dish(id: string, meals: Meal[], category: Category, protein: number, pairs?: string[]): Dish {
  return { id, name: id, meals, category, pairs, ingredients: [], steps: [], proteinGrams: protein, youtubeUrl: "", isCustom: false };
}

const first = () => 0;

const data: Dish[] = [
  dish("pongal", ["breakfast"], "tiffin", 9, ["coconut-chutney"]),
  dish("idli", ["breakfast", "dinner"], "tiffin", 6),
  dish("dosa", ["dinner"], "tiffin", 7, ["coconut-chutney"]),
  dish("coconut-chutney", ["breakfast", "dinner"], "chutney", 2),
  dish("tomato-chutney", ["breakfast", "dinner"], "chutney", 2),
  dish("tiffin-sambar", ["breakfast", "dinner"], "sambar", 5),
  dish("steamed-rice", ["lunch"], "rice", 4),
  dish("vatha-kuzhambu", ["lunch"], "kuzhambu", 6),
  dish("mor-kuzhambu", ["lunch"], "kuzhambu", 6),
  dish("veg-biryani", ["lunch"], "onepot", 12),
  dish("fried-rice", ["dinner"], "onepot", 10),
  dish("beans-poriyal", ["lunch"], "poriyal", 5),
  dish("tomato-rasam", ["lunch"], "rasam", 3),
  dish("curd", ["lunch", "dinner"], "curd", 4),
];

describe("poolOf", () => {
  it("filters by category and meal", () => {
    expect(poolOf(data, "kuzhambu", "lunch").map((d) => d.id)).toEqual(["vatha-kuzhambu", "mor-kuzhambu"]);
  });
});

describe("pickFrom", () => {
  const breakfastTiffin = poolOf(data, "tiffin", "breakfast");
  it("relaxes soft exclusions when pool would empty", () => {
    expect(pickFrom(breakfastTiffin, new Set(["pongal", "idli"]), new Set(), first)?.id).toBe("pongal");
  });
  it("never returns a hard-excluded dish", () => {
    expect(pickFrom(breakfastTiffin, new Set(), new Set(["pongal"]), first)?.id).toBe("idli");
  });
});

describe("composeBreakfast", () => {
  it("pairs a tiffin with its signature accompaniment", () => {
    const combo = composeBreakfast(data, new Set(), new Set(), first);
    expect(combo.items.map((i) => i.dish.id)).toEqual(["pongal", "coconut-chutney"]);
    expect(combo.items[0].role).toBe("Main");
    expect(combo.items[1].role).toBe("Chutney");
  });
});

describe("composeLunch", () => {
  it("builds a full thali when the hero is a kuzhambu", () => {
    const combo = composeLunch(data, new Set(), new Set(), first);
    expect(combo.items.map((i) => i.role)).toEqual(["Rice", "Kuzhambu", "Poriyal", "Rasam", "Curd"]);
    expect(combo.items[1].dish.id).toBe("vatha-kuzhambu");
  });

  it("builds a onepot plate when the hero is a onepot", () => {
    // exclude both kuzhambus so the onepot is the only hero left
    const soft = new Set(["vatha-kuzhambu", "mor-kuzhambu"]);
    const combo = composeLunch(data, soft, new Set(), first);
    expect(combo.items.map((i) => i.role)).toEqual(["Main", "Poriyal", "Curd"]);
    expect(combo.items[0].dish.id).toBe("veg-biryani");
  });
});

describe("composeDinner", () => {
  it("pairs a dinner tiffin with an accompaniment", () => {
    const combo = composeDinner(data, new Set(), new Set(), first);
    // dinner tiffin pool = [idli, dosa]; first => idli (no pairs) => random chutney
    expect(combo.items[0].dish.id).toBe("idli");
    expect(["chutney", "sambar"]).toContain(combo.items[1].dish.category);
  });
});

describe("generateMenu", () => {
  it("never uses the same dish twice in a day", () => {
    const res = generateMenu(data, new Set(), 1000, first);
    const ids = planIds(res.plan);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("meets the goal when possible", () => {
    const res = generateMenu(data, new Set(), 30, first);
    expect(res.metGoal).toBe(true);
    expect(res.total).toBeGreaterThanOrEqual(30);
  });

  it("returns best effort and caps at 50 attempts when the goal is impossible", () => {
    const res = generateMenu(data, new Set(), 1000, first);
    expect(res.metGoal).toBe(false);
    expect(res.attempts).toBe(50);
    expect(res.total).toBeGreaterThan(0);
  });
});

describe("respinCombo", () => {
  it("avoids dishes already used in the other meals", () => {
    const plan: DayPlan = generateMenu(data, new Set(), 30, first).plan;
    const otherIds = new Set<string>();
    (["breakfast", "dinner"] as Meal[]).forEach((m) => plan[m]?.items.forEach((i) => otherIds.add(i.dish.id)));
    const newLunch = respinCombo(data, "lunch", new Set(), plan, first);
    newLunch.items.forEach((i) => expect(otherIds.has(i.dish.id)).toBe(false));
  });
});

describe("planProtein", () => {
  it("sums protein across all three combos", () => {
    const res = generateMenu(data, new Set(), 30, first);
    expect(planProtein(res.plan)).toBe(res.total);
  });
});
