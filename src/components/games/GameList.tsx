import { Paired } from "@/components/i18n/Paired";

import { GameListRows } from "@/components/games/GameListRows";
import type { GameListEntry } from "@/components/games/games.types";
import type { CatalogueStats } from "@/lib/catalogue/catalogue.types";
import { HOME_FAMILIES, familyPagePath } from "@/lib/gomoku/families";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { type GameKey, gameCopyFor, isCasualKind, isHousekiKind, isPartyKind, isPuzzleKind } from "@/lib/catalogue/gameKeys";
import { familyBlurb } from "@/lib/gomoku/familyCopy";
import { aliasesFor } from "@/lib/legacy/gameAliases";
import type { Locale } from "@/lib/i18n/i18n.types";

import { SECTION_HEADING } from "@/components/ui/ui.constants";
import { currentSpeaker } from "@/lib/i18n/currentLocale";

/**
 * Every game on the site, as plain text: the name, its name in its own script,
 * one line on what it is, what the other sites called it, and everywhere it
 * lives here. No cards and no filter — the simplest view there is, for whoever
 * wants to read the whole list at once. Each name still has its small board
 * beside it, because a game named in a list shows its picture wherever it is
 * listed (`gamePictures.coverage.test.ts`), and a plain list is a list.
 *
 * It was a page of its own, /games/all, linked from the colophon. That made
 * the plain list a different RESOURCE from the games rather than a different
 * way of looking at them — two indexes to keep in step, and a footer link as
 * the only way to the second. It is a view now, at /games/list.
 */
export async function GameList({ stats, signedIn }: { stats: CatalogueStats; signedIn: boolean }) {
  const say = await currentSpeaker();
  const locale = say.locale;
  return (
    <div className="flex flex-col gap-8" data-testid="every-game">
      <p className="text-sm text-muted">
        {/*
          A count of RULE SETS, not of games anybody played — "forty games in
          ten families" is a fact about the catalogue, and the catalogue is the
          page it is printed on.
        */}
        {say.say("gamepages.listIntro", { games: String(RULE_VARIANT_LIST.length), families: String(HOME_FAMILIES.length) })}
      </p>
      {/*
        Each game once, under its home: Party games lists only its own party
        games here, since each guest on its shelf is already listed where it lives.
      */}
      {HOME_FAMILIES.map((family) => (
        <section key={family.title} className="flex flex-col gap-3" data-testid="every-game-family">
          <h2 className={`${SECTION_HEADING} border-b border-rule pb-1`}>
            <Paired en={family.title} kanji={family.kanji} kanjiClassName="text-sm font-normal opacity-70" />
            <span className="ml-auto text-xs font-normal text-muted">
              {say.count("count.gameKind", family.games.length)}
            </span>
          </h2>
          <p className="text-sm text-muted">{familyBlurb(family, locale)}</p>
          <GameListRows
            entries={family.games.map((variant) => entryFor(variant, stats, locale))}
            familyHref={familyPagePath(family)}
            signedIn={signedIn}
          />
        </section>
      ))}
    </div>
  );
}

/**
 * One row's words and figures, read here on the server because the tables they
 * come from (a game's copy, the names other sites gave it) are not for a
 * browser; the rows draw them (`GameListRows`).
 */
function entryFor(variant: GameKey, stats: CatalogueStats, locale: Locale): GameListEntry {
  const copy = gameCopyFor(variant, locale);
  const board = !(isPuzzleKind(variant) || isPartyKind(variant) || isCasualKind(variant) || isHousekiKind(variant));
  return {
    variant,
    tagline: copy.tagline,
    ...(copy.inspiredBy === undefined ? {} : { inspiredBy: copy.inspiredBy }),
    aliases: board ? aliasesFor(variant) : [],
    ...(board ? { stats: stats.games[variant] } : {}),
  };
}
