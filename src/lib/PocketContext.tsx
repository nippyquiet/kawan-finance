"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Pocket = {
  id: number;
  name: string;
  emoji: string;
  balance: number;
  isDefault: boolean;
};

type PocketContextType = {
  pockets: Pocket[];
  activePocket: Pocket | null;
  setActivePocket: (p: Pocket) => void;
  loading: boolean;
  refresh: () => void;
};

const PocketContext = createContext<PocketContextType>({
  pockets: [],
  activePocket: null,
  setActivePocket: () => {},
  loading: true,
  refresh: () => {},
});

export function PocketProvider({ children }: { children: ReactNode }) {
  const [pockets, setPockets] = useState<Pocket[]>([]);
  const [activePocket, setActivePocket] = useState<Pocket | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    fetch("/api/pockets")
      .then((r) => r.json())
      .then((data) => {
        setPockets(data);
        if (!activePocket && data.length > 0) {
          const defaultP = data.find((p: Pocket) => p.isDefault) || data[0];
          setActivePocket(defaultP);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(refresh, []);

  return (
    <PocketContext.Provider value={{ pockets, activePocket, setActivePocket, loading, refresh }}>
      {children}
    </PocketContext.Provider>
  );
}

export function usePocket() {
  return useContext(PocketContext);
}
