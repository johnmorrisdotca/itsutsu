/**
 * Whether what a device reports is worth a write.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE LOOP THIS EXISTS TO CLOSE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The browser is asked for its zone whenever the row holds nothing or only a
 * guess from the country (`worthAsking` in `zoneGuess.ts`). A guess stays a guess
 * until something replaces it — so a member in Toronto whose country is Canada,
 * whose row holds the `America/Toronto` a sign-in guessed, reads as `guessed` for
 * as long as their browser agrees. Without this, their browser would PATCH the
 * very value already stored on every page they opened: a request per page load,
 * to change nothing, which is the one cost this whole mechanism was built to
 * avoid.
 *
 * So the server hands over the zone it holds when that zone is a guess, and a
 * device that agrees with it writes nothing. The guess is then CONFIRMED rather
 * than merely assumed, and the profile still calls it a guess, which is
 * harmless: it is also right. Recording the confirmation would now be one write
 * — the zone's source is kept (`timeZoneFrom`) — and is deliberately not done:
 * it would turn today's zero writes for such a member into one, for a note that
 * is already true.
 *
 * Pure, and deliberately not `server-only` and not `"use client"`: it is the
 * rule the client component follows, and it is tested without either.
 */
export function zoneWorthRecording(device: string | null, held: string | null): string | null {
  const reported = device?.trim() ?? "";
  if (reported === "") return null;
  if (held !== null && reported === held.trim()) return null;
  return reported;
}
