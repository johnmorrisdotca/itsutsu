"use client";

import { CasualLine } from "@/components/casual/CasualLine";
import { GameName } from "@/components/games/GameName";
import { GameStatsStrip } from "@/components/games/GameStats";
import { GameThumb } from "@/components/games/GameThumb";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { ReadyOffline } from "@/components/offline/ReadyOffline";
import { PartyLine } from "@/components/party/PartyLine";
import { PuzzleLine } from "@/components/puzzles/PuzzleLine";
import { HousekiLine } from "@/components/houseki/HousekiLine";
import Link from "@/components/ui/Link";
import { isCasualKind, isHousekiKind, isPartyKind, isPuzzleKind } from "@/lib/catalogue/gameKeys";
import { familyPath, historyPath, passAndPlayPath, playPath, rulesPath, setUpPath, standingsPath } from "@/lib/gomoku/slugs";

import { CATALOGUE_LINK_CLASS, LIST_ROW_CLASS } from "./games.constants";
import type { GameListEntry } from "./games.types";

/**
 * The rows of one family on the plain list: a game's picture and name, what it
 * is, what the other sites called it, its figures, and the links to everywhere
 * it lives here.
 *
 * A CLIENT COMPONENT SO THAT THE PAGE CARRIES EACH ROW ONCE. Drawn by the server
 * these rows were in the HTML and again, element by element, in the page's data
 * (the part of every Next page that lets it hydrate): 570 KB for 130 games on
 * 2026-11-02, 270 KB of it the second copy. A client component's rows are in the
 * HTML once and in the data as their props, a variant and a line of copy each,
 * the way the Cards tab's are. What it is handed is already in the reader's
 * language, so nothing here reaches for a table of copy or the legacy names.
 */
export function GameListRows({ entries, familyHref, signedIn }: { entries: GameListEntry[]; familyHref: string; signedIn: boolean }) {
  const say = useSpeaker();
  return (
    <dl className="flex flex-col gap-3">
      {entries.map(({ variant, tagline, inspiredBy, aliases, stats }) => {
        const facets = (play: string, family: string, board = false) => (
          <span className="flex flex-wrap gap-x-3 text-xs">
            <Link href={play} className={CATALOGUE_LINK_CLASS}>{say.say("gamepages.facetPlay")}</Link>
            <Link href={rulesPath(variant)} className={CATALOGUE_LINK_CLASS}>{say.say("gamepages.linkRules")}</Link>
            {board ? <Link href={historyPath(variant)} className={CATALOGUE_LINK_CLASS}>{say.say("gamepages.linkHistory")}</Link> : null}
            {board ? <Link href={standingsPath(variant)} className={CATALOGUE_LINK_CLASS}>{say.say("gamepages.facetLeaderboard")}</Link> : null}
            <Link href={family} className={CATALOGUE_LINK_CLASS}>{say.say("gamepages.facetFamily")}</Link>
          </span>
        );
        return (
          <div key={variant} className={LIST_ROW_CLASS} data-testid={`every-game-${variant}`}>
            <dt className="flex items-center gap-2 font-medium">
              {/*
                Its board at a table's size, beside the name that leads to
                the game like every other name on the site.
              */}
              <GameThumb variant={variant} size="small" />
              <GameName variant={variant} kanji />
            </dt>
            <dd className="flex flex-col gap-0.5 text-sm">
              <span>{tagline}</span>
              <ReadyOffline game={variant} />
              {inspiredBy !== undefined ? (
                <span className="text-xs text-muted italic">{say.say("gamescreen.inspiredBy", { name: inspiredBy })}</span>
              ) : null}
              {aliases.length > 0 ? (
                <span className="text-xs text-muted">{say.say("gamepages.alsoKnownAs", { names: say.joined(aliases) })}</span>
              ) : null}
              {/*
                The row's own figures. John: "The List View shows no row
                info either". The whole strip, since a plain list has the
                width a card does not — less its standings link, which
                the row of links just below already carries.
              */}
              {isPuzzleKind(variant) ? (
                // A puzzle has no record and no standings yet, so its row offers what it has.
                <>
                  <PuzzleLine kind={variant} signedIn={signedIn} />
                  {facets(setUpPath(variant), familyPath(variant))}
                </>
              ) : isPartyKind(variant) ? (
                // A party game is kept in one browser: no record, no standings, and its family has a page of its own.
                <>
                  <PartyLine kind={variant} signedIn={signedIn} />
                  {facets(passAndPlayPath(variant), familyHref)}
                </>
              ) : isCasualKind(variant) ? (
                // A casual game is kept in one browser: no record, no standings, and its family has a page of its own.
                <>
                  <CasualLine kind={variant} signedIn={signedIn} />
                  {facets(setUpPath(variant), familyHref)}
                </>
              ) : isHousekiKind(variant) ? (
                // A Houseki game is kept in one browser: no record of games, and its points and its family are on pages of their own.
                <>
                  <HousekiLine kind={variant} signedIn={signedIn} />
                  {facets(setUpPath(variant), familyHref)}
                </>
              ) : stats !== undefined ? (
                <>
                  <GameStatsStrip stats={stats} signedIn={signedIn} standings={false} />
                  {facets(playPath(variant), familyPath(variant), true)}
                </>
              ) : null}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
