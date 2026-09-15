import { BoardSizeMark } from "@/components/board/BoardSizeMark";
import { OneName } from "@/components/i18n/OneName";
import { BOARD_SIZE_DISPLAY, sizeForVariant } from "@/lib/gomoku/gomoku.constants";
import type { OpeningRule, RuleVariant } from "@/lib/gomoku/gomoku.types";
import { OPENING_DISPLAY } from "@/lib/gomoku/openings.constants";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";

import { OpeningMark } from "./OpeningMark";
import { DOORSTEP_FIGURE, DOORSTEP_FIGURE_NAME, DOORSTEP_PICTURES } from "./picker.constants";
import type { DoorstepPicturesProps } from "./picker.types";
import { openingsOffered } from "./rulesDraft";

/**
 * THE BOARD THE SET-UP CHOSE, AS A PICTURE, on the last page before a game.
 *
 * John, looking at the Checkers doorstep — a paragraph and a table, no
 * picture at all: "Checkers page, and all pages like it, should use the Board
 * Icon... since this is the last page before the game... perhaps we use new
 * larger icons? if so we need to always create a larger set of icons with
 * number too... or whatever you think is the best icon."
 *
 * So the board block the reader just pressed comes with them, larger: the big
 * numbered mark and the board's name under it. The same component the block
 * draws, at the large picture size rather than a copy — exactly twice the
 * block's regular one, which John asked for "for symmetry" — so the picture
 * that was chosen and the picture that is confirmed cannot come apart. Its
 * name is one language on one line, like every label under a picture.
 *
 * AND NO SIZE LINE, for the rule the set-up screen already keeps. John: "I
 * don't want the 9x9 size under every board... i want consistency. Like
 * checkers, just the big number now. easier to read". The number is in the
 * picture; `words="none"` names it "13 by 13 board" for anybody who cannot see
 * it, and nothing printed beside it says the size again.
 * `boardSizeMark.coverage.test.ts` holds this file to that rule. (The
 * paragraph above the table says "on a 13×13 board", and the table has a Board
 * row: both are sentences about the game, not a caption under the picture.)
 *
 * The board that will be DRAWN, not the number on the draft — the engine snaps
 * a size a game does not offer, and `describeGameProse` makes the same choice
 * for the same reason, so the picture and the paragraph name one board.
 *
 * THE OPENING'S PICTURE ONLY WHERE THE OPENING WAS A CHOICE. Beside a Pro
 * game the picture is the rule — the square black's second stone must leave —
 * and worth seeing once more before the first stone. At a game with one
 * opening the picture is three stones "anywhere", which on Checkers' or Go's
 * board would be a drawing of a rule that game does not have; the table
 * already says its opening in words. This is the table's own test for the
 * Board row, turned round: it states what was chosen, and draws it where the
 * drawing says something.
 */
export function DoorstepPictures({ rules }: DoorstepPicturesProps) {
  const variant = rules.variant as RuleVariant;
  const known = RULE_VARIANT_DISPLAY[variant] !== undefined;
  const size = known ? sizeForVariant(variant, rules.size) : rules.size;
  const board = BOARD_SIZE_DISPLAY[size];
  const opening = rules.opening as OpeningRule;
  const openingCopy = OPENING_DISPLAY[opening];
  const drawOpening = known && openingCopy !== undefined && openingsOffered(variant).length > 1;

  return (
    <div className={DOORSTEP_PICTURES} data-testid="doorstep-pictures">
      <figure className={DOORSTEP_FIGURE} data-testid="doorstep-board" data-size={size}>
        <BoardSizeMark side={size} size="large" words="none" />
        {board !== undefined ? (
          <figcaption className={DOORSTEP_FIGURE_NAME} data-testid="doorstep-board-name">
            <OneName en={board.label} kanji={board.kanji} />
          </figcaption>
        ) : null}
      </figure>
      {drawOpening ? (
        <figure className={DOORSTEP_FIGURE} data-testid="doorstep-opening" data-opening={opening}>
          <OpeningMark opening={opening} side={size} size="large" />
          <figcaption className={DOORSTEP_FIGURE_NAME} data-testid="doorstep-opening-name">
            <OneName en={openingCopy.label} kanji={openingCopy.kanji} />
          </figcaption>
        </figure>
      ) : null}
    </div>
  );
}
