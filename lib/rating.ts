// Rating display helpers. The Backend stores ratings as internal integers 1..10;
// the UI shows stars on the 0.5..5.0 scale (reviews spec). average_rating is
// already in stars.

/** Convert an internal rating (1..10) to stars (0.5..5.0). */
export function ratingToStars(rating: number): number {
  return rating / 2;
}

/** Format a star value to one decimal place (e.g. 4.3). */
export function formatStars(stars: number): string {
  return stars.toFixed(1);
}

/** Human-readable average for the detail header, or the "no ratings" label. */
export function formatAverage(average: number | null): string {
  return average === null ? "評価なし" : formatStars(average);
}
