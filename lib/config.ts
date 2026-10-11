// API base URL comes from the environment. Only a non-secret public base URL is
// read; no credentials are embedded in the frontend bundle.
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"
).replace(/\/$/, "");

// Search input bounds (OpenAPI Query parameter: 1..100 after trimming).
export const SEARCH_MIN_LENGTH = 1;
export const SEARCH_MAX_LENGTH = 100;

// List page size (OpenAPI Limit: max 20).
export const PAGE_LIMIT = 20;
