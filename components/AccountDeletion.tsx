"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, deleteAccount, googleDeleteReauthUrl } from "../lib/api";
import { toUserMessage } from "../lib/errorMessage";
import { useSession } from "./SessionProvider";

// AccountDeletion implements the self-service deletion flow (features 3.10 / B2):
// the user re-authenticates with Google (which establishes a one-time, 5-minute
// deletion grant on the backend), then confirms. Confirming calls DELETE and, on
// success, drops the local session and returns home. Without a valid grant the
// backend replies reauth_required and the user is pointed back to re-auth.
export function AccountDeletion() {
  const { refresh } = useSession();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needReauth, setNeedReauth] = useState(false);

  async function confirmDelete() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setNeedReauth(false);
    try {
      await deleteAccount();
      await refresh(); // cookie cleared server-side -> session becomes anonymous
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError && err.code === "reauth_required") {
        setNeedReauth(true);
        setError("退会には再認証が必要です。下のボタンから再認証してやり直してください。");
      } else {
        setError(toUserMessage(err));
      }
      setConfirming(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="delete-heading">
      <h2 id="delete-heading">アカウント削除</h2>
      <p>
        アカウントを削除すると、プロフィールと投稿した評価・レビューがすべて削除され、元に戻せません。
      </p>
      <ol>
        <li>
          <a href={googleDeleteReauthUrl()}>① Googleで再認証する</a>
          （本人確認のため。許可は5分間のみ有効です）
        </li>
        <li>再認証のあと、下の「退会を確定する」を押してください。</li>
      </ol>

      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
      {needReauth ? (
        <p>
          <a href={googleDeleteReauthUrl()}>再認証をやり直す</a>
        </p>
      ) : null}

      {!confirming ? (
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setError(null);
            setNeedReauth(false);
            setConfirming(true);
          }}
        >
          退会を確定する
        </button>
      ) : (
        <div className="status error" role="alertdialog" aria-label="退会の最終確認">
          <p>本当に退会しますか？この操作は取り消せません。</p>
          <div className="pager">
            <button type="button" onClick={confirmDelete} disabled={submitting}>
              {submitting ? "処理中…" : "退会する"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setConfirming(false)}
              disabled={submitting}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
