"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/components/StoreProvider";
import { DishForm } from "@/components/DishForm";
import { DishImage } from "@/components/DishImage";
import Link from "next/link";

function DishDetailInner() {
  const id = useSearchParams().get("id") ?? "";
  const { ready, dishes, saveDish } = useStore();
  const [editing, setEditing] = useState(false);

  if (!ready) return <p className="text-stone-500">Loading...</p>;

  const dish = dishes.find((d) => d.id === id);
  if (!dish) {
    return (
      <div className="space-y-2">
        <p className="text-stone-600">This dish was removed.</p>
        <Link href="/library" className="text-terracotta">Back to Library</Link>
      </div>
    );
  }

  if (editing) {
    return <DishForm initial={dish} onSave={(d) => { saveDish(d); setEditing(false); }} onCancel={() => setEditing(false)} />;
  }

  return (
    <article className="space-y-6">
      <DishImage name={dish.name} url={dish.imageUrl} className="h-64 w-full rounded-3xl border border-stone-200" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold leading-tight">{dish.name}</h1>
          {dish.nameTamil && <p className="mt-1 text-stone-500">{dish.nameTamil}</p>}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-stone-100 px-3 py-1 capitalize text-stone-600">{dish.category}</span>
            {dish.meals.map((m) => (
              <span key={m} className="rounded-full bg-stone-100 px-3 py-1 capitalize text-stone-600">{m}</span>
            ))}
            <span className="rounded-full bg-orange-100 px-3 py-1 font-medium text-terracotta">~{dish.proteinGrams}g protein</span>
          </div>
        </div>
        <button onClick={() => setEditing(true)} className="shrink-0 rounded-full border border-stone-200 px-4 py-1.5 text-sm font-medium hover:bg-stone-50">
          Edit
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        <section className="md:col-span-2 rounded-3xl border border-stone-200 bg-white p-5">
          <h2 className="mb-3 font-display text-xl font-semibold">Ingredients</h2>
          <ul className="space-y-2 text-sm">
            {dish.ingredients.map((ing, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta" />
                <span>{ing}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="md:col-span-3 rounded-3xl border border-stone-200 bg-white p-5">
          <h2 className="mb-3 font-display text-xl font-semibold">Method</h2>
          <ol className="space-y-4">
            {dish.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange-100 font-display text-sm font-semibold text-terracotta">{i + 1}</span>
                <span className="text-sm leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <a href={dish.youtubeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-red-700">
          ▶ Watch on YouTube
        </a>
        <span className="text-xs text-stone-400">Protein value is an estimate.</span>
      </div>
    </article>
  );
}

export default function DishDetailPage() {
  return (
    <Suspense fallback={<p className="text-stone-500">Loading...</p>}>
      <DishDetailInner />
    </Suspense>
  );
}
