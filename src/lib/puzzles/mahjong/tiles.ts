import type { MahjongBonusRule, MahjongFace, MahjongSuit } from "./mahjong.types";

/**
 * THE SET: 144 tiles in 42 faces. Three suits of nine — characters 萬子,
 * circles 筒子 and bamboo 索子 — four copies of each; the four winds and the
 * three dragons, four copies of each; and one each of the four flowers and the
 * four seasons. That is the set the solitaire has always been played with.
 *
 * Each face is written as one letter (`FACE_CODES`), so a deal is a string a
 * character a slot and "." a slot emptied.
 */
const SUIT_RANKS: readonly [MahjongSuit, number][] = [
  ["characters", 9],
  ["circles", 9],
  ["bamboo", 9],
  ["winds", 4],
  ["dragons", 3],
  ["flowers", 4],
  ["seasons", 4],
];

/** One letter a face, in the order of `SUIT_RANKS`: a–i characters, j–r circles, s–A bamboo, B–E winds, F–H dragons, I–L flowers, M–P seasons. */
const FACE_CODES = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP";

export const EMPTY_SLOT = ".";

export const MAHJONG_FACES: readonly MahjongFace[] = (() => {
  const faces: MahjongFace[] = [];
  for (const [suit, ranks] of SUIT_RANKS) {
    for (let rank = 1; rank <= ranks; rank += 1) faces.push({ code: FACE_CODES[faces.length]!, suit, rank });
  }
  return faces;
})();

const BY_CODE = new Map(MAHJONG_FACES.map((face) => [face.code, face]));

/** The face a letter stands for, or null for anything that is not one. */
export function faceOf(code: string): MahjongFace | null {
  return BY_CODE.get(code) ?? null;
}

export function isFaceCode(code: string): boolean {
  return BY_CODE.has(code);
}

/** A flower or a season: one of a kind in the set, and matched by its group under the usual rule. */
export function isBonus(code: string): boolean {
  const suit = faceOf(code)?.suit;
  return suit === "flowers" || suit === "seasons";
}

/**
 * THE MATCHING RULE. Two identical tiles match; under the usual rule a flower
 * matches any flower and a season any season, since there is only one of each.
 */
export function matchClass(code: string, rule: MahjongBonusRule): string {
  const face = faceOf(code);
  if (face === null) return code;
  if (rule === "group" && (face.suit === "flowers" || face.suit === "seasons")) return face.suit;
  return code;
}

export function tilesMatch(a: string, b: string, rule: MahjongBonusRule): boolean {
  return a !== EMPTY_SLOT && b !== EMPTY_SLOT && matchClass(a, rule) === matchClass(b, rule);
}

/**
 * The deal's rule, read from the deal itself: a bonus tile dealt twice can
 * only be the Identical rule, since the usual one deals each flower and season
 * once. A deal holding no bonus tile plays alike under both, and says `group`.
 */
export function bonusRuleOf(cells: string): MahjongBonusRule {
  const seen = new Set<string>();
  for (const code of cells) {
    if (!isBonus(code)) continue;
    if (seen.has(code)) return "same";
    seen.add(code);
  }
  return "group";
}

/**
 * EVERY PAIR THE SET HOLDS, 72 of them: each ordinary face twice (four
 * copies), and the eight bonus tiles as four pairs — two flowers and two
 * seasons, split at random under the usual rule, or four faces drawn twice
 * each under the Identical rule. `random` decides the splits; the order is the
 * set's, and the deal shuffles it.
 */
export function setPairs(rule: MahjongBonusRule, random: () => number): [string, string][] {
  const pairs: [string, string][] = [];
  for (const face of MAHJONG_FACES) {
    if (face.suit === "flowers" || face.suit === "seasons") continue;
    pairs.push([face.code, face.code], [face.code, face.code]);
  }
  const bonus = MAHJONG_FACES.filter((face) => face.suit === "flowers" || face.suit === "seasons").map((face) => face.code);
  const mixed = bonus.map((code) => ({ code, key: random() }));
  if (rule === "group") {
    for (const suit of ["flowers", "seasons"] as const) {
      const group = mixed.filter((each) => faceOf(each.code)!.suit === suit).sort((a, b) => a.key - b.key);
      pairs.push([group[0]!.code, group[1]!.code], [group[2]!.code, group[3]!.code]);
    }
  } else {
    const drawn = mixed.sort((a, b) => a.key - b.key).slice(0, 4);
    for (const each of drawn) pairs.push([each.code, each.code]);
  }
  return pairs;
}

/**
 * WHAT A PAIR IS WORTH AT THE TABLE (`table.ts`): the plain suit tiles one,
 * the ones and nines two, the winds three and the dragons four — the honours
 * and terminals are the tiles a mahjong hand prizes — and a flower or season
 * pair two, with another turn, as a bonus tile draws again in the full game.
 */
export function pairPoints(code: string): number {
  const face = faceOf(code);
  if (face === null) return 0;
  switch (face.suit) {
    case "winds":
      return 3;
    case "dragons":
      return 4;
    case "flowers":
    case "seasons":
      return 2;
    default:
      return face.rank === 1 || face.rank === 9 ? 2 : 1;
  }
}

/** Whether taking this pair gives its taker another turn at the table: a flower or season pair. */
export function pairGoesAgain(code: string): boolean {
  return isBonus(code);
}
