"use client";
import Link from "next/link";
import { Dish, Meal } from "@/lib/types";

const LABELS: Record<Meal, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };

export function MealCard({ meal, dish, onRespin }: { meal: Meal; dish: Dish | null; onRespin: () => void }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">{LABELS[meal]}</span>
        <button onClick={onRespin} className="rounded-full border px-2 py-1 text-xs hover:bg-stone-100" aria-label={`Re-spin ${LABELS[meal]}`}>
          Re-spin
        </button>
      </div>
      {dish ? (
        <Link href={`/dish/${dish.id}`} className="block">
          <p className="text-lg font-semibold hover:text-orange-600">{dish.name}</p>
          {dish.nameTamil && <p className="text-sm text-stone-500">{dish.nameTamil}</p>}
          <p className="mt-1 text-sm text-stone-600">~{dish.proteinGrams}g protein</p>
        </Link>
      ) : (
        <p className="text-sm text-stone-400">No dish for this meal. Add one in the Library.</p>
      )}
    </div>
  );
}
