import type { LegacyKind, LegacyPlayer, LegacySource } from "@/lib/legacy/legacyPlayers.types";

/**
 * A record kept from somewhere else.
 *
 * Some of the people on this site played for years before it existed, on
 * ItsYourTurn and GoldToken, and some of them are not here to play again.
 * What was kept of that is shown the way it was kept: their totals, the games
 * they played, the comments they left, and the head-to-head records worth
 * remembering. It reads as a record rather than a profile, because that is
 * what it is — nobody can add to it now.
 *
 * One person is one page, and each site they played on is a tab of it. Chibi
 * played on two sites for nineteen years between them, which is several
 * thousand games and two dozen tables; stacked in a column it was a page
 * nobody would reach the bottom of.
 */

/**
 * What to say about somebody whose record was made before this site.
 *
 * Keyed by kind because the two differ in a way that matters and cannot be
 * written once: one of these people has died, and "no games yet" is the wrong
 * word about them in the one place it would be noticed.
 *
 * It is only the WORDS that differ. Everything else about such a page — the
 * figures, the tabs, the sources, the scope — is the same page as anybody
 * else's, and used to be a second component.
 */
export const KEPT_RECORD_COPY: Partial<
  Record<LegacyKind, { badge: string; tail: string; tailWithGamesHere: string; here: string }>
> = {
  remembered: {
    badge: "Remembered",
    tail: "Never played on Itsutsu \u2014 this record is kept, not earned here.",
    tailWithGamesHere:
      "This record was kept from before Itsutsu \u2014 and the same name has also played a real game here; see below.",
    // Not "no games yet". There will not be any, and saying "yet" of somebody
    // who has died is the wrong word in the one place it would be noticed.
    here: "No games on Itsutsu. This record was made elsewhere, before this site existed, and is kept rather than added to.",
  },
  honorary: {
    badge: "Honorary member",
    tail: "Never played on Itsutsu \u2014 kept here as an honorary member, in her own right.",
    tailWithGamesHere:
      "Kept here as an honorary member of Itsutsu, in her own right \u2014 and the same name has also played a real game here; see below.",
    here: "No games on Itsutsu. An honorary member has a record here without having played for it \u2014 should she ever take a seat, this is where those games would appear.",
  },
};

/**
 * The one line under a kept record's name \u2014 chosen by whether the SAME NAME
 * also has a real, finished game logged here, rather than assumed the way
 * `KEPT_RECORD_COPY[kind].tail` alone used to.
 *
 * Chibi and Kyokosan are why this exists: they share one real, finished
 * Itsutsu game (freestyle, 37 moves, 2026-09-08) with nobody signed in as
 * either of them, because `playerRecord.ts` matches a game by the name typed
 * into its seats when it has no better anchor \u2014 the same rule that finds
 * anybody's game played before their account existed. "Never played on
 * Itsutsu" was true of every kept record until it stopped being true of
 * these two, and the page went on saying it anyway, right above a table
 * that would show the game.
 *
 * A kept record is about WHERE somebody's history came from, not a claim
 * that the same name never sat at a board here \u2014 those are two different
 * facts, and only the first one is always true.
 */
export function keptRecordTail(kind: LegacyKind, gamesHere: number): string {
  const copy = KEPT_RECORD_COPY[kind];
  if (gamesHere > 0) {
    return (
      copy?.tailWithGamesHere ??
      "Kept from before Itsutsu \u2014 and the same name has also played a real game here; see below."
    );
  }
  return copy?.tail ?? "From before Itsutsu \u2014 kept alongside whatever they have since earned here.";
}

/**
 * How a person is described where they played: the handle, the site, and the
 * years, in one clause per site.
 */
function playedAs(legacy: LegacyPlayer, source: LegacySource) {
  return (
    <>
      <span className="font-medium text-ink-soft">{source.handle ?? legacy.name}</span> on{" "}
      <span className="font-medium text-ink-soft">{source.site}</span>
      {source.joined !== undefined && source.lastActive !== undefined
        ? `, ${source.joined} to ${source.lastActive}`
        : null}
    </>
  );
}

/**
 * The one sentence naming every site somebody played on.
 *
 * It stays out of the tabs on purpose: a reader looking at the GoldToken tab
 * should still be able to see, without moving, that there is an ItsYourTurn
 * chapter too. The tabs say where to go; this says what there is.
 */
export function PlayedEverywhere({ legacy, lead }: { legacy: LegacyPlayer; lead: string }) {
  return (
    <>
      {lead}{" "}
      {legacy.sources.map((source, index) => (
        <span key={source.site}>
          {index > 0 ? (index === legacy.sources.length - 1 ? ", and as " : ", as ") : ""}
          {playedAs(legacy, source)}
        </span>
      ))}
    </>
  );
}
