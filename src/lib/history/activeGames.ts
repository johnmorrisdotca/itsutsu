import "server-only";

import { isBotId } from "@/lib/bots/bots";
import { prisma } from "@/lib/prisma";

/**
 * How many games in progress is too many for one member to be holding at
 * once.
 *
 * Not a setting anybody tunes: this is a backstop against a board nobody could
 * actually be keeping up with. Twenty boards is already more than a person
 * plays in a week on a site where a game can take days between moves — a
 * twenty-first is not the one that was waiting on them.
 *
 * It said "fixed rather than configurable" when it was written, and that was
 * right about the site and wrong about the suite, which found out the hard
 * way: the end-to-end run drives the whole site as one member and starts a
 * game in most of four hundred tests, so it reached twenty within the first
 * few files and then failed everything after them with a message about a
 * limit that has nothing to do with what was being tested. Tidying between
 * runs cannot help — the games are real, two-seated and still being played;
 * it is one member playing four hundred games that the site never expected.
 *
 * So it is relieved exactly the way the rate limits are, by the same variable
 * for the same reason, and with the same two things it can never do: it is
 * ignored outright in production, and a relief nobody set changes nothing.
 * One knob rather than two, because a second one is a second thing to forget
 * in a fresh clone — see `RATE_LIMIT_RELIEF` in AGENTS.md.
 *
 * The computer players are left out of it. They exist to always have a seat
 * open, the directory says so, and a batch of games started against one on
 * purpose is not the runaway pile this limit is for — see `isBotId` below.
 */
export const ACTIVE_GAME_LIMIT = 20;

/** The limit as it applies here and now: the number above, unless relieved for the suite. */
export function activeGameLimit(): number {
  if (process.env.NODE_ENV === "production") return ACTIVE_GAME_LIMIT;
  const relief = Number(process.env.RATE_LIMIT_RELIEF ?? "1");
  if (!Number.isFinite(relief) || relief < 1) return ACTIVE_GAME_LIMIT;
  return ACTIVE_GAME_LIMIT * Math.floor(relief);
}

/** How many games this member is seated in that are still being played. */
export async function activeGameCount(memberId: string): Promise<number> {
  return prisma.game.count({
    where: {
      status: "active",
      OR: [{ blackMemberId: memberId }, { whiteMemberId: memberId }],
    },
  });
}

/**
 * The first of the seats a new game would fill that is already carrying
 * twenty games, or null when none of them are.
 *
 * Takes every seat a creation could bind rather than only the person asking
 * for the game: a challenge fills the other seat too, and the member on the
 * receiving end is just as unable to keep up with a twenty-first board as
 * the member sending it. Anonymous seats and computer players never trip it
 * — an anonymous seat belongs to no member to be over the limit, and a
 * computer player is exempt by design (see `ACTIVE_GAME_LIMIT`).
 */
export async function memberOverActiveLimit(
  memberIds: readonly (string | null | undefined)[],
): Promise<string | null> {
  const candidates = [...new Set(memberIds.filter((id): id is string => !!id && !isBotId(id)))];
  for (const id of candidates) {
    if ((await activeGameCount(id)) >= activeGameLimit()) return id;
  }
  return null;
}
