"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";

type Pocket = {
  id: number;
  name: string;
  emoji: string;
  balance: number;
  isDefault: boolean;
  userId: string | null;
};

type PocketContextType = {
  pockets: Pocket[];
  activePocket: Pocket | null;
  setActivePocket: (p: Pocket) => void;
  loading: boolean;
  refresh: () => void;
  upsertPocket: (p: Pocket) => void;
  removePocket: (id: number) => void;
};

const PocketContext = createContext<PocketContextType>({
  pockets: [],
  activePocket: null,
  setActivePocket: () => {},
  loading: true,
  refresh: () => {},
  upsertPocket: () => {},
  removePocket: () => {},
});

export function PocketProvider({
  children,
  initialPockets = [],
}: {
  children: ReactNode;
  initialPockets?: Pocket[];
}) {
  const { data: session, status } = useSession();
  const [pockets, setPockets] = useState<Pocket[]>(initialPockets);
  const [activePocket, setActivePocket] = useState<Pocket | null>(() => {
    if (initialPockets.length > 0) {
      return initialPockets.find(p => p.isDefault) || initialPockets[0];
    }
    return null;
  });
  const [loading, setLoading] = useState(initialPockets.length === 0);
  const [fetched, setFetched] = useState(initialPockets.length > 0);

  const upsertPocket = (pocket: Pocket) => {
    setPockets(prev => {
      const exists = prev.some(p => p.id === pocket.id);
      return exists ? prev.map(p => p.id === pocket.id ? pocket : p) : [...prev, pocket];
    });
    setActivePocket(prev => prev?.id === pocket.id ? pocket : (prev || pocket));
  };

  const removePocket = (id: number) => {
    setPockets(prev => {
      const next = prev.filter(p => p.id !== id);
      setActivePocket(current => current?.id === id ? (next[0] || null) : current);
      return next;
    });
  };

  const refresh = () => {
    if (status !== "authenticated") {
      setPockets([]);
      setActivePocket(null);
      setLoading(false);
      return;
    }
    fetch("/api/pockets")
      .then((r) => r.json())
      .then((data: Pocket[]) => {
        if (!Array.isArray(data)) return;
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

  // Fetch when session is ready
  useEffect(() => {
    if (status === "authenticated") {
      if (!fetched) refresh();
    } else if (status === "unauthenticated") {
      setPockets([]);
      setActivePocket(null);
      setLoading(false);
    }
  }, [status]);

  return (
    <PocketContext.Provider value={{ pockets, activePocket, setActivePocket, loading, refresh, upsertPocket, removePocket }}>
      {children}
    </PocketContext.Provider>
  );
}

export function usePocket() {
  return useContext(PocketContext);
}
