import { BROWSER_MOVE_MILLIS } from "@/lib/gomoku/botWorker.constants";
import { chooseTurn } from "@/lib/gomoku/opponent";
import type { BotTier } from "@/lib/gomoku/opponent.types";
import type { PairGoGame } from "@/lib/gomoku/party/pairGo.types";
import { judgeTiles } from "@/lib/puzzles/kumimoji/computerPlay";
import { planComputerTurn } from "@/lib/puzzles/kumimoji/computerTurn";
import type { PartyGame } from "@/lib/puzzles/kumimoji/party.types";
import { handCanSpell } from "@/lib/puzzles/kumimoji/partyTurns";
import { loadTileWords, tileWords } from "@/lib/puzzles/kumimoji/tileWords";

import { computerMove } from "@johnmorrisdotca/domino";
import type { TrainGame, TrainMove } from "@johnmorrisdotca/domino";
import { type HitotsuGame, type HitotsuMove, tableComputerMove } from "@johnmorrisdotca/hitotsu";

import { SUGOROKU_KIND_LIST, SUGOROKU_STRENGTHS } from "../sugoroku/sugoroku.constants";
import type { SugorokuMove, SugorokuTable } from "../sugoroku/sugoroku.types";
import { sugorokuComputerMove } from "../sugoroku/sugorokuTable";
import { CARD_GAME_RULES } from "@/lib/cardGames/cardGameRules";
import { CARD_GAME_LIST, type CardGameKind } from "@/lib/cardGames/cardGames.constants";
import { DICE_TABLE_KINDS, type DiceTableKind } from "../diceTable/diceTable.constants";
import { DICE_TABLE_RULES } from "../diceTable/diceTableRules";
import { pachisiComputerMove } from "../pachisi/pachisiComputer";
import type { PachisiGame, PachisiMove } from "../pachisi/pachisi.types";
import { yachtComputerMove } from "../yacht/yachtComputer";
import type { YachtGame, YachtMove } from "../yacht/yacht.types";
import type { OnlineComputerPlay, OnlineGameKey } from "./online.types";
import type { DiceWarPress, DiceWarTable } from "./onlineDice";
import { seatOf, type KumimojiMove, type KumimojiStage } from "./onlineKumimoji";
import type { PairGoMove } from "./onlinePairGo";

/**
 * HOW EACH GAME'S COMPUTER MOVES AT A TABLE ON SEVERAL DEVICES — read by the
 * worker (`onlineComputerWorker.ts`) and nothing else, so neither a search nor
 * a word list is ever in a server function's bundle, let alone run there. Who
 * a computer sits as, and which there are, is the rules row's
 * (`OnlineComputers`); this is only the move.
 */

/** Pair Go: the ladder's chooser on the browser's budget, playing the colour the engine has to move; a program with nothing to play passes. */
const PAIR_GO_COMPUTER: OnlineComputerPlay<PairGoGame, PairGoMove> = {
  move: (game, _seat, level) => {
    const turn = chooseTurn(game.state, level as BotTier, Math.random, { millis: BROWSER_MOVE_MILLIS });
    return turn !== null && turn.kind === "place" ? { kind: "stone", row: turn.row, col: turn.col } : { kind: "pass" };
  },
};

/**
 * Kumimoji: the pass-and-play game's own computer player (`planComputerTurn`),
 * its whole turn sent as the presses it made — every Draw, then Done or
 * Resign — each with the seat as it stood, the table judged by the word list
 * loaded here first.
 */
const KUMIMOJI_COMPUTER: OnlineComputerPlay<PartyGame, KumimojiMove> = {
  prepare: async (game) => {
    await loadTileWords(game.settings.language);
  },
  move: (game) => {
    const words = tileWords(game.settings.language);
    const rules = { diagonals: game.settings.diagonals };
    const stages: KumimojiStage[] = [];
    let before = game;
    for (const step of planComputerTurn(game, words)) {
      const player = before.players[before.turn]!;
      const sound = judgeTiles(player.tiles, words, rules).sound;
      if (step.said.kind === "drew") stages.push({ seat: seatOf(before), then: "draw", sound, spells: false });
      if (step.said.kind === "done") stages.push({ seat: seatOf(before), then: "done", sound, spells: handCanSpell(player.hand, words) });
      if (step.said.kind === "resigned") stages.push({ seat: seatOf(before), then: "resign", sound, spells: false });
      before = step.game;
    }
    return stages.length === 0 ? null : { stages };
  },
};

