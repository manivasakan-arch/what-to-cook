"use client";
import { useState } from "react";
import { useStore } from "@/components/StoreProvider";
import { generateMenu, respinSlot, proteinTotal } from "@/lib/selection";
import { usedInLast7Days, todayIso } from "@/lib/history";
import { DayPicks, SlotKey, SLOTS } from "@/lib/types";
import { ProteinRing } from "@/components/ProteinRing";
import { MealCard } from "@/components/MealCard";

const EMPTY: DayPicks = { breakfast: null, lunch: null, lunchSide: null, dinner: null };
const SLOT_LABELS: Record<SlotKey, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch (main)",
  lunchSide: "Lunch poriyal",
  dinner: "Dinner",
};

export default function Home() {
  const { ready, dishes, settings, history, lockMenu } = useStore();
  const [picks, setPicks] = useState<DayPicks>(EMPTY);
  const [locked, setLocked] = useState(false);
  const [spun, setSpun] = useState(false);

  if (!ready) return <p className="text-stone-500">Loading...</p>;

  const used = usedInLast7Days(history, new Date());

  function spin() {
    const r = generateMenu(dishes, used, settings.proteinGoalGrams);
    setPicks(r.picks);
    setLocked(false);
    setSpun(true);
  }

  function respin(slot: SlotKey) {
    setPicks((prev) => ({ ...prev, [slot]: respinSlot(dishes, slot, used, prev) }));
    setLocked(false);
  }

  function lock() {
    lockMenu({
      date: todayIso(new Date()),
      picks: {
        breakfast: picks.breakfast?.id,
        lunch: picks.lunch?.id,
        lunchSide: picks.lunchSide?.id,
        dinner: picks.dinner?.id,
      },
    });
    setLocked(true);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 p-8 text-center text-white shadow">
        <h1 className="text-3xl font-extrabold tracking-tight">What to Cook today?</h1>
        <p className="mt-1 text-orange-50">Spin for a Tamil breakfast, lunch (with poriyal) and dinner.</p>
        <button
          onClick={spin}
          className="mt-5 rounded-full bg-white px-10 py-5 text-2xl font-extrabold text-orange-600 shadow-lg transition hover:scale-105 active:scale-95"
        >
          🎲 {spun ? "Spin again" : "Spin the menu"}
        </button>
      </section>

      {spun && <ProteinRing total={proteinTotal(picks)} goal={settings.proteinGoalGrams} />}

      {spun && (
        <div className="grid gap-4 sm:grid-cols-2">
          {SLOTS.map((slot) => (
            <MealCard key={slot} label={SLOT_LABELS[slot]} dish={picks[slot]} onRespin={() => respin(slot)} />
          ))}
        </div>
      )}

      {spun && (
        <button onClick={lock} disabled={locked} className="w-full rounded-2xl border bg-white py-4 text-lg font-semibold hover:bg-stone-100 disabled:opacity-50">
          {locked ? "✓ Menu locked for today" : "Lock today's menu"}
        </button>
      )}

      {!spun && (
        <p className="text-center text-stone-500">Tap the button to plan today&apos;s meals.</p>
      )}
    </div>
  );
}
