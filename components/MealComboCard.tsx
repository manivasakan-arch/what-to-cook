"use client";
import Link from "next/link";
import { MealCombo, Meal } from "@/lib/types";
import { comboProtein } from "@/lib/selection";
import { DishImage } from "@/components/DishImage";

const LABELS: Record<Meal, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };

export function MealComboCard({ combo, onRespin }: { combo: MealCombo; onRespin: () => void }) {
  const hero = combo.items[0]?.dish;
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative">
        {hero ? (
          <Link href={`/dish?id=${hero.id}`} className="block">
            <DishImage name={hero.name} url={hero.imageUrl} className="h-44 w-full" />
          </Link>
        ) : (
          <div className="grid h-44 w-full place-items-center bg-stone-100 text-stone-400">No dishes</div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-terracotta shadow-sm backdrop-blur">
          {LABELS[combo.meal]}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
          ~{comboProtein(combo)}g protein
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">{LABELS[combo.meal]} plate</h2>
          <button
            onClick={onRespin}
            className="rounded-full border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-600 transition hover:bg-stone-50"
            aria-label={`Re-spin ${LABELS[combo.meal]}`}
          >
            🎲 Re-spin
          </button>
        </div>

        {combo.items.length === 0 ? (
          <p className="text-sm text-stone-400">No dishes available. Add some in the Library.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {combo.items.map((item) => (
              <li key={item.dish.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{item.role}</p>
                  <Link href={`/dish?id=${item.dish.id}`} className="block truncate font-medium hover:text-terracotta">
                    {item.dish.name}
                  </Link>
                </div>
                <span className="shrink-0 text-xs text-stone-400">~{item.dish.proteinGrams}g</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
