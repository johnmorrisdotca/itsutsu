/** The name as compared: trimmed, lower case, inner whitespace collapsed. Shared by server and client. */
export function playerKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * A player's place in an address: the folded name with its spaces as
 * hyphens, so /players/john-morris reads like every other address here
 * rather than /players/John%20Morris. Shared by server and client.
 */
export function playerSlug(name: string): string {
  return playerKey(name).replace(/\s+/g, "-");
}

/** /players/<slug> — a player's page, under the name they play as. */
export function playerPath(name: string): string {
  return `/players/${playerSlug(name)}`;
}

/**
 * The keys a slug might have come from, best first.
 *
 * Hyphens in an address stand for spaces, but a name may hold a hyphen of
 * its own — Anne-Marie — and folding is not reversible. So a slug offers
 * both readings and the page takes whichever finds somebody: the spaced
 * one, which is what most names slug to, then the literal one.
 */
export function playerKeysFromSlug(slug: string): string[] {
  const spaced = playerKey(slug.replace(/-+/g, " "));
  const literal = playerKey(slug);
  return spaced === literal ? [spaced] : [spaced, literal];
}
