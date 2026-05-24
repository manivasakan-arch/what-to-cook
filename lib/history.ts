import { HistoryEntry } from "./types";

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
      for (const id of entry.ids ?? []) ids.add(id);
    }
  }
  return ids;
}
