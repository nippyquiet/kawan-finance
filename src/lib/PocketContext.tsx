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
  totalAssets: number;
  setActivePocket: (p: Pocket) => void;
  loading: boolean;
  refresh: () => void;
  upsertPocket: (p: Pocket) => void;
  removePocket: (id: number) => void;
};

type BootstrapPayload = {
  pockets: Pocket[];
  activePocketId: number | null;
  analytics?: unknown;
  fetchedAt: number;
};

const PocketContext = createContext<PocketContextType>({
  pockets: [],
  activePocket: null,
  totalAssets: 0,
  setActivePocket: () => {},
  loading: true,
  refresh: () => {},
  upsertPocket: () => {},
  removePocket: () => {},
});

const cacheKey = (email: string) => `kawan:bootstrap:${email}`;
const activePocketKey = (email: string) => `kawan:active-pocket:${email}`;

function readCachedBootstrap(email?: string | null): BootstrapPayload | null {
  if (!email || typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey(email));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BootstrapPayload;
    return Array.isArray(parsed.pockets) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCachedBootstrap(email: string, payload: BootstrapPayload) {
  if (typeof window === "undefined") return;
  localStorage.setItem(cacheKey(email), JSON.stringify(payload));
}

export function PocketProvider({
  children,
  initialPockets = [],
}: {
  children: ReactNode;
  initialPockets?: Pocket[];
}) {
  const { data: session, status } = useSession();
  const email = session?.user?.email || null;
  const [pockets, setPockets] = useState<Pocket[]>(initialPockets);
  const [activePocket, setActivePocketState] = useState<Pocket | null>(() => {
    if (initialPockets.length > 0) {
      return initialPockets.find(p => p.isDefault) || initialPockets[0];
    }
    return null;
  });
  const [loading, setLoading] = useState(initialPockets.length === 0);
  const totalAssets = pockets.reduce((sum, p) => sum + (p.balance || 0), 0);

  const setActivePocket = (pocket: Pocket) => {
    setActivePocketState(pocket);
    if (email && typeof window !== "undefined") {
      localStorage.setItem(activePocketKey(email), String(pocket.id));
    }
  };

  const applyPockets = (data: Pocket[], preferredId?: number | null) => {
    setPockets(data);
    if (data.length > 0) {
      const selected = data.find(p => p.id === preferredId) || data.find(p => p.id === activePocket?.id) || data.find(p => p.isDefault) || data[0];
      setActivePocketState(selected);
    } else {
      setActivePocketState(null);
    }
  };

  const upsertPocket = (pocket: Pocket) => {
    setPockets(prev => {
      const exists = prev.some(p => p.id === pocket.id);
      const next = exists ? prev.map(p => p.id === pocket.id ? pocket : p) : [...prev, pocket];
      if (email) writeCachedBootstrap(email, { pockets: next, activePocketId: activePocket?.id || pocket.id, fetchedAt: Date.now() });
      return next;
    });
    setActivePocketState(prev => prev?.id === pocket.id ? pocket : (prev || pocket));
  };

  const removePocket = (id: number) => {
    setPockets(prev => {
      const next = prev.filter(p => p.id !== id);
      setActivePocketState(current => current?.id === id ? (next[0] || null) : current);
      if (email) writeCachedBootstrap(email, { pockets: next, activePocketId: next[0]?.id || null, fetchedAt: Date.now() });
      return next;
    });
  };

  const refresh = () => {
    if (status !== "authenticated" || !email) {
      setPockets([]);
      setActivePocketState(null);
      setLoading(false);
      return;
    }

    const preferredId = typeof window !== "undefined" ? Number(localStorage.getItem(activePocketKey(email))) : 0;
    const url = preferredId ? `/api/bootstrap?pocketId=${preferredId}` : "/api/bootstrap";

    fetch(url)
      .then((r) => r.json())
      .then((data: BootstrapPayload) => {
        if (!Array.isArray(data.pockets)) return;
        applyPockets(data.pockets, data.activePocketId || preferredId || null);
        writeCachedBootstrap(email, data);
        window.dispatchEvent(new CustomEvent("kawan:bootstrap", { detail: data }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (status === "authenticated" && email) {
      const cached = readCachedBootstrap(email);
      const preferredId = Number(localStorage.getItem(activePocketKey(email)) || cached?.activePocketId || 0);
      if (cached?.pockets?.length) {
        applyPockets(cached.pockets, preferredId || cached.activePocketId);
        window.dispatchEvent(new CustomEvent("kawan:bootstrap", { detail: cached }));
        setLoading(false);
      } else {
        setLoading(true);
      }
      refresh();
    } else if (status === "unauthenticated") {
      setPockets([]);
      setActivePocketState(null);
      setLoading(false);
    }
  }, [status, email]);

  return (
    <PocketContext.Provider value={{ pockets, activePocket, totalAssets, setActivePocket, loading, refresh, upsertPocket, removePocket }}>
      {children}
    </PocketContext.Provider>
  );
}

export function usePocket() {
  return useContext(PocketContext);
}
