import { Suspense } from "react";
import { SearchView } from "../components/SearchView";

export default function HomePage() {
  return (
    <Suspense fallback={<p className="status">読み込み中…</p>}>
      <SearchView />
    </Suspense>
  );
}
