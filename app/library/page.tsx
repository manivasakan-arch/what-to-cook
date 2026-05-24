"use client";
import { useState } from "react";
import { useStore } from "@/components/StoreProvider";
import { Dish, Meal, MEALS } from "@/lib/types";
import { DishForm } from "@/components/DishForm";
import { DishImage } from "@/components/DishImage";
import Link from "next/link";

type Filter = "all" | Meal;
const FILTERS: Filter[] = ["all", ...MEALS];

export default function Library() {
  const { ready, dishes, saveDish, deleteDish } = useStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Dish | null>(null);
  const [adding, setAdding] = useState(false);

  if (!ready) return <p className="text-stone-500">Loading...</p>;

  const visible = dishes.filter((d) => {
    const mealOk = filter === "all" || d.meals.includes(filter);
    const q = query.trim().toLowerCase();
    const queryOk = !q || d.name.toLowerCase().includes(q) || (d.nameTamil ?? "").includes(query.trim());
    return mealOk && queryOk;
  });

  function handleSave(dish: Dish) {
    saveDish(dish);
    setEditing(null);
    setAdding(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">Library</h1>
        <button onClick={() => { setAdding(true); setEditing(null); }} className="rounded-full bg-terracotta px-5 py-2 font-semibold text-white shadow-sm transition hover:opacity-90">
          + Add dish
        </button>
      </div>

      {(adding || editing) && (
        <DishForm initial={editing ?? undefined} onSave={handleSave} onCancel={() => { setAdding(false); setEditing(null); }} />
      )}

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-4 py-1.5 text-sm capitalize transition ${filter === f ? "border-terracotta bg-terracotta text-white" : "border-stone-200 bg-white hover:bg-stone-50"}`}
          >
            {f}
          </button>
        ))}
        <input
          className="ml-auto rounded-full border border-stone-200 bg-white px-4 py-1.5 text-sm outline-none focus:border-terracotta"
          placeholder="Search dishes"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <p className="text-sm text-stone-500">{visible.length} dishes</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((d) => (
          <div key={d.id} className="flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md">
            <Link href={`/dish/${d.id}`} className="block">
              <DishImage name={d.name} url={d.imageUrl} className="h-36 w-full" />
            </Link>
            <div className="flex flex-1 flex-col p-4">
              <Link href={`/dish/${d.id}`} className="font-display text-lg font-semibold leading-tight hover:text-terracotta">{d.name}</Link>
              {d.nameTamil && <p className="text-sm text-stone-500">{d.nameTamil}</p>}
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                <span className="rounded-full bg-stone-100 px-2 py-0.5 capitalize text-stone-600">{d.category}</span>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 font-medium text-terracotta">~{d.proteinGrams}g</span>
              </div>
              <div className="mt-3 flex gap-2 text-sm">
                <button onClick={() => { setEditing(d); setAdding(false); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="rounded-full border border-stone-200 px-3 py-1 hover:bg-stone-50">Edit</button>
                <button onClick={() => deleteDish(d.id)} className="rounded-full border border-stone-200 px-3 py-1 text-red-600 hover:bg-red-50">Remove</button>
              </div>
            </div>
          </div>
        ))}
        {visible.length === 0 && <p className="text-stone-500">No dishes match.</p>}
      </div>
    </div>
  );
}
