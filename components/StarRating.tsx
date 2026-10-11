import { formatStars } from "../lib/rating";

// StarRating shows a star value (0.5..5.0) as text with an accessible label.
export function StarRating({ stars }: { stars: number }) {
  const label = `5点満点中 ${formatStars(stars)} 点`;
  return (
    <span aria-label={label}>
      <span aria-hidden="true">★ {formatStars(stars)}</span>
    </span>
  );
}
