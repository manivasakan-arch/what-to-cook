"use client";
import { useState } from "react";
import { useStore } from "@/components/StoreProvider";
import { generateMenu, respinCombo, planProtein, planIds } from "@/lib/selection";
import { usedInLast7Days, todayIso } from "@/lib/history";
import { DayPlan, Meal, MEALS } from "@/lib/types";
import { ProteinRing } from "@/components/ProteinRing";
import { MealComboCard } from "@/components/MealComboCard";

function prettyDate(): string {
  return new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

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
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-orange-200/60 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 px-6 py-12 text-center text-white shadow-lg">
        <p className="text-sm font-medium uppercase tracking-widest text-orange-50/90">{prettyDate()}</p>
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight">What shall we cook today?</h1>
        <p className="mx-auto mt-2 max-w-md text-orange-50">A full Tamil breakfast, lunch thali and dinner, picked for you.</p>
        <button
          onClick={spin}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-9 py-4 text-xl font-semibold text-terracotta shadow-xl ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-2xl active:translate-y-0"
        >
          <span className="text-2xl">🎲</span> {plan ? "Spin again" : "Spin my menu"}
        </button>
      </section>

      {plan && <ProteinRing total={planProtein(plan)} goal={settings.proteinGoalGrams} />}

      {plan && (
        <div className="grid gap-5 md:grid-cols-3">
          {MEALS.map((m) => plan[m] && <MealComboCard key={m} combo={plan[m]!} onRespin={() => respin(m)} />)}
        </div>
      )}

      {plan && (
        <button
          onClick={lock}
          disabled={locked}
          className="w-full rounded-2xl border border-stone-200 bg-white py-4 text-lg font-semibold text-ink shadow-sm transition hover:bg-stone-50 disabled:opacity-60"
        >
          {locked ? "✓ Today's menu is locked" : "Lock today's menu"}
        </button>
      )}

      {!plan && (
        <p className="text-center font-display text-lg text-stone-500">Tap the dice to plan your day.</p>
      )}
    </div>
  );
}
