import * as chains from "@johnmorrisdotca/houseki/colour-chains";
import * as triplets from "@johnmorrisdotca/houseki/falling-triplets";
import * as swap from "@johnmorrisdotca/houseki/gem-swap";
import * as blocks from "@johnmorrisdotca/houseki/magnetic-blocks";
import * as stones from "@johnmorrisdotca/houseki/stone-collapse";

import { HOUSEKI_SPECS, levelsIn } from "./houseki.constants";
import type { HousekiPriced } from "../points/housekiLadder";
import { marksOf } from "./housekiMarks.data";
import type { HousekiCampaign, HousekiKind, HousekiRequest } from "./houseki.types";

/**
 * WHAT THE SERVER DOES FOR A WON LEVEL: plays the game again.
 *
 * The browser sends the finished game's own save, which is the package's text
 * for the seed and the moves a player made. `decodeGame` is the package's
 * referee: it makes the game afresh from its settings and applies every
 * recorded move in order, and it refuses a save whose moves do not lead where
 * they say. So nothing here trusts a score or a claim of winning: it reads the
 * state the replay arrives at. What is checked on top is that it is the game
 * that was asked for (this very level, with the board the package gives it, or
 * this day's Daily) and that it ended won (or, for a Daily, that it ran to its
 * end).
 *
 * The work is the length of the moves, once, for a win: the same order of work
 * as a puzzle's check. It is never done for a lesson or a free game, which pay
 * nothing, and a save too long to be a game is refused unread.
 */
export type Verified =
  | { ok: true; campaign: HousekiPriced; levelKey: string; number: number; marks: number; score: number; save: string }
  | { ok: false; why: HousekiRefusal };

/** Why a win was not counted, as a code the route says in words (`/api/houseki/win`). */
export type HousekiRefusal = "not-counted" | "not-a-game" | "no-daily" | "no-such-level" | "not-that-level" | "not-won" | "not-today" | "daily-not-finished" | "would-not-replay";

/** The longest a save may be for the server to read it: a game of a hundred pieces is a few thousand characters, and a thousand a megabyte. */
export const HOUSEKI_SAVE_LONGEST = 400_000;

