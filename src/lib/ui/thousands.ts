/**
 * A whole number with its thousands marked, the same on the server and in the
 * browser. Not `toLocaleString`: the two can disagree about the separator, and
 * `localTime.coverage.test.ts` keeps it out of anything a page draws.
 *
 * Its own module, not the About page's chart's (`XpCurve`), where it was
 * born: the site's header counts with it, and a header that imported the chart
 * for one line carried the chart and the whole level ladder into every page's
 * server function besides.
 */
export const thousands = (n: number): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
