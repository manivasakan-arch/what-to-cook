"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AppSettings, Dish, HistoryEntry } from "@/lib/types";
import { LocalStorageStore, Store, DEFAULT_SETTINGS } from "@/lib/store";
import { SEED_DISHES } from "@/lib/seed";

interface StoreContextValue {
  ready: boolean;
  dishes: Dish[];
  settings: AppSettings;
  history: HistoryEntry[];
  saveDish: (dish: Dish) => void;
  deleteDish: (id: string) => void;
  saveSettings: (settings: AppSettings) => void;
  lockMenu: (entry: HistoryEntry) => void;
  resetHistory: () => void;
  reseed: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<Store | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = new LocalStorageStore(window.localStorage, SEED_DISHES);
    setStore(s);
    setDishes(s.getDishes());
    setSettings(s.getSettings());
    setHistory(s.getHistory());
    setReady(true);
  }, []);

  const saveDish = useCallback((dish: Dish) => { store!.saveDish(dish); setDishes(store!.getDishes()); }, [store]);
  const deleteDish = useCallback((id: string) => { store!.deleteDish(id); setDishes(store!.getDishes()); }, [store]);
  const saveSettings = useCallback((s: AppSettings) => { store!.saveSettings(s); setSettings(store!.getSettings()); }, [store]);
  const lockMenu = useCallback((e: HistoryEntry) => { store!.lockMenu(e); setHistory(store!.getHistory()); }, [store]);
  const resetHistory = useCallback(() => { store!.resetHistory(); setHistory(store!.getHistory()); }, [store]);
  const reseed = useCallback(() => { setDishes(store!.reseed()); }, [store]);

  return (
    <StoreContext.Provider value={{ ready, dishes, settings, history, saveDish, deleteDish, saveSettings, lockMenu, resetHistory, reseed }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
