import { playerPath } from "@/lib/rating/playerKey";
import { GAME_POOL_DISPLAY, GAME_RATED_DISPLAY, outcomeLabel, verdictLabel } from "./gameHistory.constants";

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
 * The chips a record's filter bar shows for what was narrowed — read from
 * the record's OWN idea of the player filter (`AppliedPlayer`, handed down
 * by `RecordPage`) rather than re-derived from the URL, so a filter the
 * address implies rather than the query string still shows consistently —
 * see /games/<slug>/me.
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
    outcome === "" ? null : { key: "outcome", label: outcomeLabel(outcome) },
    pool === "" ? null : { key: "pool", label: GAME_POOL_DISPLAY[pool]?.label ?? pool },
    rated === "" ? null : { key: "rated", label: GAME_RATED_DISPLAY[rated]?.label ?? rated },
    verdict === "" ? null : { key: "verdict", label: verdictLabel(verdict) },
  ];
  return list.filter((one): one is Narrowing => one !== null);
}
