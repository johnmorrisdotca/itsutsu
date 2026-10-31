"use client";

import type { DiceTableKind } from "@/lib/party/diceTable/diceTable.constants";
import { scoreWords } from "@/lib/party/diceTable/diceTableRules";
import { TEN_THOUSAND_RULES } from "@/lib/party/tenThousand/tenThousand";
import type { TenThousandGame, TenThousandMove } from "@/lib/party/tenThousand/tenThousand.types";
import { LIARS_RULES } from "@/lib/party/liarsDice/liarsDice";
import type { LiarsGame, LiarsMove } from "@/lib/party/liarsDice/liarsDice.types";
import { PIG_RULES } from "@/lib/party/pig/pig";
import type { PigGame, PigMove } from "@/lib/party/pig/pig.types";
import { SAYU_RULES } from "@/lib/party/sayu/sayu";
import type { SayuGame, SayuMove } from "@/lib/party/sayu/sayu.types";

import type { DiceTableRow } from "./diceTable.types";
import { LiarsBoard } from "./LiarsBoard";
import { PigBoard } from "./PigBoard";
import { SayuBoard } from "./SayuBoard";
import { TenThousandBoard } from "./TenThousandBoard";

const PIG_ROW: DiceTableRow<PigGame, PigMove> = {
  rules: PIG_RULES,
  Board: PigBoard,
  hidden: false,
  sizeLegend: (say) => say.say("party.dice.playTo"),
  sizeWord: (size, say) => say.say("party.dice.pointsTo", { points: String(size) }),
  standing: (game, seat, say) => say.say("party.dice.points", { points: String(game.banked[seat] ?? 0) }),
  thrown: (game) => game.thrown,
};

const TEN_THOUSAND_ROW: DiceTableRow<TenThousandGame, TenThousandMove> = {
  rules: TEN_THOUSAND_RULES,
  Board: TenThousandBoard,
  hidden: false,
  sizeLegend: (say) => say.say("party.dice.playTo"),
  sizeWord: (size, say) => say.say("party.dice.pointsTo", { points: scoreWords(size) }),
  standing: (game, seat, say) => say.say("party.dice.points", { points: scoreWords(game.banked[seat] ?? 0) }),
  thrown: (game) => game.thrown,
};

const LIARS_ROW: DiceTableRow<LiarsGame, LiarsMove> = {
  rules: LIARS_RULES,
  Board: LiarsBoard,
  hidden: true,
  sizeLegend: (say) => say.say("party.dice.liars.diceEach"),
  sizeWord: (size, say) => say.count("party.dice.liars.dice", size),
  standing: (game, seat, say) => ((game.cups[seat]?.length ?? 0) === 0 ? say.say("party.dice.liars.out") : say.count("party.dice.liars.dice", game.cups[seat]!.length)),
  thrown: (game) => game.thrown,
};

const SAYU_ROW: DiceTableRow<SayuGame, SayuMove> = {
  rules: SAYU_RULES,
  Board: SayuBoard,
  hidden: false,
  sizeLegend: (say) => say.say("party.dice.sayu.startWith"),
  sizeWord: (size, say) => say.count("party.dice.sayu.count", size),
  standing: (game, seat, say) => say.count("party.dice.sayu.count", game.counters[seat] ?? 0),
  thrown: (game) => game.thrown,
};

/**
 * EACH PLAIN DICE GAME AT THE TABLE, by kind. The table is one set of components
 * for all four, as the card games' is; what differs is here. Held as unknown
 * games and moves, because the table never looks inside either: it hands them
 * back to the game's own board and rules.
 */
export const DICE_TABLE_ROWS: Record<DiceTableKind, DiceTableRow<unknown, unknown>> = {
  pig: PIG_ROW as unknown as DiceTableRow<unknown, unknown>,
  tenThousand: TEN_THOUSAND_ROW as unknown as DiceTableRow<unknown, unknown>,
  liarsDice: LIARS_ROW as unknown as DiceTableRow<unknown, unknown>,
  sayu: SAYU_ROW as unknown as DiceTableRow<unknown, unknown>,
};

