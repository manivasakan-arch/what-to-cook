"use client";
import { useState } from "react";
import { useStore } from "@/components/StoreProvider";
import { Dish, Meal, MEALS } from "@/lib/types";
import { DishForm } from "@/components/DishForm";
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Library</h1>
        <button onClick={() => { setAdding(true); setEditing(null); }} className="rounded-full bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700">Add dish</button>
      </div>

      {(adding || editing) && (
        <DishForm initial={editing ?? undefined} onSave={handleSave} onCancel={() => { setAdding(false); setEditing(null); }} />
      )}

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-3 py-1 text-sm capitalize ${filter === f ? "bg-stone-900 text-white" : "hover:bg-stone-100"}`}>
            {f}
          </button>
        ))}
        <input className="ml-auto rounded-lg border px-3 py-1 text-sm" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="grid gap-2">
        {visible.map((d) => (
          <div key={d.id} className="flex items-center justify-between rounded-xl border bg-white p-3">
            <div>
              <Link href={`/dish/${d.id}`} className="font-semibold hover:text-orange-600">{d.name}</Link>
              <p className="text-xs text-stone-500">{d.meals.join(", ")} · ~{d.proteinGrams}g</p>
            </div>
            <div className="flex gap-2 text-sm">
              <button onClick={() => { setEditing(d); setAdding(false); }} className="rounded border px-2 py-1 hover:bg-stone-100">Edit</button>
              <button onClick={() => deleteDish(d.id)} className="rounded border px-2 py-1 text-red-600 hover:bg-red-50">Remove</button>
            </div>
          </div>
        ))}
        {visible.length === 0 && <p className="text-stone-500">No dishes match.</p>}
      </div>
    </div>
  );
}
