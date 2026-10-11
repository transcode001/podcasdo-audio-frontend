"use client";

import Link from "next/link";
import { useState } from "react";
import { googleLoginUrl, logout } from "../lib/api";
import { useSession } from "./SessionProvider";

// Header auth controls: a Google login link when anonymous, or the nickname,
// profile link and logout when authenticated.
export function AuthControls() {
  const { status, profile, refresh } = useSession();
  const [busy, setBusy] = useState(false);

  if (status === "loading") {
    return <span className="field-hint">読み込み中…</span>;
  }

  if (status === "anonymous") {
    // Full-page navigation to the Backend start endpoint (redirects to Google).
    return (
      <a className="auth-link" href={googleLoginUrl()}>
        Googleでログイン
      </a>
    );
  }

  async function onLogout() {
    setBusy(true);
    try {
      await logout();
    } catch {
      // Even if logout fails server-side, drop the local session view.
    } finally {
      await refresh();
      setBusy(false);
    }
  }

  return (
    <span className="auth-controls">
      <Link href="/profile">{profile?.nickname ?? "プロフィール"}</Link>
      <button type="button" className="secondary" onClick={onLogout} disabled={busy}>
        ログアウト
      </button>
    </span>
  );
}
