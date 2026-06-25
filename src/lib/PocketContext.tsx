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

export function PocketProvider({
  children,
  initialPockets = [],
}: {
  children: ReactNode;
  initialPockets?: Pocket[];
}) {
  const [pockets, setPockets] = useState<Pocket[]>(initialPockets);
  const [activePocket, setActivePocket] = useState<Pocket | null>(() => {
    if (initialPockets.length > 0) {
      return initialPockets.find(p => p.isDefault) || initialPockets[0];
    }
    return null;
  });
  const [loading, setLoading] = useState(initialPockets.length === 0);
  const [fetched, setFetched] = useState(initialPockets.length > 0);

  const refresh = () => {
    fetch("/api/pockets")
      .then((r) => r.json())
      .then((data: Pocket[]) => {
        setPockets(data);
        if (data.length > 0) {
          const def = data.find(p => p.isDefault) || data[0];
          setActivePocket(prev => {
            const match = data.find(p => p.id === prev?.id);
            return match || def;
          });
        }
        setLoading(false);
        setFetched(true);
      })
      .catch(() => setLoading(false));
  };

  // Only fetch if we didn't get initial data from server
  useEffect(() => {
    if (!fetched) refresh();
  }, []);

  return (
    <PocketContext.Provider value={{ pockets, activePocket, setActivePocket, loading, refresh }}>
      {children}
    </PocketContext.Provider>
  );
}

export function usePocket() {
  return useContext(PocketContext);
}
