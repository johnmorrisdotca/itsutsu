import { BLOCKED, HOT, WORM } from "@/lib/gomoku/gomoku.constants";
import { stoneName } from "@/lib/gomoku/seatWords";
import { speaker, type Speaker } from "@/lib/i18n/i18n";
import { pointName } from "@/lib/gomoku/notation";
import type { Cell, Point } from "@/lib/gomoku/gomoku.types";

/**
 * The accessible name of one square: where it is, and what stands on it —
 * "H8, empty", "H8, Black stone", "B8, White king".
 *
 * A crowned piece is named a king. It used to be drawn as a second ring on the
 * stone and named a stone like any other, so a reader who could not see the
 * ring could not tell a king from a man, and nor could a test. The ring is
 * still drawn; the name now says what the ring means.
 */
export function squareLabel(
  size: number,
  point: Point,
  cell: Cell,
  facts: { forbidden: boolean; king: boolean },
  say: Speaker = speaker("en"),
): string {
  return say.say("boardlook.squareLine", { point: pointName(size, point), what: describe(cell, facts, say) });
}

function describe(cell: Cell, { forbidden, king }: { forbidden: boolean; king: boolean }, say: Speaker): string {
  if (cell === BLOCKED) return say.say("boardlook.squareBlocked");
  if (cell === HOT) return say.say("boardlook.squareHot");
  if (cell === WORM) return say.say("boardlook.squareWorm");
  if (cell === null) return say.say(forbidden ? "boardlook.squareForbidden" : "boardlook.squareEmpty");
  return say.say(king ? "boardlook.squareKing" : "boardlook.squareStone", { colour: stoneName(say, cell) });
}
