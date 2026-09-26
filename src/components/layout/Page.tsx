import type { ReactNode } from "react";

import { BareBoard } from "./BareBoard";
import { SiteFooter } from "./SiteFooter";

// THE ONE WIDTH EVERY PAGE IS: see `pageWidth.constants.ts`, where it lives so a client component can read it without pulling the page's server parts in.
import { PAGE_WIDTH } from "./pageWidth.constants";

export { PAGE_WIDTH };

/**
 * THE ONE RHYTHM BETWEEN A PAGE'S BLOCKS, and there is no other.
 *
 * Same day, same complaint (see `PAGE_TITLE` in ui.constants.ts): a page
 * used to choose 24, 32 or 40 pixels between its title and its first panel,
 * so two pages side by side in the navigation opened at different heights.
 * Twenty-four is what most of them chose, and it is the gap inside a panel
 * too, so a page reads as one column of blocks at one spacing. The home
 * page's hero spaces its own inside, which is what a hero is for.
 */
export const PAGE_GAP = "gap-6";

/** The frame every page sits in: the paper, the margins, the column. */
export function Page({
  board = false,
  children,
}: {
  /**
   * Whether this page is a BOARD: whether "Just the board" is offered and the
   * masthead may be stripped. It used to follow from the page being wide,
   * until /players needed the room without having a board; now that there is
   * one width, it is only this. A board page says `board`.
   */
  board?: boolean;
  children: ReactNode;
}) {
  return (
    /*
      A BOARD PAGE KEEPS LESS MARGIN ON A PHONE, because on a board the margin
      is competing with the cells. Sixteen pixels a side out of 390 is four per
      cent of a 19×19 board's every point — and those points are 17.6 pixels
      across, which is well under the forty-four a finger wants (see
      `nudgeMove.ts` for the other half of that answer). Eight is still a
      margin; nothing is flush against the glass.

      Only below `sm`, and only where there IS a board: a page of prose at
      eight pixels would read as an app that had lost its frame, and `board` is
      already the answer to "is there a board here", so no new flag is needed.
    */
    <div
      className={`paper flex flex-1 flex-col items-center py-6 sm:px-8 sm:py-8 ${board ? "px-2" : "px-4"}`}
      // Read as just the board, this frame is the modal's backdrop and the column below its panel (globals.css).
      data-bare-frame={board ? "" : undefined}
    >
      {/*
        Offered on the board pages and no others, and — THE SAME CONDITION, so
        the two cannot come apart — only those pages are stripped. `board` is
        the answer to "is there a board here to read on its own", which is
        exactly the set of pages there is anything to take off; see the prop.

        Scoping the effect matters as much as scoping the switch. The setting
        lives on the root element so it survives a reload, but if it hid the
        masthead everywhere, a reader who wandered onto a page without the
        switch would have lost the navigation with no way to bring it back.
        That is why both lines below read one flag and not two.
      */}
      <main
        data-strippable={board ? "" : undefined}
        className={`flex w-full flex-col ${PAGE_WIDTH} ${PAGE_GAP}`}
      >
        {children}
        {/*
          After the page, not before it. It sat above the masthead at first,
          which pushed every wide page down by the height of a button to make
          room for a control nobody was looking for at the top. Down here it
          lands under the board's own controls, which is where somebody who
          has just been playing will look for it.
        */}
        {board ? <BareBoard /> : null}
        <SiteFooter />
      </main>
    </div>
  );
}
