"use client";

import { createContext, useCallback, use, useEffect, useState } from "react";
import { ApiError, getMyProfile } from "../lib/api";
import type { Profile } from "../lib/types";

type Status = "loading" | "authenticated" | "anonymous";

interface SessionState {
  status: Status;
  profile: Profile | null;
  refresh: () => Promise<void>;
  setProfile: (p: Profile) => void;
}

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [profile, setProfile] = useState<Profile | null>(null);

  const refresh = useCallback(async () => {
    try {
      const p = await getMyProfile();
      setProfile(p);
      setStatus("authenticated");
    } catch (err) {
      // 401 (and any failure to resolve a session) means "not logged in" for UI.
      if (err instanceof ApiError && err.status !== 401 && err.status !== 0) {
        // Non-auth error: still treat as anonymous for gating, but do not crash.
      }
      setProfile(null);
      setStatus("anonymous");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <SessionContext
      value={{ status, profile, refresh, setProfile: (p) => { setProfile(p); setStatus("authenticated"); } }}
    >
      {children}
    </SessionContext>
  );
}

export function useSession(): SessionState {
  const ctx = use(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return ctx;
}
