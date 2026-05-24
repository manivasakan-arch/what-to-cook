"use client";
import { useState } from "react";
import { Dish, Meal, MEALS } from "@/lib/types";
import { youtubeSearch } from "@/lib/seed";

const LABELS: Record<Meal, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `dish-${Date.now()}`;
}

export function DishForm({ initial, onSave, onCancel }: { initial?: Dish; onSave: (d: Dish) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [nameTamil, setNameTamil] = useState(initial?.nameTamil ?? "");
  const [meals, setMeals] = useState<Meal[]>(initial?.meals ?? []);
  const [ingredients, setIngredients] = useState((initial?.ingredients ?? []).join("\n"));
  const [steps, setSteps] = useState((initial?.steps ?? []).join("\n"));
  const [protein, setProtein] = useState(String(initial?.proteinGrams ?? 0));
  const [youtubeUrl, setYoutubeUrl] = useState(initial?.youtubeUrl ?? "");

  function toggleMeal(m: Meal) {
    setMeals((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || meals.length === 0) return;
    const dish: Dish = {
      id: initial?.id ?? slugify(name),
      name: name.trim(),
      nameTamil: nameTamil.trim() || undefined,
      meals,
      ingredients: ingredients.split("\n").map((s) => s.trim()).filter(Boolean),
      steps: steps.split("\n").map((s) => s.trim()).filter(Boolean),
      proteinGrams: Number(protein) || 0,
      youtubeUrl: youtubeUrl.trim() || youtubeSearch(name),
      isCustom: initial?.isCustom ?? true,
    };
    onSave(dish);
  }

  const field = "w-full rounded-lg border px-3 py-2";

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border bg-white p-4">
      <input className={field} placeholder="Dish name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className={field} placeholder="Tamil name (optional)" value={nameTamil} onChange={(e) => setNameTamil(e.target.value)} />
      <div className="flex gap-4 text-sm">
        {MEALS.map((m) => (
          <label key={m} className="flex items-center gap-1">
            <input type="checkbox" checked={meals.includes(m)} onChange={() => toggleMeal(m)} /> {LABELS[m]}
          </label>
        ))}
      </div>
      <textarea className={field} rows={4} placeholder="Ingredients, one per line" value={ingredients} onChange={(e) => setIngredients(e.target.value)} />
      <textarea className={field} rows={5} placeholder="Steps, one per line" value={steps} onChange={(e) => setSteps(e.target.value)} />
      <input className={field} type="number" placeholder="Protein grams (estimate)" value={protein} onChange={(e) => setProtein(e.target.value)} />
      <input className={field} placeholder="YouTube URL (blank = auto search link)" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
      <div className="flex gap-2">
        <button type="submit" className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700">Save</button>
        <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 hover:bg-stone-100">Cancel</button>
      </div>
    </form>
  );
}
