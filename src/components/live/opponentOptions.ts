import { botsFor } from "@/lib/bots/bots.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import type { Opponent } from "@/lib/social/opponents";

import { OPPONENT_GROUPS } from "./picker.constants";
import type { OpponentGroup, OpponentTile } from "./picker.types";
import type { SetUpOpponent } from "./setUp.types";

/**
 * What the opponent choice means.
 *
 * BOTH FORMS NAME A MEMBER BY ID, which is a change: people used to be named
 * by their address here, because the creation route took a challenge as an
 * email and only a computer player needed an id. A computer player has no
 * address because it never signs in, so the id was always the form that works
 * for everybody — and it has the better property besides, since a member's
 * address was being written into the page's markup for every buddy on the list
 * whether or not anybody was going to play them.
 *
 * `c:` is kept apart from `m:` because the two are offered differently — a
 * program is offered only at a game it plays — and because which of the two you
 * are looking at is a thing a reader and a test both want to be able to see.
 *
 * Moved here out of `OpponentChoice.tsx` when the select became tiles: which
 * people are offered, under which heading, is a decision, and a decision wants
 * a test beside it rather than a browser.
 */
export const ANYONE = "anyone";
const MEMBER = "m:";
const COMPUTER = "c:";

/** The choice's value for somebody the address has already named. */
export function valueFor(opponent: SetUpOpponent): string {
  return `${opponent.computer ? COMPUTER : MEMBER}${opponent.id}`;
}

/** The member id a chosen value names, or null for a posted seat. */
export function idIn(value: string): string | null {
  if (value.startsWith(MEMBER)) return value.slice(MEMBER.length);
  if (value.startsWith(COMPUTER)) return value.slice(COMPUTER.length);
  return null;
}

/**
 * Everybody this game can be offered to, in the runs the screen draws them in:
 * somebody the address asked for, whoever is here now, the players this member
 * knows, and the programs that play THIS game.
 *
 * The same four runs, in the same order, as the select's optgroups they replace.
 * A run with nobody in it is left out rather than drawn as an empty heading —
 * except that there is never nobody in the last, because the graded programs
 * play everything.
 *
 * A NAMED OPPONENT IS ADDED ONLY WHERE THE LIST DOES NOT ALREADY HOLD THEM. A
 * buddy asked for from their own page is in both, and the same person twice is
 * a chooser that cannot say which of the two is chosen. A program the address
 * named at a game it does not play IS added, as the select added it: the screen
 * then says the offer has lapsed (`set-up-not-offered`) and Start posts a seat
 * for anyone, which is `SetUpGame`'s decision and not this list's.
 */
export function opponentGroups({
  variant,
  opponents,
  named,
}: {
  variant: string;
  opponents: readonly Opponent[];
  named: SetUpOpponent | null;
}): OpponentGroup[] {
  const computers = botsFor(variant as RuleVariant);
  const person = (one: { id: string; name: string }): OpponentTile => ({
    value: `${MEMBER}${one.id}`,
    name: one.name,
    computer: false,
    tier: null,
  });
  const listed =
    named !== null &&
    (named.computer
      ? computers.some((bot) => bot.id === named.id)
      : opponents.some((one) => one.id === named.id));
  const extra = named === null || listed ? null : named;

  const groups: OpponentGroup[] = [
    {
      kind: OPPONENT_GROUPS.asked,
      tiles:
        extra === null
          ? []
          : [{ value: valueFor(extra), name: extra.name, computer: extra.computer, tier: null }],
    },
    { kind: OPPONENT_GROUPS.here, tiles: opponents.filter((one) => one.here).map(person) },
    { kind: OPPONENT_GROUPS.known, tiles: opponents.filter((one) => !one.here).map(person) },
    {
      kind: OPPONENT_GROUPS.computer,
      tiles: computers.map((bot) => ({
        value: `${COMPUTER}${bot.id}`,
        name: bot.name,
        computer: true,
        tier: bot.tier,
      })),
    },
  ];
  return groups.filter((group) => group.tiles.length > 0);
}

/**
 * The tile that shows as chosen: the value, where a tile holds it, and the
 * posted seat otherwise.
 *
 * The select this replaced did exactly that without being asked — a select
 * whose value matches no option shows its first, which was "for anyone" — and
 * a row of tiles does not: with nothing matching, nothing is ticked, and a
 * screen with no answer marked is the fault the board picker already had once.
 */
export function shownChoice(value: string, groups: readonly OpponentGroup[]): string {
  return groups.some((group) => group.tiles.some((tile) => tile.value === value)) ? value : ANYONE;
}
