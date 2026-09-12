/**
 * The rules behind the two pickers on the set-up screen — pure, so they can
 * be asked directly. `picker.constants.ts` is the look; this is the logic.
 *
 * NAMED `picker.ts` AND NOT `gamePicker.ts`, which is not a preference. This
 * file sat beside a component called `GamePicker.tsx`, and on a
 * case-insensitive filesystem — every Mac here — `from "./GamePicker"` in
 * RulesForm resolved to the lower-case module instead of the component. The
 * error it gives is "Module './GamePicker' has no exported member
 * 'GamePicker'", which reads as a missing export rather than as the wrong
 * file being opened, and the second error under it was a parameter losing
 * its type in a file nobody had touched.
 *
 * Two names differing only in case are one name on this machine and two on a
 * Linux runner, so the failure is not even the same in both places. Do not
 * put a `foo.ts` beside a `Foo.tsx`.
 */
import { GAME_FAMILIES, familyOf } from "@/lib/gomoku/families";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

/** One row of `GAME_FAMILIES`: a title, its kanji, its blurb and its games. */
export type Family = (typeof GAME_FAMILIES)[number];

/**
 * Which family the picker's second row is showing: the one holding the game
 * that is chosen, and nothing else.
 *
 * IT USED TO TAKE A SECOND ARGUMENT, and that argument was the bug John
 * found. The row of families was a BROWSE — clicking one opened its games
 * and left the chosen game alone — so the screen could hold two answers to
 * "which game is this" at once. He was on Hex at 13×13, clicked Drops, and
 * got the eight drop games under a heading that still read "Hex ヘックス ·
 * 13×13 Medium" over a board row still offering Hex's 11, 13 and 19. Every
 * part was doing as it was told. The boards follow the chosen game, and the
 * chosen game was still Hex.
 *
 * The fix is not to push the boards into step with the open family. It is
 * that there was never anything for them to be out of step WITH: a family
 * click now chooses that family's game, so the open family is a reading of
 * the chosen game and cannot disagree with it. One source of truth, and the
 * disagreement is not fixed so much as made unable to exist. See
 * `defaultGameOf`, which is the other half.
 *
 * IT NEVER ANSWERS "NOTHING". A game this site no longer knows — a row kept
 * from before a rename — would otherwise leave the second row empty and the
 * picker looking broken, which is the shape AGENTS.md calls a value that
 * happens to be in range: an empty row means both "no family" and "a family
 * with no games in it". The first family is a real answer, and no chip shows
 * as chosen, which is the truth about a game that is not in any family.
 */
export function familyShown(variant: string): Family {
  return familyOf(variant as RuleVariant) ?? GAME_FAMILIES[0];
}

/**
 * The game a family stands for: its first, which is the one it is named
 * after.
 *
 * Clicking "Drops" has to land on a real game, because the click IS the
 * choice now rather than a way of looking around. The first game in each
 * family is already the canonical one — Gomoku heads Five in a row, Drop
 * Four heads Drops, Reversi heads Flips, Tic-tac-toe heads Small boards —
 * so the order in `GAME_FAMILIES` carries this meaning, and `picker.test.ts`
 * checks it rather than leaving it as a thing somebody happened to arrange.
 *
 * A CLICK ON THE FAMILY ALREADY OPEN CHANGES NOTHING, and that rule lives at
 * the call site rather than here: this answers "what does this family stand
 * for", which has one answer whatever is currently chosen. Somebody on Renju
 * who taps the lit "Five in a row" chip has not asked to be moved to Gomoku.
 */
export function defaultGameOf(family: Family): RuleVariant {
  return family.games[0];
}

/**
 * The game a click on a family should choose, or null when it should choose
 * nothing.
 *
 * Null rather than "the game you already have", so a caller can tell "no
 * change is wanted" from "change to this", and never fires a change that
 * would only re-apply what is already there. `applyRulesChange` snaps the
 * board on every change it is handed, so a no-op change is not free: it
 * would be a second chance to lose a board size somebody chose.
 */
export function gameForFamilyClick(family: Family, chosen: string): RuleVariant | null {
  if (family.games.includes(chosen as RuleVariant)) return null;
  return defaultGameOf(family);
}
