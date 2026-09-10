import { addUp, figuresOf, type RecordFigures } from "@/lib/rating/figures";
import type { LegacyPlayer } from "./legacyPlayers.types";

/**
 * Everything somebody has played, across every site they played it on.
 *
 * A person who played four thousand games on ItsYourTurn and twenty here has
 * had a life of playing, and a page that shows only the twenty is telling the
 * smaller truth. The tabs already give each site separately; this is the
 * figure beside them, not instead of them.
 *
 * Games and wins add up. RATINGS DO NOT, and that is the whole of what makes
 * this honest rather than impressive. GoldToken's own averaged about 1689
 * across every game John played there, on a scale that is not this site's
 * Elo and was never converted to it. Adding two such numbers, or averaging
 * them, would invent a figure that describes nothing — so the combined
 * headline carries games, the record and a win rate, and says in words why it
 * carries no rating. The kept-record figures already faced this and answered
 * it the same way.
 */

/** One site's contribution, and where it can be checked. */
export type RecordSource = {
  site: string;
  /** The player's own page there, where one was written down. Never guessed. */
  url: string | null;
  /** What they were called there, when it is not the name they go by. */
  handle: string | null;
  /**
   * True for this site's own row, and false for every record copied down.
   *
   * Said here rather than worked out by comparing the site's name to a label
   * in a component: whether there are games behind a number decides whether
   * that number is a link, and a page guessing at it by string comparison
   * would start linking the day somebody renames the site.
   */
  here: boolean;
  figures: RecordFigures;
};

export type WholeRecord = {
  /** Every site, this one included, in the order they are read. */
  sources: RecordSource[];
  /** The sum, which is the only number this type exists to produce. */
  figures: RecordFigures;
  /**
   * True when any of it was copied down by hand rather than counted here.
   *
   * The page must say so. These are one-time snapshots, and somebody who
   * assumes their current play elsewhere is flowing in is being misled by
   * omission — they will find out when the number is wrong and they had
   * trusted it.
   */
  kept: boolean;
};

/** This site's own contribution, which is counted rather than copied. */
export type PlayedHere = { won: number; lost: number; drawn: number };

/**
 * The whole of it, from the kept records and what this site holds.
 *
 * A site with nothing in it is left out rather than shown as a row of
 * zeroes: "no games on GoldToken" is a fact about the record, and a person
 * who never played there should not appear to have a GoldToken chapter.
 */
export function wholeRecord(
  legacies: readonly LegacyPlayer[],
  here: PlayedHere,
  hereLabel = "Itsutsu",
): WholeRecord {
  const sources: RecordSource[] = [];

  for (const legacy of legacies) {
    for (const source of legacy.sources) {
      const record = addUp(source.summary.map((row) => row.record));
      if (record.won + record.lost + record.drawn === 0) continue;
      sources.push({
        site: source.site,
        url: source.siteUrl ?? null,
        handle: source.handle ?? null,
        here: false,
        figures: figuresOf(record),
      });
    }
  }

  const playedHere = here.won + here.lost + here.drawn > 0;
  if (playedHere) {
    sources.push({ site: hereLabel, url: null, handle: null, here: true, figures: figuresOf(here) });
  }

  return {
    sources,
    figures: figuresOf(addUp(sources.map((source) => source.figures))),
    // Anything that is not this site's own count was copied down by hand.
    kept: sources.some((source) => !source.here),
  };
}
