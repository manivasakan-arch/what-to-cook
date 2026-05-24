"use client";
import { use, useState } from "react";
import { useStore } from "@/components/StoreProvider";
import { DishForm } from "@/components/DishForm";
import { DishImage } from "@/components/DishImage";
import Link from "next/link";

export default function DishDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { ready, dishes, saveDish } = useStore();
  const [editing, setEditing] = useState(false);

  if (!ready) return <p className="text-stone-500">Loading...</p>;

  const dish = dishes.find((d) => d.id === id);
  if (!dish) {
    return (
      <div className="space-y-2">
        <p className="text-stone-600">This dish was removed.</p>
        <Link href="/library" className="text-orange-600">Back to Library</Link>
      </div>
    );
  }

  if (editing) {
    return <DishForm initial={dish} onSave={(d) => { saveDish(d); setEditing(false); }} onCancel={() => setEditing(false)} />;
  }

  return (
    <article className="space-y-5">
      <DishImage name={dish.name} url={dish.imageUrl} className="h-56 w-full rounded-2xl" />
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{dish.name}</h1>
          {dish.nameTamil && <p className="text-stone-500">{dish.nameTamil}</p>}
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {dish.meals.map((m) => <span key={m} className="rounded-full bg-stone-200 px-2 py-1 capitalize">{m}</span>)}
            <span className="rounded-full bg-orange-100 px-2 py-1 text-orange-700">~{dish.proteinGrams}g protein</span>
          </div>
        </div>
        <button onClick={() => setEditing(true)} className="rounded-lg border px-3 py-1 text-sm hover:bg-stone-100">Edit</button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-2 font-semibold">Ingredients</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {dish.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
          </ul>
        </section>
        <section>
          <h2 className="mb-2 font-semibold">Method</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {dish.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </section>
      </div>

      <a href={dish.youtubeUrl} target="_blank" rel="noopener noreferrer" className="inline-block rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700">
        Watch on YouTube
      </a>
      <p className="text-xs text-stone-400">Protein value is an estimate.</p>
    </article>
  );
}
