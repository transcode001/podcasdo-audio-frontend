// Rating display helpers. The Backend stores ratings as internal integers 1..10;
// the UI shows stars on the 0.5..5.0 scale (reviews spec). average_rating is
// already in stars.

/** The selectable star values: 0.5 .. 5.0 in 0.5 steps. */
export const STAR_OPTIONS: number[] = Array.from({ length: 10 }, (_, i) => (i + 1) / 2);

/** Convert an internal rating (1..10) to stars (0.5..5.0). */
export function ratingToStars(rating: number): number {
  return rating / 2;
}

/**
 * Convert stars (0.5..5.0, 0.5 steps) to the internal integer rating (1..10).
 * Returns null when the value is out of range or not on a half-step.
 */
export function starsToRating(stars: number): number | null {
  const rating = Math.round(stars * 2);
  if (rating < 1 || rating > 10) return null;
  if (Math.abs(stars * 2 - rating) > 1e-9) return null;
  return rating;
}

/** Format a star value to one decimal place (e.g. 4.3). */
export function formatStars(stars: number): string {
  return stars.toFixed(1);
}

/** Human-readable average for the detail header, or the "no ratings" label. */
export function formatAverage(average: number | null): string {
  return average === null ? "評価なし" : formatStars(average);
}
