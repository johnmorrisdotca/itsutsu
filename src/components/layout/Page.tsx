import type { ReactNode } from "react";

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
  children,
}: {
  width?: PageWidth;
  /** Vertical rhythm between the page's sections. */
  gap?: "gap-6" | "gap-8" | "gap-10";
  children: ReactNode;
}) {
  return (
    <div className="paper flex flex-1 flex-col items-center px-4 py-6 sm:px-8 sm:py-8">
      <main className={`flex w-full flex-col ${PAGE_WIDTH[width]} ${gap}`}>{children}</main>
    </div>
  );
}
