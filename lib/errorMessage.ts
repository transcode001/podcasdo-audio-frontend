import { ApiError } from "./api";

// Maps an ApiError to a user-facing Japanese message. Internal details
// (request_id, raw server text, SQL, etc.) are never surfaced to the user.
export function toUserMessage(err: unknown): string {
  if (!(err instanceof ApiError)) {
    return "予期しない問題が発生しました。時間をおいて再度お試しください。";
  }
  switch (err.status) {
    case 401:
      return "ログインが必要です。";
    case 403:
      return "この操作を行う権限がありません。";
    case 404:
      return "対象が見つかりませんでした。";
    case 409:
      return "すでにこの番組へレビューを投稿しています。";
    case 429:
      return "操作の回数制限を超えました。しばらくしてから再度お試しください。";
    case 400:
      // 400 messages from the Backend are user-facing validation text.
      return err.message || "入力内容を確認してください。";
    case 502:
    case 504:
      return "番組情報を取得できませんでした。時間をおいて再度お試しください。";
    case 0:
      return "サーバーに接続できませんでした。通信環境を確認して再度お試しください。";
    default:
      return "問題が発生しました。時間をおいて再度お試しください。";
  }
}

// Formats a Retry-After hint (seconds) for the 429 message when available.
export function retryAfterMessage(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return "";
  if (seconds >= 60) {
    const minutes = Math.ceil(seconds / 60);
    return `約${minutes}分後に再度お試しください。`;
  }
  return `約${seconds}秒後に再度お試しください。`;
}
