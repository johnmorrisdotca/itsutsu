import type { Speaker } from "@/lib/i18n/i18n";
import { countText } from "@/lib/rating/figures";

/**
 * THE JUSTIFICATION BESIDE A TOTAL THAT INCLUDES ANOTHER SITE'S CREDIT.
 *
 * John: "we will show filters, that show worldwide XP with a justification that
 * they have put in their time or mileage on other sites". So wherever a total
 * counts imported experience, a line under it says how much, for how many games,
 * and where — "Includes 1,008,863 XP for 14,606 games played on ItsYourTurn and
 * GoldToken."
 *
 * The text only, in the reader's language, with `{games}` left standing: the
 * count is drawn by `ImportedXpNote` as a figure counted on another site —
 * `here: false`, AGENTS.md's exception — because there are no games here to open.
 * Pure and importing no data, so a client component can say it too.
 */

/** What a note is about: the credit, and the play behind it where the records name it. */
export type ImportedFacts = {
  xp: number;
  /** Games played on the sites below; null where no kept record under this name says. */
  games: number | null;
  sites: readonly string[];
};

export type ImportedNote = { text: string; games: number | null };

/**
 * "ItsYourTurn", "ItsYourTurn and GoldToken", in the reader's language — in a
 * note under a total, and on a promotion that credit paid.
 */
export function importedSitesSaid(say: Speaker, sites: readonly string[]): string {
  if (sites.length <= 1) return sites[0] ?? "";
  return say.say("xp.imported.listLast", { list: sites.slice(0, -1).join(", "), last: sites[sites.length - 1] });
}

export function importedNoteText(say: Speaker, facts: ImportedFacts): ImportedNote {
  /* A credit whose record no longer answers to the member's name — renamed since
     it was paid — still says it is a credit, without inventing where it came
     from. */
  if (facts.games === null || facts.sites.length === 0) {
    return { text: say.say("xp.imported.includesElsewhere", { xp: countText(facts.xp) }), games: null };
  }
  return {
    text: say.say("xp.imported.includes", { xp: countText(facts.xp), sites: importedSitesSaid(say, facts.sites) }),
    games: facts.games,
  };
}