/** A value with its keys in order, so that two of them can be told apart by their text alone. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

/** The day before a day, so a Daily finished just after midnight UTC still counts for the day it was made on. */
function dayBefore(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

const refuse = (why: HousekiRefusal): Verified => ({ ok: false, why });

/** The campaign's level, or null. */
function campaignLevel(kind: HousekiKind, campaign: HousekiCampaign, number: number): { id: string; seed?: string | number } | null {
  if (number < 1 || number > levelsIn(kind, campaign)) return null;
  if (kind === "fallingTriplets") return triplets.levelManifest[number - 1] ?? null;
  if (kind === "colourChains") return { classic: chains.levelManifest, shizen: chains.shizenLevelManifest, arashi: chains.arashiLevelManifest }[campaign][number - 1] ?? null;
  if (kind === "stoneCollapse") return stones.levelManifest[number - 1] ?? null;
  if (kind === "gemSwap") return swap.GEM_SWAP_CAMPAIGN[number - 1] ?? null;
  return blocks.levelManifest[number - 1] ?? null;
}

/** Plays a save again and says what it was a game of, and how it ended. */
export function verifyHousekiWin(kind: HousekiKind, request: HousekiRequest, text: string, today: string): Verified {
  if (request.kind !== "level" && request.kind !== "daily") return refuse("not-counted");
  if (text.length === 0 || text.length > HOUSEKI_SAVE_LONGEST) return refuse("not-a-game");
  const spec = HOUSEKI_SPECS[kind];
  if (request.kind === "daily" && !spec.daily) return refuse("no-daily");
  const campaign: HousekiPriced = request.kind === "daily" ? "daily" : request.campaign;
  const level = request.kind === "level" ? campaignLevel(kind, request.campaign, request.number) : null;
  if (request.kind === "level" && level === null) return refuse("no-such-level");
  const marks = request.kind === "level" ? marksOf(kind, request.campaign, request.number) : 0;
  if (marks === null) return refuse("no-such-level");
  const days = [today, dayBefore(today)];

  try {
    if (kind === "fallingTriplets") {
      const state = triplets.decodeGame(text);
      const s = state.settings;
      if (level !== null) {
        if (!(s.mode === "challenge" && s.seed === (level as { seed: string }).seed && canonical(s) === canonical(triplets.createLevel(level.id).settings))) return refuse("not-that-level");
        if (state.phase !== "won") return refuse("not-won");
        return { ok: true, campaign, levelKey: level.id, number: request.kind === "level" ? request.number : 0, marks, score: state.score, save: text };
      }
      if (!(s.mode === "daily" && days.includes(String(s.seed)))) return refuse("not-today");
      if (state.phase !== "finished" && state.phase !== "won") return refuse("daily-not-finished");
      return { ok: true, campaign, levelKey: String(s.seed), number: 0, marks, score: state.score, save: text };
    }
    if (kind === "colourChains") {
      const state = chains.decodeGame(text);
      const s = state.settings;
      if (level !== null) {
        const made = request.kind === "level" && request.campaign === "shizen" ? chains.createShizenLevel(level.id) : request.kind === "level" && request.campaign === "arashi" ? chains.createArashiLevel(level.id) : chains.createLevel(level.id);
        if (!(s.mode === "challenge" && s.challengeId === level.id && canonical(s) === canonical(made.settings))) return refuse("not-that-level");
        if (state.phase !== "won") return refuse("not-won");
        return { ok: true, campaign, levelKey: level.id, number: request.kind === "level" ? request.number : 0, marks, score: state.score, save: text };
      }
      if (!(s.mode === "daily" && s.date !== undefined && days.includes(s.date))) return refuse("not-today");
      if (state.phase !== "finished" && state.phase !== "won") return refuse("daily-not-finished");
      return { ok: true, campaign, levelKey: s.date, number: 0, marks, score: state.score, save: text };
    }
    if (kind === "stoneCollapse") {
      const state = stones.decodeGame(text);
      const s = state.settings;
      if (level !== null) {
        if (!(s.mode === "challenge" && s.challengeId === level.id && canonical(state.challenge) === canonical(stones.createLevel(level.id).challenge))) return refuse("not-that-level");
        if (state.phase !== "won") return refuse("not-won");
        return { ok: true, campaign, levelKey: level.id, number: request.kind === "level" ? request.number : 0, marks, score: state.score, save: text };
      }
      if (!(s.mode === "daily" && s.dailyDate !== undefined && days.includes(s.dailyDate))) return refuse("not-today");
      if (state.phase !== "finished" && state.phase !== "won") return refuse("daily-not-finished");
      return { ok: true, campaign, levelKey: s.dailyDate, number: 0, marks, score: state.score, save: text };
    }
    if (kind === "gemSwap") {
      const state = swap.decodeGame(text);
      if (level !== null) {
        const made = swap.createGame((level as swap.GemSwapCampaignLevel).options);
        if (!(canonical(state.initialOptions) === canonical(made.initialOptions) && canonical(state.challenge) === canonical(made.challenge))) return refuse("not-that-level");
        if (state.outcome !== "won") return refuse("not-won");
        return { ok: true, campaign, levelKey: level.id, number: request.kind === "level" ? request.number : 0, marks, score: state.score, save: text };
      }
      if (!(state.mode === "daily" && state.dailyDate !== null && days.includes(state.dailyDate))) return refuse("not-today");
      if (state.outcome !== "finished" && state.outcome !== "won") return refuse("daily-not-finished");
      return { ok: true, campaign, levelKey: state.dailyDate, number: 0, marks, score: state.score, save: text };
    }
    // Magnetic Blocks has levels and no Daily.
    if (level === null) return refuse("no-daily");
    const state = blocks.decodeGame(text);
    const made = blocks.createLevel(level.id);
    if (canonical(state.settings) !== canonical(made.settings)) return refuse("not-that-level");
    if (state.phase !== "won") return refuse("not-won");
    return { ok: true, campaign, levelKey: level.id, number: request.kind === "level" ? request.number : 0, marks, score: state.score, save: text };
  } catch {
    return refuse("would-not-replay");
  }
}
