import { describe, it, expect } from "vitest";
import { SEED_DISHES } from "../seed";
import { generateMenu, planIds, poolOf } from "../selection";
import { MEALS } from "../types";

describe("seed produces real plates", () => {
  it("has non-empty pools for every needed category/meal", () => {
    expect(poolOf(SEED_DISHES, "tiffin", "breakfast").length).toBeGreaterThan(0);
    expect(poolOf(SEED_DISHES, "chutney", "breakfast").length).toBeGreaterThan(0);
    expect(poolOf(SEED_DISHES, "rice", "lunch").length).toBeGreaterThan(0);
    expect(poolOf(SEED_DISHES, "kuzhambu", "lunch").length).toBeGreaterThan(0);
    expect(poolOf(SEED_DISHES, "poriyal", "lunch").length).toBeGreaterThan(0);
    expect(poolOf(SEED_DISHES, "rasam", "lunch").length).toBeGreaterThan(0);
    expect(poolOf(SEED_DISHES, "curd", "lunch").length).toBeGreaterThan(0);
    const dinnerHeroes = poolOf(SEED_DISHES, "tiffin", "dinner").length + poolOf(SEED_DISHES, "onepot", "dinner").length;
    expect(dinnerHeroes).toBeGreaterThan(0);
  });

  it("generateMenu fills every meal with at least one item", () => {
    const res = generateMenu(SEED_DISHES, new Set(), 60);
    for (const m of MEALS) {
      expect(res.plan[m]).not.toBeNull();
      expect(res.plan[m]!.items.length).toBeGreaterThan(0);
    }
    expect(planIds(res.plan).length).toBeGreaterThan(3);
  });
});
