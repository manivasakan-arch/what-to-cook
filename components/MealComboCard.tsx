"use client";
import Link from "next/link";
import { MealCombo, Meal } from "@/lib/types";
import { comboProtein } from "@/lib/selection";
import { DishImage } from "@/components/DishImage";

const LABELS: Record<Meal, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };

export function MealComboCard({ combo, onRespin }: { combo: MealCombo; onRespin: () => void }) {
  const hero = combo.items[0]?.dish;
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md">
      {hero ? (
        <Link href={`/dish/${hero.id}`} className="block">
          <DishImage name={hero.name} url={hero.imageUrl} className="h-44 w-full" />
        </Link>
      ) : (
        <div className="flex h-44 w-full items-center justify-center bg-stone-100 text-stone-400">No dishes</div>
      )}
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-orange-600">{LABELS[combo.meal]}</span>
            <span className="ml-2 text-xs text-stone-500">~{comboProtein(combo)}g protein</span>
          </div>
          <button onClick={onRespin} className="rounded-full border px-2 py-1 text-xs hover:bg-stone-100" aria-label={`Re-spin ${LABELS[combo.meal]}`}>
            🎲 Re-spin
          </button>
        </div>
        {combo.items.length === 0 ? (
          <p className="text-sm text-stone-400">No dishes available. Add some in the Library.</p>
        ) : (
          <ul className="divide-y">
            {combo.items.map((item) => (
              <li key={item.dish.id} className="flex items-baseline justify-between py-1.5">
                <span>
                  <span className="mr-2 inline-block w-20 text-xs font-medium uppercase tracking-wide text-stone-400">{item.role}</span>
                  <Link href={`/dish/${item.dish.id}`} className="font-medium hover:text-orange-600">{item.dish.name}</Link>
                </span>
                <span className="text-xs text-stone-500">~{item.dish.proteinGrams}g</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
