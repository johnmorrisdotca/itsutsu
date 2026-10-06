/** Widths a profile or settings field keeps, and the shapes the rest of My account shares. Its words are `mine.*` phrases (`mine.copy.ts`). */

export const PROFILE_WIDTH = {
  /** "Charlottetown", "Sault Ste. Marie" — a couple of words at most. */
  city: "sm:max-w-[11rem]",
  /** "🇬🇧 United Kingdom", and the longest of the 249 run half again as long. */
  country: "sm:max-w-[17rem]",
  /** Measured: "America/Argentina/Buenos_Aires", the longest there is, wants 313px. */
  zone: "max-w-[20rem]",
  /*
   * A date is ten characters, a picker icon, and nothing else — 136px, which
   * is what one needs to render whole.
   *
   * The second half is arithmetic and not taste. A screen 360px wide leaves
   * this form a 294px column, and two whole dates with the word between them
   * want 294px exactly; anything narrower cannot have both at this text size,
   * whatever the padding does. Below that the TEXT gives way rather than the
   * row, because "they should at least be on the same row" is the thing being
   * asked for and a smaller date is still a date. Measured at 320px: at the
   * ordinary size the boxes come out 113px and Chrome eats the leading digit,
   * so every year read 026.
   */
  date: "max-w-[8.5rem] max-[359px]:text-xs",
  /** "Three months 三月" is the longest thing this select ever says. */
  keep: "max-w-[13rem]",
} as const;


/**
 * A puzzle's row on /play, in the game rows' own card (`MyGameRow`): a bordered
 * card the whole of which opens, with its thumbnail, a name line and a line of
 * detail, so the puzzles read like the games beside them.
 */
export const MY_PUZZLE_ROW = "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-rule px-3 py-2 text-sm";

/**
 * The key the header's badge and strip share in SWR's cache: one answer for
 * both, seeded by the page's own render (`HeaderCountsSeed`) and refreshed
 * from this route only when a tab comes back into focus.
 */
export const MINE_KEY = "/api/games/mine";
