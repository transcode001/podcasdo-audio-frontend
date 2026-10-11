import Link from "next/link";
import type { PodcastSummary } from "../lib/types";
import { Artwork } from "./Artwork";

// PodcastCard is one search result: artwork placeholder, linked title and
// publisher (shown only when provided by the API).
export function PodcastCard({ podcast }: { podcast: PodcastSummary }) {
  return (
    <li className="card">
      <Artwork title={podcast.title} />
      <div className="card-body">
        <h3 className="card-title">
          <Link href={`/podcasdo-podcasts/${encodeURIComponent(podcast.id)}`}>{podcast.title}</Link>
        </h3>
        {podcast.publisher ? <p className="card-publisher">{podcast.publisher}</p> : null}
      </div>
    </li>
  );
}