/** Mexican Train: the table's own computer player (`computerMove`), one move at a time, as on one device. */
const TRAIN_COMPUTER: OnlineComputerPlay<TrainGame, TrainMove> = {
  move: (game) => computerMove(game),
};

/** Hitotsu: the package's computer player, for the seat the table waits on, as on one device (`tableComputerMove`). */
const HITOTSU_COMPUTER: OnlineComputerPlay<HitotsuGame, HitotsuMove> = {
  move: tableComputerMove,
};

/** The backgammon games: the package's computer player at the strength the seat was given, for the seat the table waits on — a double, an answer to one, or a play of the roll. */
const SUGOROKU_COMPUTER: OnlineComputerPlay<SugorokuTable, SugorokuMove> = {
  move: (game, _seat, level) => {
    const strength = SUGOROKU_STRENGTHS.find((one) => one === level);
    return strength === undefined ? null : sugorokuComputerMove(game, strength);
  },
};

/** The dice games: the same computer each plays with on one device, reading only what its seat may know. */
const YACHT_COMPUTER: OnlineComputerPlay<YachtGame, YachtMove> = { move: (game) => yachtComputerMove(game) };
const PACHISI_COMPUTER: OnlineComputerPlay<PachisiGame, PachisiMove> = { move: (game) => pachisiComputerMove(game) };
/** A war left to computers: the press that makes the server throw for them. */
const DICE_WAR_COMPUTER: OnlineComputerPlay<DiceWarTable, DiceWarPress> = { move: () => ({ kind: "roll" }) };
const diceTableComputer = (kind: DiceTableKind): OnlineComputerPlay<unknown, unknown> => ({ move: (game) => DICE_TABLE_RULES[kind].computer(game) });

/** A card game: Toranpu's computer player, from that seat's own view of the game (`seenByCardSeat`), which is all this worker is handed. */
const cardComputer = (kind: CardGameKind): OnlineComputerPlay<unknown, unknown> => ({ move: (game) => (CARD_GAME_RULES[kind] as unknown as { computer: (game: unknown) => unknown }).computer(game) });

/** Every game with a computer player, by game; the move and game are each row's own, read one row at a time. */
const MOVES: Partial<Record<OnlineGameKey, OnlineComputerPlay<never, unknown>>> = {
  go: PAIR_GO_COMPUTER as unknown as OnlineComputerPlay<never, unknown>,
  kumimoji: KUMIMOJI_COMPUTER as unknown as OnlineComputerPlay<never, unknown>,
  mexicanTrain: TRAIN_COMPUTER as unknown as OnlineComputerPlay<never, unknown>,
  hitotsu: HITOTSU_COMPUTER as unknown as OnlineComputerPlay<never, unknown>,
  yacht: YACHT_COMPUTER as unknown as OnlineComputerPlay<never, unknown>,
  pachisi: PACHISI_COMPUTER as unknown as OnlineComputerPlay<never, unknown>,
  diceWar: DICE_WAR_COMPUTER as unknown as OnlineComputerPlay<never, unknown>,
  ...Object.fromEntries(CARD_GAME_LIST.map((kind) => [kind, cardComputer(kind) as unknown as OnlineComputerPlay<never, unknown>])),
  ...Object.fromEntries(DICE_TABLE_KINDS.map((kind) => [kind, diceTableComputer(kind) as unknown as OnlineComputerPlay<never, unknown>])),
  ...Object.fromEntries(SUGOROKU_KIND_LIST.map((kind) => [kind, SUGOROKU_COMPUTER as unknown as OnlineComputerPlay<never, unknown>])),
};

/** A game's computer move, for the worker; undefined for a game with no computer player. */
export function computerPlayOf(game: OnlineGameKey): OnlineComputerPlay<unknown, unknown> | undefined {
  return MOVES[game] as OnlineComputerPlay<unknown, unknown> | undefined;
}
