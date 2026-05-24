"use client";

export function ProteinRing({ total, goal }: { total: number; goal: number }) {
  const met = total >= goal;
  const pct = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 100;
  const short = Math.max(0, goal - total);
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-white p-4">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full"
        style={{ background: `conic-gradient(${met ? "#16a34a" : "#ea580c"} ${pct * 3.6}deg, #e7e5e4 0deg)` }}
      >
        <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-white">
          <span className="text-lg font-bold">{total}g</span>
          <span className="text-[10px] text-stone-500">of {goal}g</span>
        </div>
      </div>
      <div>
        <p className="font-semibold">{met ? "Protein goal met" : "Below protein goal"}</p>
        {!met && <p className="text-sm text-orange-600">{short}g short. Re-spin or add a protein side.</p>}
      </div>
    </div>
  );
}
