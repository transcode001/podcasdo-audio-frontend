// Types mirror the Backend OpenAPI contract (docs/api/openapi.yaml). The KB is
// the source of truth; these are hand-written to match it.

export interface PodcastSummary {
  id: string;
  title: string;
  publisher: string | null;
  source_url: string | null;
}

export interface PodcastLink {
  provider: string;
  url: string;
}

export interface PodcastDetail extends PodcastSummary {
  rating_count: number;
  /** Average in stars (0.5..5.0), or null when there are no ratings. */
  average_rating: number | null;
  links: PodcastLink[];
}

export interface PodcastSearchResponse {
  items: PodcastSummary[];
  next_cursor: string | null;
}

export interface Review {
  id: string;
  podcast_id: string;
  /** Internal integer 1..10 (0.5..5.0 stars). */
  rating: number;
  body: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewListResponse {
  items: Review[];
  next_cursor: string | null;
}

export interface ReviewInput {
  /** Internal integer 1..10. */
  rating: number;
  /** Null clears the body while keeping the rating. */
  body: string | null;
}

export interface IconConfig {
  character: string;
  background: number;
  decoration: string;
  version?: string;
}

export interface Profile {
  user_id: string;
  nickname: string;
  icon_config: IconConfig;
  updated_at: string;
}

export interface ProfileInput {
  nickname?: string;
  icon_config?: {
    character: string;
    background: number;
    decoration: string;
  };
}

/** Shape of the Backend error envelope: { error: { code, message, request_id } }. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    request_id: string;
  };
}
