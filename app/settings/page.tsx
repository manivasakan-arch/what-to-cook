"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/components/StoreProvider";

export default function Settings() {
  const { ready, settings, saveSettings, resetHistory } = useStore();
  const [goal, setGoal] = useState("60");

  useEffect(() => { if (ready) setGoal(String(settings.proteinGoalGrams)); }, [ready, settings.proteinGoalGrams]);

  if (!ready) return <p className="text-stone-500">Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="space-y-2 rounded-xl border bg-white p-4">
        <label className="block font-semibold">Daily protein goal (grams)</label>
        <div className="flex items-center gap-2">
          <input className="w-32 rounded-lg border px-3 py-2" type="number" min={0} value={goal} onChange={(e) => setGoal(e.target.value)} />
          <button onClick={() => saveSettings({ proteinGoalGrams: Number(goal) || 0 })} className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700">Save</button>
        </div>
        <p className="text-xs text-stone-400">Protein values across the app are estimates.</p>
      </div>

      <div className="space-y-2 rounded-xl border bg-white p-4">
        <label className="block font-semibold">No-repeat history</label>
        <p className="text-sm text-stone-600">Clears the 7-day window so all dishes become eligible again.</p>
        <button onClick={resetHistory} className="rounded-lg border px-4 py-2 text-red-600 hover:bg-red-50">Reset history</button>
      </div>
    </div>
  );
}
