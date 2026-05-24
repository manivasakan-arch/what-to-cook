"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/components/StoreProvider";

export default function Settings() {
  const { ready, dishes, settings, saveSettings, resetHistory, reseed } = useStore();
  const [goal, setGoal] = useState("60");

  useEffect(() => { if (ready) setGoal(String(settings.proteinGoalGrams)); }, [ready, settings.proteinGoalGrams]);

  if (!ready) return <p className="text-stone-500">Loading...</p>;

  const card = "space-y-2 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm";

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">Settings</h1>

      <div className={card}>
        <label className="block font-display text-lg font-semibold">Daily protein goal</label>
        <p className="text-sm text-stone-500">Spin auto re-rolls to try to meet this total across the day.</p>
        <div className="flex items-center gap-2 pt-1">
          <input
            className="w-28 rounded-full border border-stone-200 px-4 py-2 outline-none focus:border-terracotta"
            type="number" min={0} value={goal} onChange={(e) => setGoal(e.target.value)}
          />
          <span className="text-sm text-stone-500">grams</span>
          <button onClick={() => saveSettings({ proteinGoalGrams: Number(goal) || 0 })} className="ml-2 rounded-full bg-terracotta px-5 py-2 font-semibold text-white transition hover:opacity-90">Save</button>
        </div>
        <p className="text-xs text-stone-400">Protein values across the app are estimates.</p>
      </div>

      <div className={card}>
        <label className="block font-display text-lg font-semibold">No-repeat history</label>
        <p className="text-sm text-stone-500">Clears the 7-day window so all dishes become eligible again.</p>
        <button onClick={resetHistory} className="rounded-full border border-stone-200 px-5 py-2 font-medium text-red-600 transition hover:bg-red-50">Reset history</button>
      </div>

      <div className={card}>
        <label className="block font-display text-lg font-semibold">Starter dishes</label>
        <p className="text-sm text-stone-500">You have {dishes.length} dishes. Reload the built-in set. This replaces the current list, including edits and additions.</p>
        <button
          onClick={() => { if (window.confirm("Replace the dish list with the built-in dishes? Your edits and added dishes will be lost.")) reseed(); }}
          className="rounded-full border border-stone-200 px-5 py-2 font-medium transition hover:bg-stone-50"
        >
          Reload starter dishes
        </button>
      </div>
    </div>
  );
}
