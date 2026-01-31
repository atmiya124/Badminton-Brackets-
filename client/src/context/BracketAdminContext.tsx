import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_ROUND1_TEAM_NUMBERS } from "@/lib/bracketAdmin";

const BRACKET_ADMIN_STORAGE_KEY = "bracket-admin";

export type ChampionPlayerNames = { player1: string; player2: string };

type StoredAdmin = {
  round1TeamNumbers?: string[];
  championPlayerNames?: ChampionPlayerNames;
};

function loadStored(): StoredAdmin {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(BRACKET_ADMIN_STORAGE_KEY) : null;
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredAdmin;
    return parsed;
  } catch {
    return {};
  }
}

function saveStored(merge: Partial<StoredAdmin>) {
  try {
    if (typeof window !== "undefined") {
      const current = loadStored();
      const data: StoredAdmin = {
        round1TeamNumbers: merge.round1TeamNumbers ?? current.round1TeamNumbers,
        championPlayerNames: merge.championPlayerNames ?? current.championPlayerNames,
      };
      localStorage.setItem(BRACKET_ADMIN_STORAGE_KEY, JSON.stringify(data));
    }
  } catch {
    // ignore
  }
}

type BracketAdminContextValue = {
  round1TeamNumbers: string[];
  setRound1TeamNumbers: (v: string[] | ((prev: string[]) => string[])) => void;
  championPlayerNames: ChampionPlayerNames;
  setChampionPlayerNames: React.Dispatch<React.SetStateAction<ChampionPlayerNames>>;
};

const BracketAdminContext = createContext<BracketAdminContextValue | null>(null);

const defaultChampionNames: ChampionPlayerNames = { player1: "", player2: "" };

export function BracketAdminProvider({ children }: { children: React.ReactNode }) {
  const stored = loadStored();
  const [round1TeamNumbers, setRound1TeamNumbersState] = useState<string[]>(
    stored.round1TeamNumbers && stored.round1TeamNumbers.length === 64
      ? stored.round1TeamNumbers
      : DEFAULT_ROUND1_TEAM_NUMBERS
  );
  const [championPlayerNames, setChampionPlayerNamesState] = useState<ChampionPlayerNames>(
    stored.championPlayerNames ?? defaultChampionNames
  );

  const setRound1TeamNumbers = useCallback((v: string[] | ((prev: string[]) => string[])) => {
    setRound1TeamNumbersState((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      saveStored({ round1TeamNumbers: next });
      return next;
    });
  }, []);

  const setChampionPlayerNames = useCallback<React.Dispatch<React.SetStateAction<ChampionPlayerNames>>>((v) => {
    setChampionPlayerNamesState((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      saveStored({ championPlayerNames: next });
      return next;
    });
  }, []);

  // When another tab saves in admin, sync this tab so dashboard updates without refresh
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== BRACKET_ADMIN_STORAGE_KEY || e.newValue == null) return;
      try {
        const data = JSON.parse(e.newValue) as StoredAdmin;
        if (data.round1TeamNumbers && data.round1TeamNumbers.length === 64) {
          setRound1TeamNumbersState(data.round1TeamNumbers);
        }
        if (data.championPlayerNames) {
          setChampionPlayerNamesState(data.championPlayerNames);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <BracketAdminContext.Provider
      value={{
        round1TeamNumbers,
        setRound1TeamNumbers,
        championPlayerNames,
        setChampionPlayerNames,
      }}
    >
      {children}
    </BracketAdminContext.Provider>
  );
}

export function useBracketAdmin() {
  const ctx = useContext(BracketAdminContext);
  if (!ctx) throw new Error("useBracketAdmin must be used within BracketAdminProvider");
  return ctx;
}
