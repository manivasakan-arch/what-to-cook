"use client";
import Link from "next/link";
import { Dish } from "@/lib/types";
import { DishImage } from "@/components/DishImage";

export function MealCard({ label, dish, onRespin }: { label: string; dish: Dish | null; onRespin: () => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md">
      {dish ? (
        <Link href={`/dish/${dish.id}`} className="block">
          <DishImage name={dish.name} url={dish.imageUrl} className="h-40 w-full" />
        </Link>
      ) : (
        <div className="flex h-40 w-full items-center justify-center bg-stone-100 text-stone-400">No dish</div>
      )}
      <div className="p-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-orange-600">{label}</span>
          <button onClick={onRespin} className="rounded-full border px-2 py-1 text-xs hover:bg-stone-100" aria-label={`Re-spin ${label}`}>
            🎲 Re-spin
          </button>
        </div>
        {dish ? (
          <Link href={`/dish/${dish.id}`} className="block">
            <p className="text-lg font-semibold leading-tight hover:text-orange-600">{dish.name}</p>
            {dish.nameTamil && <p className="text-sm text-stone-500">{dish.nameTamil}</p>}
            <p className="mt-1 text-sm text-stone-600">~{dish.proteinGrams}g protein</p>
          </Link>
        ) : (
          <p className="text-sm text-stone-400">No dish for this slot. Add one in the Library.</p>
        )}
      </div>
    </div>
  );
}
