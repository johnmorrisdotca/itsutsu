/**
 * THE ONE WIDTH EVERY PAGE IS, AND THERE IS NO OTHER.
 *
 * John, 2026-09-24: "We can't have pages be one width on one page, and then
 * change width in other pages. It needs to be consistent." There used to be
 * three: standard for most pages, wide for the players list, famous games and
 * a board, and wider still for a live board on a big screen. A reader moving
 * between them watched the header and the page jump sideways. Asked whether
 * the board pages could keep their extra room: "I want consistency... we
 * can't be consistent?" So a board page is this width too, and its board fits
 * the column like everything else.
 *
 * The text inside the frame runs the frame's width as well. A paragraph held
 * to `max-w-prose` stopped at half the page beside cards that ran the whole of
 * it; a cap on purpose says why with `data-width-reason="…"`.
 *
 * `e2e/page-width.spec.ts` measures every page against this in a browser, and
 * `pageWidth.coverage.test.ts` refuses a page that names a width of its own.
 *
 * Kept here rather than in `Page.tsx` so a client component (a board opened on
 * its own, `BoardFocus`) can take the page's width without importing the page,
 * whose footer reads the session on the server.
 */
export const PAGE_WIDTH = "max-w-5xl";
