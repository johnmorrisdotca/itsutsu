"use client";

import { VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { wearsFelt } from "./appearance";
import { feltName, nameWithKanji, themeName } from "./boardNames";
import { boardPatchLook } from "./boardPaint";
import { BOARD_THEMES, FELT_LIST, FELTS } from "./Board.constants";
import type { Appearance, BoardTheme, Felt } from "./board.types";

/** Where a swatch of a board is painted (`boardPaint.ts`), reached from here by the pickers beside a board. */
export { boardPatchLook };

/** The patches in the order they are shown: the reader's own board first, then the felts. */
const PATCH_ORDER: readonly Felt[] = ["wood", ...FELT_LIST.filter((each) => each !== "wood")];

/**
 * THE COLOUR OF A REVERSI BOARD, CHOSEN BY LOOKING. John, 2026-09-25: "a very
 * subtle colour picker. like one component or element with just some colour
 * patches that you click on to change. on game creation and even mid-game is
 * OK."
 *
 * A row of small square patches of the board itself, the chosen one ringed,
 * and no words on the page: each says its name to a screen reader and on
 * hover. The first patch is the reader's own board surface (`wood`, the gold
 * board a new member's boards are drawn on), for a Reversi drawn like every
 * other board. One component, on every set-up screen and beside every board
 * that offers a colour, so they cannot drift apart.
 *
 * GOLD FIRST. John, 2026-09-26, at Kumimoji's picker reading green, blue, red,
 * black, gold: "the default gold board should come first, not last." The order
 * is set here, where the patches are drawn, rather than in `FELT_LIST`, which
 * the pictures of every game are fingerprinted against and says only which
 * felts there are.
 *
 * SQUARE, BECAUSE IT IS A BOARD. John, 2026-09-25, at the first row of round
 * patches: "When presenting a set of Board Colours to pick... don't use
 * Circles... use square or tiles that we see, to simulate the Reversi board...
 * Reserve the use of Circles for Marble colours." Each patch is four squares
 * of the cloth in its own rim and ruling (`boardPatchLook`), and a pointer
 * over it says it can be pressed.
 */
export function FeltPatches({ felt, wood, onChoose }: { felt: Felt; wood: BoardTheme; onChoose: (felt: Felt) => void }) {
  const say = useSpeaker();
  return (
    <div className="flex items-center justify-center gap-2" role="radiogroup" aria-label={say.say("boardlook.feltPicker")} data-testid="felt-patches">
      {PATCH_ORDER.map((each) => {
        const look = each === "wood" ? BOARD_THEMES[wood] : FELTS[each];
        const name = each === "wood" ? themeName(say, wood) : feltName(say, each);
        const chosen = felt === each;
        return (
          <button
            key={each}
            type="button"
            role="radio"
            aria-checked={chosen}
            aria-label={each === "wood" ? say.say("boardlook.feltOwnAria", { name: name.label }) : name.label}
            title={each === "wood" ? say.say("boardlook.feltOwnTitle", { name: name.label }) : nameWithKanji(name)}
            onClick={() => onChoose(each)}
            data-testid={`felt-${each}`}
            className={`size-5 cursor-pointer rounded-[3px] outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-moss ${
              chosen ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : "hover:ring-1 hover:ring-rule-strong hover:ring-offset-1 hover:ring-offset-paper"
            }`}
            style={boardPatchLook(look)}
          />
        );
      })}
    </div>
  );
}

/** The patches under a board, where the game wears felt (`wearsFelt`); nothing for any other game. */
export function FeltUnderBoard({ appearance, variant, onChoose }: { appearance: Appearance; variant: RuleVariant; onChoose: (felt: Felt) => void }) {
  if (!wearsFelt(appearance, VARIANT_SPECS[variant])) return null;
  return <FeltPatches felt={appearance.felt} wood={appearance.boardTheme} onChoose={onChoose} />;
}
