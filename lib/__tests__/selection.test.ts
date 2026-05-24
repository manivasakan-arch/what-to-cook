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
    const pick = respinMeal(data, "breakfast", new Set(), picks, first);
    expect(pick?.id).toBe("idli");
    expect(pick?.id).not.toBe("dosa");
  });
});
