/**
 * The cookie a claimed seat lives in: one per match, so two games never share
 * a claim, and so a browser's list of seats is simply its list of these.
 */
const PREFIX = "seat_";

export function seatCookieName(id: string): string {
  return `${PREFIX}${id}`;
}

/** The seats a browser holds, read from its cookies: match id → seat token. */
export function seatClaims(cookies: { name: string; value: string }[]): Map<string, string> {
  const claims = new Map<string, string>();
  for (const cookie of cookies) {
    if (cookie.name.startsWith(PREFIX) && cookie.value !== "") {
      claims.set(cookie.name.slice(PREFIX.length), cookie.value);
    }
  }
  return claims;
}
