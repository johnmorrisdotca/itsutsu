import { TENKA_MOVES, TENKA_PHASES } from "./tenka.constants.ts";
import type { TenkaChoice, TenkaGame, TenkaMapMarks, TenkaMove } from "./tenka.types.ts";
import { mustTrade } from "./tenka.ts";
import { areNeighbours, connectedOwn, tenkaNeighbours } from "./tenkaMap.ts";

/**
 * WHAT A TAP ON THE MAP MEANS, in each part of a turn — and what the map
 * lights up for it. Pure, so the table's screen only asks: nothing here
 * decides a rule, it only chooses which move to ask the rules for.
 *
 *   Place    a tap on your own territory puts one army there.
 *   Attack   a tap on yours (two armies or more) chooses where from, and its
 *            neighbours you may attack light up; a tap on one of those is the
 *            target. Tap yours again to put it down.
 *   Fortify  the same, with your own territories joined to it by your own
 *            land lit up as where the armies may go.
 */

export const NO_CHOICE: TenkaChoice = { from: null, to: null, armies: 0, placedOn: null };

function isOwn(game: TenkaGame, territory: number): boolean {
  return game.owners[territory] === game.toPlay;
}

function canLeave(game: TenkaGame, territory: number): boolean {
  return isOwn(game, territory) && game.armies[territory] >= 2;
}

/** A choice made on an earlier map, read against this one: only what still stands, and a number of armies the move can take. */
export function choiceNow(game: TenkaGame, choice: TenkaChoice): TenkaChoice {
  switch (game.phase) {
    case TENKA_PHASES.reinforce:
      return { ...NO_CHOICE, placedOn: choice.placedOn !== null && isOwn(game, choice.placedOn) ? choice.placedOn : null };
    case TENKA_PHASES.attack: {
      const from = choice.from !== null && canLeave(game, choice.from) ? choice.from : null;
      const to = from !== null && choice.to !== null && !isOwn(game, choice.to) && areNeighbours(from, choice.to) ? choice.to : null;
      return { ...NO_CHOICE, from, to };
    }
    case TENKA_PHASES.occupy: {
      const taking = game.occupying!;
      const most = game.armies[taking.from] - 1;
      const armies = choice.armies >= taking.least && choice.armies <= most ? choice.armies : most;
      return { ...NO_CHOICE, from: taking.from, to: taking.to, armies };
    }
    case TENKA_PHASES.fortify: {
      const from = choice.from !== null && canLeave(game, choice.from) ? choice.from : null;
      const to = from !== null && choice.to !== null && connectedOwn(game.owners, from).includes(choice.to) ? choice.to : null;
      const most = from === null ? 0 : game.armies[from] - 1;
      return { ...NO_CHOICE, from, to, armies: to === null ? 0 : choice.armies >= 1 && choice.armies <= most ? choice.armies : most };
    }
    default:
      return NO_CHOICE;
  }
}

/** What tapping `territory` does now: a new choice, and the move to make at once, if the tap is one. */
export function tapTerritory(game: TenkaGame, choice: TenkaChoice, territory: number): { choice: TenkaChoice; move: TenkaMove | null } {
  const now = choiceNow(game, choice);
  switch (game.phase) {
    case TENKA_PHASES.setUp:
      return { choice: now, move: isOwn(game, territory) ? { kind: TENKA_MOVES.place, territory, armies: 1 } : null };
    case TENKA_PHASES.reinforce:
      if (!isOwn(game, territory) || mustTrade(game)) return { choice: now, move: null };
      return { choice: { ...now, placedOn: territory }, move: { kind: TENKA_MOVES.place, territory, armies: 1 } };
    case TENKA_PHASES.attack:
      if (territory === now.from) return { choice: NO_CHOICE, move: null };
      if (canLeave(game, territory)) return { choice: { ...NO_CHOICE, from: territory }, move: null };
      if (now.from !== null && !isOwn(game, territory) && areNeighbours(now.from, territory)) return { choice: { ...now, to: territory }, move: null };
      return { choice: now, move: null };
    case TENKA_PHASES.fortify:
      if (territory === now.from) return { choice: NO_CHOICE, move: null };
      if (now.from !== null && connectedOwn(game.owners, now.from).includes(territory)) {
        return { choice: { ...now, to: territory, armies: game.armies[now.from] - 1 }, move: null };
      }
      if (canLeave(game, territory)) return { choice: { ...NO_CHOICE, from: territory }, move: null };
      return { choice: now, move: null };
    default:
      return { choice: now, move: null };
  }
}

/** What the map lights up for a choice. */
export function marksFor(game: TenkaGame, choice: TenkaChoice): TenkaMapMarks {
  const now = choiceNow(game, choice);
  switch (game.phase) {
    case TENKA_PHASES.attack:
      return {
        chosen: now.from,
        reach: now.from === null ? [] : tenkaNeighbours(now.from).filter((next) => !isOwn(game, next)),
        target: now.to,
      };
    case TENKA_PHASES.occupy:
      return { chosen: now.from, reach: [], target: now.to };
    case TENKA_PHASES.fortify:
      return { chosen: now.from, reach: now.from === null ? [] : connectedOwn(game.owners, now.from), target: now.to };
    case TENKA_PHASES.reinforce:
      return { chosen: now.placedOn, reach: [], target: null };
    default:
      return { chosen: null, reach: [], target: null };
  }
}
