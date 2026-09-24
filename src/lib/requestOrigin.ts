import "server-only";

import { headers } from "next/headers";

/**
 * The site's own origin, taken from the request so links work behind any
 * host: a seat link, and the QR code drawn from it, on a match page or a
 * puzzle race.
 */
export async function requestOrigin(): Promise<string> {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host") ?? "localhost:6600";
  const protocol = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}
