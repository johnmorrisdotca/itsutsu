import { playerPath } from "@/lib/rating/playerKey";
import {
  GAME_POOL_DISPLAY,
  GAME_RATED_DISPLAY,
  outcomeLabel,
  verdictLabel,
} from "./gameHistory.constants";
import { outcomeNeedsPlayer } from "./gameHistoryQuery";

/**
 * A player filter as the record actually applied it — never as an address
 * merely claims it.
 *
 * `removable` is false for a filter the address itself implies rather than
 * something a reader typed or a link asked for: /games/<slug>/me always
 * means "my games", on every page of it, so there is nothing for a chip's
 * "×" to take off. `memberId` travels alongside the name for the same reason
 * `playerPath` always prefers one — see its own comment — so a chip that
 * cannot be removed can still lead somewhere real instead of sitting inert.
 */
export type AppliedPlayer = {
  name: string;
  memberId: string | null;
  removable: boolean;
  /** Which parameter named them, when it was `?member=<id>` rather than `?player=`. See `Narrowing.clears`. */
  via?: "member";
};

export type Narrowing = {
  key: string;
  label: string;
  /**
   * The parameter a "×" has to delete, where that is not the chip's own key.
   *
   * A PLAYER ARRIVES BY TWO SPELLINGS NOW, and the way back has to know which
   * one it is looking at. Every count on the site links by `?member=<id>` since
   * the 0.133.0 rule reached `gamesHref`, and a chip that cleared `player`
   * would leave the record exactly as narrowed as it found it — a filter a
   * reader is invited to take off and cannot. "Test the way back, not just the
   * way there" is a section of AGENTS.md for this shape of bug.
   *
   * The key stays `player` either way, because what the chip is ABOUT has not
   * changed and the bar should not read differently depending on which
   * spelling brought the reader here.
   */
  clears?: string;
  /** Present when this chip leads to the player's own page instead of removing anything. */
  href?: string;
};

/**
 * The chips a record's filter bar is honest to show — never a narrowing the
 * query did not actually apply.
 *
 * `outcome` and `verdict` are answers to "how did it go for somebody, and
 * what did they think of it", and unanswerable without a name to read them
 * against — `gameHistoryQuery.ts` already drops them from the WHERE clause
 * for exactly that reason (`outcomeNeedsPlayer`, and `verdictWhere`'s own
 * unconditional check). A chip built from the address alone does not know
 * that happened, and ends up claiming a narrowing the query never applied —
 * `/history?outcome=won` with no `player` reads "Won" over the whole record.
 * Reading `outcomeNeedsPlayer` here, the same predicate the query reads, is
 * what keeps the chip from being a second, driftable opinion about the same
 * fact.
 */
export function appliedNarrowings(input: {
  player: AppliedPlayer | null;
  outcome: string;
  pool: string;
  rated: string;
  verdict: string;
}): Narrowing[] {
  const { player, outcome, pool, rated, verdict } = input;
  const list: (Narrowing | null)[] = [
    player === null
      ? null
      : {
          key: "player",
          label: `${player.name}'s games`,
          href: player.removable ? undefined : playerPath(player.name, player.memberId),
          ...(player.via === "member" ? { clears: "member" } : {}),
        },
    outcome === "" || (player === null && outcomeNeedsPlayer(outcome))
      ? null
      : named("outcome", outcomeLabel(outcome)),
    named("pool", pool === "" ? null : (GAME_POOL_DISPLAY[pool]?.label ?? null)),
    named("rated", rated === "" ? null : (GAME_RATED_DISPLAY[rated]?.label ?? null)),
    // Unlike outcome, verdict has no player-independent reading at all — see verdictWhere.
    verdict === "" || player === null ? null : named("verdict", verdictLabel(verdict)),
  ];
  return list.filter((one): one is Narrowing => one !== null);
}

/**
 * A chip, or none at all where this site has no word for what was asked.
 *
 * IN THE SITE'S OWN WORDS OR NOT AT ALL, never in the address's. Each of these
 * four used to fall back to the raw parameter — `?pool=all` drew a chip reading
 * "all", `?rated=all` one reading "all", and any value the schema does not know
 * drew itself — which is the same fault twice over. It printed a query string
 * where a sentence goes, and it printed it for exactly the two cases where the
 * query applies NOTHING: `all` is what this site calls the absence of a
 * narrowing (the filter bar deletes the parameter when you choose it), and an
 * unrecognised value is refused outright.
 *
 * So the chip bar was claiming a narrowing that had not happened, which is the
 * one thing this module exists to prevent, and the reason it reads
 * `outcomeNeedsPlayer` rather than guessing. A missing word is the same kind of
 * answer: the query did not narrow anything, so there is nothing to announce
 * and nothing for a "×" to take off.
 */
function named(key: string, label: string | null): Narrowing | null {
  return label === null ? null : { key, label };
}
