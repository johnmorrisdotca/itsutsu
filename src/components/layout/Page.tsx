import type { ReactNode } from "react";

import { BareBoard } from "./BareBoard";
import { SiteFooter } from "./SiteFooter";

/**
 * The three widths a page may be, and no others.
 *
 *   wide      a board or a table with a sidebar beside it: play, a match,
 *             a replay, the record
 *   standard  a page of cards, a form, a list: the front, the games, rules,
 *             learning, players
 *
 * A page that is read top to bottom — about, a lesson — is the standard
 * width too, so its header lines up with every other page's; it narrows
 * its own text column inside (max-w-3xl) for the line length, not the frame.
 */
export const PAGE_WIDTH = {
  wide: "max-w-6xl",
  standard: "max-w-5xl",
} as const;

export type PageWidth = keyof typeof PAGE_WIDTH;

/** The frame every page sits in: the paper, the margins, the column. */
export function Page({
  width = "standard",
  gap = "gap-8",
  board = width === "wide",
  children,
}: {
  width?: PageWidth;
  /** Vertical rhythm between the page's sections. */
  gap?: "gap-6" | "gap-8" | "gap-10";
  /**
   * Whether this page is a BOARD, which is a different question from whether
   * it is wide — and until /players needed the room they were the same one.
   *
   * `wide` used to decide both the column and whether "Just the board" was
   * offered, because every wide page was a board page. The members list is a
   * ten-column table of two hundred rows and wants the same column; it has no
   * board, so the switch would be a button whose own label and title talk
   * about a board that is not there, and a reader who had turned it on during
   * a game would find this page's masthead gone as well.
   *
   * So the two are separated rather than one of them fudged: `width` is a
   * column and `board` is what may be read bare. It defaults to `width ===
   * "wide"`, which keeps every board page exactly as it was WITHOUT touching a
   * single caller — the safe way round, since a caller silently losing the
   * switch would also silently stop being strippable and nothing would say so.
   * A wide page with no board says `board={false}` where it says the width.
   */
  board?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="paper flex flex-1 flex-col items-center px-4 py-6 sm:px-8 sm:py-8">
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
        className={`flex w-full flex-col ${PAGE_WIDTH[width]} ${gap}`}
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
