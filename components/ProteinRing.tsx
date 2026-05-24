"use client";

export function ProteinRing({ total, goal }: { total: number; goal: number }) {
  const met = total >= goal;
  const pct = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 100;
  const short = Math.max(0, goal - total);
  const accent = met ? "#16a34a" : "#c2480f";
  return (
    <div className="flex items-center gap-5 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div
        className="grid h-24 w-24 shrink-0 place-items-center rounded-full"
        style={{ background: `conic-gradient(${accent} ${pct * 3.6}deg, #ece7df 0deg)` }}
      >
        <div className="grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full bg-white text-center">
          <div>
            <div className="font-display text-xl font-semibold leading-none">{total}g</div>
            <div className="text-[10px] uppercase tracking-wide text-stone-400">of {goal}g</div>
          </div>
        </div>
      </div>
      <div>
        <p className="font-display text-lg font-semibold">{met ? "Protein goal met" : "Below protein goal"}</p>
        <p className="mt-0.5 text-sm text-stone-500">
          {met ? "Today's plates cover your daily protein." : `${short}g short. Re-spin a meal or add a protein side.`}
        </p>
      </div>
    </div>
  );
}
