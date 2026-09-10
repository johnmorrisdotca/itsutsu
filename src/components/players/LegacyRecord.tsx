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
  Record<LegacyKind, { badge: string; tail: string; here: string }>
> = {
  remembered: {
    badge: "Remembered",
    tail: "Never played on Itsutsu \u2014 this record is kept, not earned here.",
    // Not "no games yet". There will not be any, and saying "yet" of somebody
    // who has died is the wrong word in the one place it would be noticed.
    here: "No games on Itsutsu. This record was made elsewhere, before this site existed, and is kept rather than added to.",
  },
  honorary: {
    badge: "Honorary member",
    tail: "Never played on Itsutsu \u2014 kept here as an honorary member, in her own right.",
    here: "No games on Itsutsu. An honorary member has a record here without having played for it \u2014 should she ever take a seat, this is where those games would appear.",
  },
};

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
