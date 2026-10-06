import type { Metadata } from "next";
import { OpenSourceCredit } from "@/components/games/OpenSourceCredit";
import { appearanceFor, gameDefaultsFor } from "@/lib/auth/members";
import { preferencesFor } from "@/lib/preferences/memberPreferences";
import { currentReader } from "@/lib/auth/currentReader";
import Link from "@/components/ui/Link";
import { notFound } from "next/navigation";

import { GameViewClient } from "@/components/game/GameViewClient";
import { BoardScaled } from "@/components/board/BoardScaled";
import { RulesModal } from "@/components/games/RulesModal";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { gameNameFor } from "@/lib/catalogue/gameKeys";
import { siblingsOf } from "@/lib/gomoku/families";
import { PuzzlePlayPage } from "@/components/puzzles/PuzzlePlayPage";
import { CasualPlayPage, casualLevelAsked } from "@/components/casual/CasualPlayPage";
import { HousekiPlayPage } from "@/components/houseki/HousekiPlayPage";
import { housekiRequestOf } from "@/lib/houseki/housekiAddress";
import { gameCopyOf } from "@/lib/catalogue/gameKeys";
import { casualKindFor, gamePath, housekiKindFor, puzzleFor, variantFor } from "@/lib/gomoku/slugs";
import { puzzleForAddress } from "@/lib/catalogue/settingAddress";
import { variantCopy } from "@/lib/gomoku/variantCopy";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { SITE_NAME } from "@/lib/i18n/siteName";
import { weave } from "@/lib/i18n/weave";
import { pairedText } from "@/lib/gomoku/seatWords";
import { rulesPageFor } from "@/lib/learn/rulesPage";
import { BoardMasthead } from "@/components/board/BoardMasthead";
import { GameTrailNav } from "@/components/games/GameTrail";

export async function generateMetadata({ params }: PageProps<"/games/[slug]/play">): Promise<Metadata> {
  const { slug } = await params;
  const puzzle = puzzleFor(slug);
  const say = await currentSpeaker();
  const copy = gameCopyOf(variantFor(slug) ?? puzzle ?? casualKindFor(slug) ?? housekiKindFor(slug) ?? "", say.locale);
  return { title: copy === null ? say.say("gamepages.games") : say.say("gamepages.playGame", { game: say.pairName(copy.label, copy.kanji).text }) };
}

/**
 * A board, at /games/<slug>/play.
 *
 * The verb is in the address now, one segment under the game. It used to BE
 * /games/<slug>, which meant the game's own address was an instruction rather
 * than a reference: every link to Renju started a game of Renju, whether the
 * reader wanted one or to find out what it was. The game's address is the
 * game; this is one of the things you can do with it.
 */
export default async function PlayPage({ params, searchParams }: PageProps<"/games/[slug]/play">) {
  const { slug } = await params;
  // A puzzle's solve: the size, level and seed in the query, the grid made in the browser.
  const query = await searchParams;
  // A Gomoji's language and word list are in the query (`gameSettings.ts`).
  const puzzle = puzzleForAddress(slug, query);
  if (puzzle !== null) return <PuzzlePlayPage kind={puzzle} query={query} />;
  // A casual game: the level in the query, the board drawn in the browser (`CasualPlay`).
  const casual = casualKindFor(slug);
  if (casual !== null) return <CasualPlayPage kind={casual} level={casualLevelAsked(casual, query)} />;
  // A Houseki game: what the query asks for (a level, a lesson, the Daily or a free game), played and kept in the browser (`HousekiPlay`).
  const houseki = housekiKindFor(slug);
  if (houseki !== null) return <HousekiPlayPage kind={houseki} request={housekiRequestOf(houseki, query)} />;
  const variant = variantFor(slug);
  if (variant === null) notFound();
  const say = await currentSpeaker();
  const copy = variantCopy(variant, say.locale);
  const rules = rulesPageFor(variant, say);
  const siblings = siblingsOf(variant);
  // The member's own board, so a phone and a laptop set out the same one.
  const reader = await currentReader();
  const board = await appearanceFor(reader.memberId);
  // Where a new game starts for them: board size, the switches, the clock.
  const defaults = await gameDefaultsFor(reader.memberId);
  // How the record writes its moves, as this member last chose (`moveFormats.ts`).
  const { moveFormat } = await preferencesFor();

  return (
    <Page board="play">
      <SiteHeader />
      {/* Just the board's header (`BoardMasthead`), drawn only in that mode. */}
      <div data-bare-only>
        <BoardMasthead
          story={{ kind: say.say("gamepages.practiceBoard"), kanji: say.pairsWithKanji ? "試し打ち" : "", title: gameNameFor(variant, say), source: say.say("gamescreen.sourcePractice", { site: SITE_NAME }) }}
        />
      </div>
      <GameTrailNav game={{ label: gameNameFor(variant, say), href: gamePath(variant) }} steps={[{ label: say.say("gamepages.practiceBoard") }]} />
      {/* The board and its sidebar at the size this reader keeps for this kind of screen (`BoardScaled`). */}
      <BoardScaled>
        <GameViewClient
          variant={variant}
          trackPath
          appearance={board}
          /*
            AN ACCOUNT, NOT A SESSION, because the one thing this decides is
            whether a board choice is written back to the account — and
            PATCH /api/me answers 401 to an invite holder, who has none. It was
            named `signedIn` and read off the address, which happened to give the
            right answer under the wrong name.
          */
          savesToAccount={reader.hasAccount}
          defaults={defaults}
          moveFormat={moveFormat}
        />
      </BoardScaled>
      {/* The game's name, its rules and its family: furniture that just the board leaves out. */}
      <footer data-chrome className="flex flex-col gap-2 border-t border-rule pt-5 text-sm text-muted">
        <p>
          {/*
            The name leads to the game — its own page, where everything about
            it is — rather than to a second board, which is where the reader
            already is.
          */}
          {weave(say.say("gamepages.playFooter", { tagline: copy.tagline }), {
            game: (
              <>
                <Link href={gamePath(variant)} className="font-medium text-ink underline underline-offset-4">
                  {gameNameFor(variant, say)}
                </Link>
                {say.pairsWithKanji ? <span className="font-mincho"> {copy.kanji}</span> : null}
              </>
            ),
            // Over the board, not a page away from it: see `RulesModal`.
            rules: <RulesModal rules={{ title: rules.title, kanji: rules.kanji, object: rules.object, board: rules.board, play: rules.play, house: rules.house }} />,
          })}
        </p>
        <OpenSourceCredit game={variant} />
        {siblings !== null && siblings.games.length > 0 ? (
          <p data-testid="family-links">
            {say.say("gamepages.alsoIn", { family: pairedText(say, siblings.family.title, siblings.family.kanji) })}{" "}
            {siblings.games.map((game, i) => (
              <span key={game}>
                {i > 0 ? " · " : ""}
                <Link href={gamePath(game)} className="underline underline-offset-4">
                  {gameNameFor(game, say)}
                </Link>
              </span>
            ))}
          </p>
        ) : null}
      </footer>
  </Page>
  );
}
