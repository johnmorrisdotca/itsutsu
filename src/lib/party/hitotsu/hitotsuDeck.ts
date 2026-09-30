// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { mixSeed } from "../../cardGames/cards";
import { seededRandom, shuffled } from "../../puzzles/random";

import { HITOTSU_COLOURS, HITOTSU_POINTS } from "./hitotsu.constants";
import type { HitotsuCard, HitotsuColour } from "./hitotsu.types";

/**
 * HITOTSU'S DECK, as the rules see it: 108 short names. Each colour has one
 * zero, two of each number one to nine, and two each of Skip, Reverse and
 * Draw Two; then four Wilds and four Wild Draw Fours.
 *
 * A name is its colour letter, its face and its copy (`R50`, `R51`), so a
 * hand of two red fives holds two different names and a rule can take one of
 * them away without the other.
 */

export const SKIP = "S";
export const REVERSE = "R";
export const DRAW_TWO = "D";
export const WILD = "W";
export const WILD_FOUR = "F";

const FACES_TWICE = ["1", "2", "3", "4", "5", "6", "7", "8", "9", SKIP, REVERSE, DRAW_TWO];

/** Every card, in the deck's own order. */
export const HITOTSU_DECK: readonly HitotsuCard[] = [
  ...HITOTSU_COLOURS.flatMap((colour) => [`${colour}00`, ...FACES_TWICE.flatMap((face) => [`${colour}${face}0`, `${colour}${face}1`])]),
  ...[0, 1, 2, 3].flatMap((copy) => [`W${WILD}${copy}`, `W${WILD_FOUR}${copy}`]),
];

const EVERY_CARD = new Set(HITOTSU_DECK);

export function isHitotsuCard(value: unknown): value is HitotsuCard {
  return typeof value === "string" && EVERY_CARD.has(value);
}

/** A card's colour, or null for a wild. */
export function colourOf(card: HitotsuCard): HitotsuColour | null {
  return card[0] === "W" ? null : (card[0] as HitotsuColour);
}

/** A card's face: a digit, or S, R, D, W, F. */
export function faceOf(card: HitotsuCard): string {
  return card[1];
}

/** Whether two cards are the same card to play (the two red fives are). */
export function identical(a: HitotsuCard, b: HitotsuCard): boolean {
  return a.slice(0, 2) === b.slice(0, 2);
}

export function isWild(card: HitotsuCard): boolean {
  return card[0] === "W";
}

/** Whether a card makes somebody draw: a Draw Two or a Wild Draw Four. */
export function isDrawCard(card: HitotsuCard): boolean {
  return faceOf(card) === DRAW_TWO || faceOf(card) === WILD_FOUR;
}

/** Whether a card is a number, 0 to 9. */
export function isNumber(card: HitotsuCard): boolean {
  return !isWild(card) && /\d/.test(faceOf(card));
}

/** What a card left in hand is worth to the player who went out. */
export function hitotsuPoints(card: HitotsuCard): number {
  if (isWild(card)) return HITOTSU_POINTS.wild;
  return isNumber(card) ? Number(faceOf(card)) : HITOTSU_POINTS.action;
}

/** A hand as a player holds it: by colour, numbers then actions, the wilds last. */
export function sortHitotsu(hand: readonly HitotsuCard[]): HitotsuCard[] {
  const faces = "0123456789SRDWF";
  const key = (card: HitotsuCard) => (isWild(card) ? 400 : HITOTSU_COLOURS.indexOf(card[0] as HitotsuColour) * 100) + faces.indexOf(faceOf(card));
  return [...hand].sort((a, b) => key(a) - key(b) || a.localeCompare(b));
}

const COLOUR_WORDS: Record<HitotsuColour, string> = { R: "red", Y: "yellow", G: "green", B: "blue" };
const FACE_WORDS: Record<string, string> = { S: "skip", R: "reverse", D: "draw two", W: "wild", F: "wild draw four" };

export function colourWords(colour: HitotsuColour): string {
  return COLOUR_WORDS[colour];
}

/** "red five", "blue draw two", "wild draw four", as a sentence and a screen reader say it. */
export function hitotsuWords(card: HitotsuCard): string {
  const face = faceOf(card);
  const named = FACE_WORDS[face] ?? ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"][Number(face)];
  const colour = colourOf(card);
  return colour === null ? named : `${COLOUR_WORDS[colour]} ${named}`;
}

/** The deck shuffled for one hand of one game: the same seed and hand always the same order. */
export function shuffledHitotsu(seed: number, hand: number): HitotsuCard[] {
  return shuffled(HITOTSU_DECK, seededRandom(mixSeed(seed, hand)));
}

/** These cards shuffled again, the same way for the same seed and salt: a pile turned over to make a new stock. */
export function reshuffledHitotsu(cards: readonly HitotsuCard[], seed: number, salt: number): HitotsuCard[] {
  return shuffled(cards, seededRandom(mixSeed(seed, salt)));
}
