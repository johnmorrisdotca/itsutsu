import Link from "@/components/ui/Link";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";
import { setUpPath } from "@/lib/gomoku/slugs";
import { SUIDO_MAKE_QUERY, type SuidoMode } from "@/lib/puzzles/suido/mode";
import { suidoSizeInAddress } from "@/lib/puzzles/suido/sizes";

import { SUIDO_MODES } from "./suido.constants";

/**
 * LEVELS OR MAKE A BOARD, over Suido's set-up: the two ways to play it, each its
 * own page (`/games/suido/new` and `?mode=make`), so the screen under the switch
 * is one or the other and never a screen that changes height when the switch is
 * pressed. The levels come first: they are what Play leads to, and the boards a
 * kept run, a race or a solve on a board made before the levels existed (all of
 * which keep working unchanged) are one press away. The size is carried across
 * where both ways have it.
 */
export function SuidoModeSwitch({ mode, size }: { mode: SuidoMode; size?: number }) {
  const sized = size === undefined ? "" : `size=${suidoSizeInAddress(size)}`;
  const hrefs: Record<SuidoMode, string> = {
    levels: `${setUpPath("suido")}${sized === "" ? "" : `?${sized}`}`,
    make: `${setUpPath("suido")}?${[SUIDO_MAKE_QUERY, sized].filter((part) => part !== "").join("&")}`,
  };
  return (
    <nav className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap" aria-label="How to play" data-testid="suido-modes">
      {(["levels", "make"] as const).map((each) => (
        <Link
          key={each}
          href={hrefs[each]}
          className={`${PICK_WORD_CHIP} ${mode === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
          aria-current={mode === each ? "page" : undefined}
          title={SUIDO_MODES[each].says}
          data-testid={`suido-mode-${each}`}
        >
          {SUIDO_MODES[each].label} <span className="font-mincho opacity-70">{SUIDO_MODES[each].kanji}</span>
        </Link>
      ))}
    </nav>
  );
}
