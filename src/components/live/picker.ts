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

type Family = (typeof GAME_FAMILIES)[number];

/**
 * Which family the picker's second row is showing.
 *
 * Pure, and in its own module beside `picker.constants.ts`, because it is the one rule in that control
 * that can be wrong in a way nobody would see. The picker is two rows —
 * families along the top, the chosen family's games underneath — and this
 * decides the second from the first.
 *
 * THE ANSWER IS DERIVED FROM THE CHOSEN GAME, not remembered from the first
 * render. That is the whole point, and it is what makes the control work for
 * a screen that arrives with a game already decided: a rematch, a challenge,
 * a fork, or anything else that pre-fills the form opens on the family
 * holding that game rather than on Five in a row. State initialised once
 * from a prop would be right on the default and wrong on every one of those.
 *
 * `browsing` overrides it, and only when it names a family that exists. A
 * family somebody has opened is a decision and stays open; until they make
 * one there is nothing to remember, so there is nothing to keep in step and
 * no effect to keep it there.
 *
 * IT NEVER ANSWERS "NOTHING". A game this site no longer knows — a row kept
 * from before a rename — would otherwise leave the second row empty and the
 * picker looking broken, which is the shape AGENTS.md calls a value that
 * happens to be in range: an empty row means both "no family" and "a family
 * with no games in it". The first family is a real answer and the chips
 * above it show plainly that none is the chosen one.
 */
export function familyShown(variant: string, browsing: string | null): Family {
  const opened = GAME_FAMILIES.find((family) => family.title === browsing);
  if (opened !== undefined) return opened;
  return familyOf(variant as RuleVariant) ?? GAME_FAMILIES[0];
}
