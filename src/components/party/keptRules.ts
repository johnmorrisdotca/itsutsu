import type { KeptRecordRules } from "@/lib/party/kept/kept.types";

/**
 * HOW EACH STORE ON ONE DEVICE DESCRIBES ITS GAME TO THE HISTORY
 * (`keptRecord.ts`): three shapes of table, one helper each, so every store
 * says which game it keeps and hands over its own rules' `over` and
 * `winners` rather than restating them.
 */

/** A party game (and every card game): names in seat order, and which seats a computer plays where the game has them. */
export function partyRecord<Game extends { players: readonly string[]; computers?: readonly boolean[] }>(
  game: string,
  rules: { over: (game: Game) => boolean; winners: (game: Game) => readonly number[] },
): KeptRecordRules<Game> {
  return {
    game,
    over: rules.over,
    winners: rules.winners,
    seats: (kept) => kept.players.map((name, seat) => ({ name, computer: kept.computers?.[seat] === true })),
  };
}

/** A table of the rule variants round one screen (the races, Block Five, Pair Go): named players, all people. */
export function tableRecord<Game>(
  game: string,
  rules: { over: (game: Game) => boolean; winners: (game: Game) => readonly number[]; names: (game: Game) => readonly string[] },
): KeptRecordRules<Game> {
  return {
    game,
    over: rules.over,
    winners: rules.winners,
    seats: (kept) => rules.names(kept).map((name) => ({ name, computer: false })),
  };
}
