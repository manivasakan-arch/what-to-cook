"use client";
import { useState } from "react";
import { useStore } from "@/components/StoreProvider";
import { generateMenu, respinCombo, planProtein, planIds } from "@/lib/selection";
import { usedInLast7Days, todayIso } from "@/lib/history";
import { DayPlan, Meal, MEALS } from "@/lib/types";
import { ProteinRing } from "@/components/ProteinRing";
import { MealComboCard } from "@/components/MealComboCard";

export default function Home() {
  const { ready, dishes, settings, history, lockMenu } = useStore();
  const [plan, setPlan] = useState<DayPlan | null>(null);
  const [locked, setLocked] = useState(false);

  if (!ready) return <p className="text-stone-500">Loading...</p>;

  const used = usedInLast7Days(history, new Date());

  function spin() {
    setPlan(generateMenu(dishes, used, settings.proteinGoalGrams).plan);
    setLocked(false);
  }

  function respin(meal: Meal) {
    setPlan((prev) => (prev ? { ...prev, [meal]: respinCombo(dishes, meal, used, prev) } : prev));
    setLocked(false);
  }

  function lock() {
    if (!plan) return;
    lockMenu({ date: todayIso(new Date()), ids: planIds(plan) });
    setLocked(true);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 p-8 text-center text-white shadow">
        <h1 className="text-3xl font-extrabold tracking-tight">What to Cook today?</h1>
        <p className="mt-1 text-orange-50">Spin for a full Tamil breakfast, lunch thali and dinner.</p>
        <button
          onClick={spin}
          className="mt-5 rounded-full bg-white px-10 py-5 text-2xl font-extrabold text-orange-600 shadow-lg transition hover:scale-105 active:scale-95"
        >
          🎲 {plan ? "Spin again" : "Spin the menu"}
        </button>
      </section>

      {plan && <ProteinRing total={planProtein(plan)} goal={settings.proteinGoalGrams} />}

      {plan && (
        <div className="grid gap-4 md:grid-cols-3">
          {MEALS.map((m) => plan[m] && <MealComboCard key={m} combo={plan[m]!} onRespin={() => respin(m)} />)}
        </div>
      )}

      {plan && (
        <button onClick={lock} disabled={locked} className="w-full rounded-2xl border bg-white py-4 text-lg font-semibold hover:bg-stone-100 disabled:opacity-50">
          {locked ? "✓ Menu locked for today" : "Lock today's menu"}
        </button>
      )}

      {!plan && <p className="text-center text-stone-500">Tap the button to plan today&apos;s meals.</p>}
    </div>
  );
}
