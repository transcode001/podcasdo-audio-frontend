import type { PodcastDetail, Review } from "../lib/types";
import { formatAverage } from "../lib/rating";
import { Artwork } from "./Artwork";
import { ReviewComposer } from "./ReviewComposer";
import { ReviewList } from "./ReviewList";

interface PodcastDetailViewProps {
  detail: PodcastDetail;
  initialReviews: Review[];
  initialReviewCursor: string | null;
  reviewError: boolean;
}

// PodcastDetailView renders a podcast's public detail: title, publisher,
// artwork placeholder, average rating + count, confirmed external links, and the
// public review list. Viewable without authentication.
export function PodcastDetailView({
  detail,
  initialReviews,
  initialReviewCursor,
  reviewError,
}: PodcastDetailViewProps) {
  return (
    <article>
      <div className="detail-header">
        <Artwork title={detail.title} size="lg" />
        <div>
          <h1>{detail.title}</h1>
          {detail.publisher ? <p className="card-publisher">{detail.publisher}</p> : null}
          <p className="rating-summary">
            {detail.average_rating === null ? (
              <span>評価なし（0件）</span>
            ) : (
              <span>
                <span aria-hidden="true">★ </span>
                {formatAverage(detail.average_rating)}
                <span className="field-hint">（{detail.rating_count}件）</span>
              </span>
            )}
          </p>
        </div>
      </div>

      <ExternalLinks links={detail.links} />

      <ReviewComposer podcastId={detail.id} />

      <ReviewList
        podcastId={detail.id}
        initialItems={initialReviews}
        initialCursor={initialReviewCursor}
        initialError={reviewError}
      />
    </article>
  );
}

function ExternalLinks({ links }: { links: PodcastDetail["links"] }) {
  if (links.length === 0) {
    return (
      <section aria-labelledby="links-heading">
        <h2 id="links-heading">配信先</h2>
        <p className="field-hint">配信先を確認中です。</p>
      </section>
    );
  }
  return (
    <section aria-labelledby="links-heading">
      <h2 id="links-heading">配信先</h2>
      <p className="links">
        {links.map((link) => (
          <a key={`${link.provider}:${link.url}`} href={link.url} target="_blank" rel="noopener noreferrer">
            {link.provider}
          </a>
        ))}
      </p>
    </section>
  );
}
