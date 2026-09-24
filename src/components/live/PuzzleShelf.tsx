import { GameThumb } from "@/components/games/GameThumb";
import { OneName } from "@/components/i18n/OneName";
import { gameCopyFor } from "@/lib/catalogue/gameKeys";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

import type { Family } from "./picker";
import { PICK_CARD, PICK_GRID } from "./picker.constants";
import { PickMark } from "./PickMark";

/**
 * A FAMILY OF PUZZLES ON THE SET-UP SCREEN: its puzzles, one of them chosen.
 *
 * John, 2026-09-24, on this screen with no Numbers tile: "where tf is numbers
 * games??? I didn't see them". The first answer made each puzzle a link away
 * to its own set-up and left the rest of the screen as it was, so the heading
 * still named the last board game, the board preview vanished and Begin
 * offered to start a game nobody had chosen. John: "There's an error because
 * we don't have a Preview board for the new games."
 *
 * So a puzzle is chosen here the way a game is, a card with a mark, and the
 * screen turns to it: `SetUpGame` draws its picture, its size and level, and
 * Solve (`PuzzleHere`). The same radio shape as the game cards, so a chosen
 * puzzle looks chosen in the same way.
 */
export function PuzzleShelf({
  family,
  chosen,
  onChoose,
  disabled,
}: {
  family: Family;
  chosen: PuzzleKind;
  onChoose: (kind: PuzzleKind) => void;
  disabled: boolean;
}) {
  return (
    <>
      <span className="text-xs leading-snug text-muted" data-testid="set-up-family-blurb">
        {family.blurb}
      </span>
      <div className={PICK_GRID} role="radiogroup" aria-label={family.title}>
        {(family.games as PuzzleKind[]).map((kind) => {
          const copy = gameCopyFor(kind);
          return (
            <label
              key={kind}
              className={`${PICK_CARD} cursor-pointer gap-1.5 p-1`}
              data-testid="set-up-puzzle"
              data-kind={kind}
              data-chosen={kind === chosen ? "true" : "false"}
            >
              <input
                type="radio"
                name="set-up-puzzle"
                value={kind}
                checked={kind === chosen}
                disabled={disabled}
                onChange={() => onChoose(kind)}
                className="peer sr-only"
              />
              <GameThumb variant={kind} size="regular" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[0.8125rem] font-medium lg:text-sm" title={copy.label}>
                  <OneName en={copy.label} kanji={copy.kanji} />
                </span>
              </span>
              <PickMark className="size-5" />
            </label>
          );
        })}
      </div>
      <span className="text-xs leading-snug text-muted" data-testid="set-up-variant-hint">
        {gameCopyFor(chosen).tagline}
      </span>
    </>
  );
}
