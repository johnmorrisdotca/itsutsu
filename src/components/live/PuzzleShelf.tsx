import { GameThumb } from "@/components/games/GameThumb";
import { OneName } from "@/components/i18n/OneName";
import { gameCopyFor } from "@/lib/catalogue/gameKeys";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

import type { Family } from "./picker";
import { PICK_CARD, PICK_TILE, PICK_TILE_GRID, PICK_TILE_NAME } from "./picker.constants";
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
 * puzzle looks chosen in the same way — and the same tile (`PICK_TILE`) in
 * the same columns, so the games' panel is one height for puzzles and games.
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
      <div className={PICK_TILE_GRID} role="radiogroup" aria-label={family.title}>
        {(family.games as PuzzleKind[]).map((kind) => {
          const copy = gameCopyFor(kind);
          return (
            <label
              key={kind}
              className={`${PICK_CARD} ${PICK_TILE} cursor-pointer`}
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
              <span className={`${PICK_TILE_NAME} font-medium`} title={copy.label}>
                <OneName en={copy.label} kanji={copy.kanji} wrap />
              </span>
              <PickMark className="absolute top-1.5 right-1.5 size-5" />
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
