"use client";
import { useState } from "react";

function emojiFor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("dosa") || n.includes("adai") || n.includes("uttapam")) return "🥞";
  if (n.includes("idli")) return "🍥";
  if (n.includes("chicken") || n.includes("kozhi")) return "🍗";
  if (n.includes("mutton") || n.includes("kari")) return "🍖";
  if (n.includes("fish") || n.includes("meen") || n.includes("prawn") || n.includes("eral")) return "🐟";
  if (n.includes("egg") || n.includes("muttai")) return "🥚";
  if (n.includes("poriyal") || n.includes("kootu") || n.includes("beans") || n.includes("cabbage") || n.includes("carrot")) return "🥦";
  if (n.includes("rice") || n.includes("sadam") || n.includes("pongal") || n.includes("biryani")) return "🍚";
  if (n.includes("rasam") || n.includes("sambar") || n.includes("kuzhambu") || n.includes("kulambu")) return "🍲";
  if (n.includes("vada") || n.includes("bonda") || n.includes("bajji")) return "🍩";
  if (n.includes("upma") || n.includes("kichadi") || n.includes("kanji")) return "🥣";
  return "🍛";
}

export function DishImage({ name, url, className = "" }: { name: string; url?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (url && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`${className} object-cover`}
      />
    );
  }
  return (
    <div className={`${className} flex items-center justify-center bg-gradient-to-br from-orange-200 via-amber-100 to-rose-100 text-4xl`}>
      <span>{emojiFor(name)}</span>
    </div>
  );
}
