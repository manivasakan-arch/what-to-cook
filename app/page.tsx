"use client";
import { useState } from "react";
import { useStore } from "@/components/StoreProvider";
import { generateMenu, respinMeal, proteinTotal, MenuResult } from "@/lib/selection";
import { usedInLast7Days, todayIso } from "@/lib/history";
import { MealPicks, Meal, MEALS } from "@/lib/types";
import { ProteinRing } from "@/components/ProteinRing";
import { MealCard } from "@/components/MealCard";

const EMPTY: MealPicks = { breakfast: null, lunch: null, dinner: null };

export default function Home() {
  const { ready, dishes, settings, history, lockMenu } = useStore();
  const [picks, setPicks] = useState<MealPicks>(EMPTY);
  const [, setResult] = useState<MenuResult | null>(null);
  const [locked, setLocked] = useState(false);

  if (!ready) return <p className="text-stone-500">Loading...</p>;

  const used = usedInLast7Days(history, new Date());

  function spin() {
    const r = generateMenu(dishes, used, settings.proteinGoalGrams);
    setPicks(r.picks);
    setResult(r);
    setLocked(false);
  }

  function respin(meal: Meal) {
    const next = respinMeal(dishes, meal, used, picks);
    const updated = { ...picks, [meal]: next };
    setPicks(updated);
    setLocked(false);
  }

  function lock() {
    lockMenu({
      date: todayIso(new Date()),
      picks: {
        breakfast: picks.breakfast?.id,
        lunch: picks.lunch?.id,
        dinner: picks.dinner?.id,
      },
    });
    setLocked(true);
  }

  const hasPicks = MEALS.some((m) => picks[m] !== null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Today&apos;s menu</h1>
        <button onClick={spin} className="rounded-full bg-orange-600 px-6 py-2 font-semibold text-white hover:bg-orange-700">
          Spin
        </button>
      </div>

      {hasPicks && <ProteinRing total={proteinTotal(picks)} goal={settings.proteinGoalGrams} />}

      <div className="grid gap-3">
        {MEALS.map((m) => (
          <MealCard key={m} meal={m} dish={picks[m]} onRespin={() => respin(m)} />
        ))}
      </div>

      {hasPicks && (
        <button onClick={lock} disabled={locked} className="w-full rounded-xl border bg-white py-3 font-semibold hover:bg-stone-100 disabled:opacity-50">
          {locked ? "Menu locked for today" : "Lock today's menu"}
        </button>
      )}

      {!hasPicks && <p className="text-stone-500">Tap Spin to get today&apos;s breakfast, lunch and dinner.</p>}
    </div>
  );
}
