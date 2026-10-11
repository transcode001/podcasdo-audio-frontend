import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError, getPodcast, listReviews } from "../../../lib/api";
import { PodcastDetailView } from "../../../components/PodcastDetailView";
import type { PodcastDetail, Review } from "../../../lib/types";

// Public podcast detail. Server Component: fetches detail and the first page of
// reviews. A 404 renders the not-found page; other API failures render an inline
// error instead of crashing.
export default async function PodcastDetailPage({
  params,
}: {
  params: Promise<{ podcast_id: string }>;
}) {
  const { podcast_id } = await params;

  let detail: PodcastDetail;
  try {
    detail = await getPodcast(podcast_id);
  } catch (err) {
    if (err instanceof ApiError && err.isNotFound) {
      notFound();
    }
    return <DetailError />;
  }

  let initialReviews: Review[] = [];
  let initialReviewCursor: string | null = null;
  let reviewError = false;
  try {
    const res = await listReviews(podcast_id);
    initialReviews = res.items;
    initialReviewCursor = res.next_cursor;
  } catch {
    reviewError = true;
  }

  return (
    <PodcastDetailView
      detail={detail}
      initialReviews={initialReviews}
      initialReviewCursor={initialReviewCursor}
      reviewError={reviewError}
    />
  );
}

function DetailError() {
  return (
    <div className="status error" role="alert">
      <p>番組情報を取得できませんでした。時間をおいて再度お試しください。</p>
      <p>
        <Link href="/">検索に戻る</Link>
      </p>
    </div>
  );
}
