// Artwork renders a podcast image. The MVP API returns no artwork URL, so this
// always shows a safe, offline placeholder derived from the title. If a trusted
// image URL is provided (future), it is used; otherwise the placeholder renders.
interface ArtworkProps {
  title: string;
  src?: string | null;
  size?: "sm" | "lg";
}

export function Artwork({ title, src, size = "sm" }: ArtworkProps) {
  const initial = firstGrapheme(title);
  if (src) {
    // Only ever render an explicit, API-provided URL; never a guessed one.
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="artwork" src={src} alt="" width={size === "lg" ? 96 : 64} height={size === "lg" ? 96 : 64} />;
  }
  return (
    <div className="artwork" aria-hidden="true" data-size={size}>
      {initial}
    </div>
  );
}

function firstGrapheme(title: string): string {
  const trimmed = title.trim();
  if (trimmed.length === 0) return "♪";
  return [...trimmed][0];
}
