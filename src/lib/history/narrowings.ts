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
};

export type Narrowing = {
  key: string;
  label: string;
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
        },
    outcome === "" || (player === null && outcomeNeedsPlayer(outcome))
      ? null
      : { key: "outcome", label: outcomeLabel(outcome) },
    pool === "" ? null : { key: "pool", label: GAME_POOL_DISPLAY[pool]?.label ?? pool },
    rated === "" ? null : { key: "rated", label: GAME_RATED_DISPLAY[rated]?.label ?? rated },
    // Unlike outcome, verdict has no player-independent reading at all — see verdictWhere.
    verdict === "" || player === null ? null : { key: "verdict", label: verdictLabel(verdict) },
  ];
  return list.filter((one): one is Narrowing => one !== null);
}
