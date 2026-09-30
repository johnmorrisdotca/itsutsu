import { z } from "zod";

import { PARTY_KIND_LIST } from "../party.constants";
import { RULE_VARIANTS } from "../../gomoku/gomoku.constants";
import { KEPT_NAME_LONGEST, KEPT_SEATS_MOST, KEPT_STATE_LONGEST, KEPT_STATUS } from "./kept.constants";
import type { KeptReport, KeptStatus } from "./kept.types";

/**
 * EVERY GAME A BROWSER KEEPS ON ONE DEVICE, and so every game it may file: the
 * party games, the card games among them, and the four tables of the rule
 * variants played round one screen (Chinese Checkers, Halma, Block Five and
 * Pair Go). Anything else is refused by name.
 */
export const KEPT_GAME_KEYS: readonly string[] = [
  ...PARTY_KIND_LIST,
  RULE_VARIANTS.chineseCheckers,
  RULE_VARIANTS.halma,
  RULE_VARIANTS.blockFive,
  RULE_VARIANTS.go,
];

const reportSchema = z.object({
  game: z.string().max(40),
  state: z.string().min(1).max(KEPT_STATE_LONGEST),
  seats: z
    .array(z.object({ name: z.string().max(200), computer: z.boolean() }))
    .min(1)
    .max(KEPT_SEATS_MOST),
  over: z.boolean(),
  left: z.boolean().optional(),
  winners: z.array(z.number().int().nonnegative()).max(KEPT_SEATS_MOST),
});

/**
 * A GAME'S REPORT FROM THE BROWSER, read and settled, or the reason it is not
 * one. The server takes the browser's word for how the game went, and that is
 * a decision rather than an oversight: nothing is rated, paid or ranked from a
 * game kept on one device, so a report made up by hand misleads only the
 * person who made it up, about their own history. What is checked is the
 * shape — a game this site keeps, seats it could have, winners who sat there —
 * so a record never names a seat that was not at the table.
 */
export function readKeptReport(body: unknown): KeptReport | { refused: string } {
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) return { refused: "A game, how it stands, and who sat where." };
  const { game, state, seats, over } = parsed.data;
  if (!KEPT_GAME_KEYS.includes(game)) return { refused: "That game is not played on one device here." };
  const winners = [...new Set(parsed.data.winners)].sort((a, b) => a - b);
  if (winners.some((seat) => seat >= seats.length)) return { refused: "A winner who was not at the table." };
  return {
    game,
    state,
    seats: seats.map((seat) => ({ name: seat.name.trim().slice(0, KEPT_NAME_LONGEST), computer: seat.computer })),
    over,
    // A game over is finished whatever else is said; one put away half way is left.
    left: !over && parsed.data.left === true,
    // Nobody has won a game that is not over.
    winners: over ? winners : [],
  };
}

/** The status a report files its game under. */
export function keptStatusOf(report: Pick<KeptReport, "over" | "left">): KeptStatus {
  if (report.over) return KEPT_STATUS.finished;
  return report.left ? KEPT_STATUS.left : KEPT_STATUS.playing;
}

/** The seat that is the device's holder: the first a person sat in, or the first seat when every one was a computer. */
export function holderSeat(seats: KeptReport["seats"]): number {
  const first = seats.findIndex((seat) => !seat.computer);
  return first === -1 ? 0 : first;
}
