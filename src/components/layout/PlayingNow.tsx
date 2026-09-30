/**
 * QUIET WHILE PLAYING: A GAME BEING PLAYED SAYS SO, AND THE SITE AROUND IT
 * STEPS BACK.
 *
 * John, 2026-09-30, at a phone whose board started halfway down the screen
 * under the logo, the sections, New game and his figures: "we need to make a
 * decision where there are minimal distractions [while playing] a game. So a
 * lot of the header stuff should not be shown. For all games." So while a
 * game is being played, the page keeps:
 *
 * - the wordmark, its Beta mark and the account menu — the way home and the
 *   way out of the account, on one row;
 * - the trail over the game (`GameTrailNav`), the way back to the game and its
 *   set-up;
 * - the play itself and every control it has, Just the board included.
 *
 * and hides what is marked `data-quiet-in-play`: the sections and New game
 * (`SiteHeader`'s `Nav`), the member's figures (`MemberStrip`), a table's
 * page title and lead, and the footer. A set-up screen, a finished game and
 * every page that is not a board show all of it as before.
 *
 * WHY A MARK IN THE PAGE AND NOT A SWITCH ON THE ROOT. Only the play knows
 * whether it is being played — a table kept in the browser, a puzzle solved, a
 * live game that has just ended — so each one draws this while it is, beside
 * the cover that would mark its end (`useWinMoment`). The stylesheet asks the
 * page whether it holds one (`:has`, in globals.css), so a game the server
 * draws is quiet from its first paint with no script at all, and leaving the
 * game takes the mark with it: nothing is left on the root for another page
 * to inherit. It is scoped to `[data-strippable]`, the board pages, like Just
 * the board, so a page without a board can never lose its navigation.
 *
 * `quietPlay.coverage.test.ts` holds every play to drawing it.
 */
export function PlayingNow({ on }: { on: boolean }) {
  return on ? <span hidden data-playing-now="" data-testid="playing-now" /> : null;
}
