import { describe, it, expect } from "vitest";
import { HistoryEntry } from "../types";
import { usedInLast7Days, todayIso } from "../history";

const today = new Date("2026-05-24T12:00:00");

const history: HistoryEntry[] = [
  { date: "2026-05-24", picks: { breakfast: "idli", lunch: "sambar-rice" } },
  { date: "2026-05-20", picks: { dinner: "dosa" } },       // within 7 days
  { date: "2026-05-16", picks: { breakfast: "pongal" } },  // older than 7 days
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
