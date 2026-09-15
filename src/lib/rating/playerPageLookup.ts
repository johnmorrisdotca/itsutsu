import "server-only";

import { findMemberById, findMemberByName } from "@/lib/auth/members";
import { fetchPlayerRecord } from "@/lib/history/playerRecord";
import { playerKey, playerKeysFromSlug } from "@/lib/rating/playerKey";
import { fetchPlayer } from "@/lib/rating/players";

/**
 * WHO A PLAYER'S ADDRESS NAMES: the member, their rating row and their record.
 *
 * Split out of `src/app/players/[slug]/page.tsx` when that page reached the
 * file-size gate. Deciding who an address means is one job and drawing their
 * page is another; the page asks this and draws whatever it answers.
 */
export async function lookUpPlayer(slug: string) {
  /*
   * The address holds a folded name with hyphens for spaces, and folding
   * cannot be undone: "anne-marie" is either one hyphenated name or two
   * words. So both readings are looked for, and whichever finds somebody is
   * the player this address means.
   */
  /*
   * AN ID FIRST, A NAME AFTER. Every link to a person now builds
   * `/players/<id>` — see `playerPath` — because a link built from the name
   * put a member's whole surname in the markup of every page that named them,
   * under a screen that was carefully showing only "Hanako M.".
   *
   * The name reading stays underneath and is not a fallback in the apologetic
   * sense: a kept record from another site, or a name typed into a game at one
   * screen, has no member and its address is its name. Both are real addresses
   * and this resolves either.
   */
  const byId = await findMemberById(slug);
  const looked = byId !== null
    ? [
        await (async () => {
          const key = playerKey(byId.name);
          const [player, record] = await Promise.all([
            fetchPlayer(key, byId.id ?? null),
            fetchPlayerRecord(key, byId.id ?? null),
          ]);
          return { key, player, record, member: byId };
        })(),
      ]
    : await Promise.all(
    playerKeysFromSlug(slug).map(async (key) => {
      /*
       * The MEMBER is looked up first and the record is then asked for as
       * theirs. A rating and a record are keyed by the folded name they were
       * earned under, and that name does not move when somebody renames — so
       * asking by today's name alone answered zero for a member with seven
       * games. The member is findable by their current name; everything else
       * hangs off their id from here.
       */
      const member = await findMemberByName(key);
      const [player, record] = await Promise.all([
        fetchPlayer(key, member?.id ?? null),
        fetchPlayerRecord(key, member?.id ?? null),
      ]);
      return { key, player, record, member };
    }),
  );

  return (
    looked.find((one) => one.player !== null || one.record.games > 0 || one.member !== null) ?? looked[0]
  );
}
