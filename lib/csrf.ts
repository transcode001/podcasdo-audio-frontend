// CSRF token access. The Backend sets a readable `podcasdo_csrf` cookie and
// expects it echoed in the X-CSRF-Token header on state-changing requests
// (double-submit). This runs only in the browser.
export const CSRF_COOKIE = "podcasdo_csrf";
export const CSRF_HEADER = "X-CSRF-Token";

export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  for (const part of document.cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === CSRF_COOKIE) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}
