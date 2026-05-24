import { describe, it, expect } from "vitest";
import { Dish, DayPicks, DishKind, Meal } from "../types";
import {
  mainsForMeal,
  sidesForMeal,
  pickFrom,
  proteinTotal,
  generateMenu,
  respinSlot,
} from "../selection";

function dish(id: string, meals: Meal[], kind: DishKind, protein: number): Dish {
  return {
    id, name: id, meals, kind, ingredients: [], steps: [],
    proteinGrams: protein, youtubeUrl: "", isCustom: false,
  };
}

// rng that returns 0 always picks the first pool element
const first = () => 0;

const data: Dish[] = [
  dish("idli", ["breakfast", "dinner"], "main", 6),
  dish("pongal", ["breakfast"], "main", 8),
  dish("sambar-rice", ["lunch"], "main", 12),
  dish("curd-rice", ["lunch", "dinner"], "main", 9),
  dish("dosa", ["breakfast", "dinner"], "main", 7),
  dish("beans-poriyal", ["lunch"], "side", 5),
  dish("carrot-poriyal", ["lunch"], "side", 4),
];

describe("mainsForMeal / sidesForMeal", () => {
  it("mains excludes sides", () => {
    expect(mainsForMeal(data, "lunch").map((d) => d.id)).toEqual(["sambar-rice", "curd-rice"]);
  });
  it("sides returns only side-kind dishes for the meal", () => {
    expect(sidesForMeal(data, "lunch").map((d) => d.id)).toEqual(["beans-poriyal", "carrot-poriyal"]);
  });
});

describe("pickFrom", () => {
  const breakfast = mainsForMeal(data, "breakfast");
  it("excludes soft-excluded ids", () => {
    expect(pickFrom(breakfast, new Set(["idli"]), new Set(), first)?.id).toBe("pongal");
  });
  it("relaxes soft exclusions when pool would be empty", () => {
    expect(pickFrom(breakfast, new Set(["idli", "pongal", "dosa"]), new Set(), first)?.id).toBe("idli");
  });
  it("never returns a hard-excluded dish even when relaxing", () => {
    expect(pickFrom(breakfast, new Set(["idli", "pongal", "dosa"]), new Set(["idli"]), first)?.id).toBe("pongal");
  });
  it("returns null when no candidates", () => {
    expect(pickFrom([], new Set(), new Set(), first)).toBeNull();
  });
});

describe("proteinTotal", () => {
  it("sums protein over all four slots, ignoring nulls", () => {
    const picks: DayPicks = { breakfast: data[0], lunch: data[2], lunchSide: data[5], dinner: null };
    expect(proteinTotal(picks)).toBe(6 + 12 + 5);
  });
});

describe("generateMenu", () => {
  it("fills a lunch poriyal side", () => {
    const res = generateMenu(data, new Set(), 0, first);
    expect(res.picks.lunchSide?.kind).toBe("side");
  });

  it("never picks the same dish twice in one day", () => {
    const res = generateMenu(data, new Set(), 1000, first);
    const ids = [res.picks.breakfast?.id, res.picks.lunch?.id, res.picks.lunchSide?.id, res.picks.dinner?.id].filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);
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

describe("respinSlot", () => {
  it("avoids the other slots' current picks", () => {
    const picks: DayPicks = { breakfast: data[0], lunch: data[2], lunchSide: data[5], dinner: data[4] };
    const pick = respinSlot(data, "dinner", new Set(), picks, first);
    // dinner mains = [idli, curd-rice, dosa]; idli + dosa held by other slots are not, only idli(breakfast) and dosa(dinner current) excluded
    expect(pick?.id).not.toBe(picks.breakfast?.id);
    expect(["curd-rice", "dosa", "idli"]).toContain(pick?.id);
  });
});
