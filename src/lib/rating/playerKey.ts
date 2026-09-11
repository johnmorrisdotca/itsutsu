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

/**
 * /players/<id> for a member, /players/<slug> for a record with nobody behind
 * it. **The id is the point of this function.**
 *
 * A link used to be built from the name, and that quietly defeated the whole
 * of `shownName`. The screen printed "Hanako M." and the href underneath it
 * read /players/hanako-morris, so a twelve-year-old's surname sat in the
 * markup of every page that named her — including pages a stranger may read.
 * John, on the same day he asked for first names only: "links can still be
 * full name but maybe links to people might need to be the guids?"
 *
 * The rule it enforces, in the words of the ticket that settled it: **a name
 * shown publicly must be the name the site means to show, in the links as
 * well as in the text.**
 *
 * NOT A SHORTENED NAME IN THE ADDRESS, which was the cheaper idea and is
 * wrong: "Hanako Morris" and "Hanako Mori" both shorten to "Hanako M.", so an
 * address built from the shown name is an address that can mean two people.
 * An opaque id says nothing and collides with nobody.
 *
 * A record with no member keeps its name in the address, because the name is
 * all it has — a kept record from another site, or a name typed into a game
 * at one screen. `/players/[slug]` resolves both.
 */
export function playerPath(name: string, memberId?: string | null): string {
  if (memberId != null && memberId !== "") return `/players/${memberId}`;
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
