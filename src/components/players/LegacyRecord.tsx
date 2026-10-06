import type { Speaker } from "@/lib/i18n/i18n";
import { weave } from "@/lib/i18n/weave";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";
import { SITE_NAME } from "@/lib/i18n/siteName";
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
  Record<LegacyKind, { tail: PhraseKey; tailWithGamesHere: PhraseKey; here: PhraseKey }>
> = {
  remembered: {
    tail: "players.keptTailRemembered",
    tailWithGamesHere: "players.keptTailRememberedHere",
    // Not "no games yet". There will not be any, and saying "yet" of somebody
    // who has died is the wrong word in the one place it would be noticed.
    here: "players.keptHereRemembered",
  },
  honorary: {
    tail: "players.keptTailHonorary",
    tailWithGamesHere: "players.keptTailHonoraryHere",
    here: "players.keptHereHonorary",
  },
};

export function keptRecordTail(kind: LegacyKind, gamesHere: number, say: Speaker): string {
  const copy = KEPT_RECORD_COPY[kind];
  if (gamesHere > 0) return say.say(copy?.tailWithGamesHere ?? "players.keptTailFallbackHere", { site: SITE_NAME });
  return say.say(copy?.tail ?? "players.keptTailFallback", { site: SITE_NAME });
}

function playedAs(legacy: LegacyPlayer, source: LegacySource, say: Speaker) {
  const handle = <span className="font-medium text-ink-soft">{source.handle ?? legacy.name}</span>;
  const site = <span className="font-medium text-ink-soft">{source.site}</span>;
  return weave(
    source.joined !== undefined && source.lastActive !== undefined
      ? say.say("players.playedAsYears", { from: source.joined, to: source.lastActive })
      : say.say("players.playedAs"),
    { handle, site },
  );
}

export function PlayedEverywhere({ legacy, lead, say }: { legacy: LegacyPlayer; lead: string; say: Speaker }) {
  return (
    <>
      {lead}{" "}
      {say.listPieces(legacy.sources.map((source) => <span key={source.site}>{playedAs(legacy, source, say)}</span>))}
    </>
  );
}
