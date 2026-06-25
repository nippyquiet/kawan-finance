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
    <PocketContext.Provider value={{ pockets, activePocket, setActivePocket, loading, refresh }}>
      {children}
    </PocketContext.Provider>
  );
}

export function usePocket() {
  return useContext(PocketContext);
}
