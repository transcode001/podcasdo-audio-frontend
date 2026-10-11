import Link from "next/link";

export default function PodcastNotFound() {
  return (
    <div className="status" role="alert">
      <h1>番組が見つかりません</h1>
      <p>指定された番組は存在しないか、削除された可能性があります。</p>
      <p>
        <Link href="/">検索に戻る</Link>
      </p>
    </div>
  );
}
