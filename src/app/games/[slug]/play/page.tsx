import type { Metadata } from "next";
import { appearanceFor, gameDefaultsFor } from "@/lib/auth/members";
import { preferencesFor } from "@/lib/preferences/memberPreferences";
import { currentReader } from "@/lib/auth/currentReader";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GameViewClient } from "@/components/game/GameViewClient";
import { RulesModal } from "@/components/games/RulesModal";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { gameCopyFor } from "@/lib/catalogue/gameKeys";
import { siblingsOf } from "@/lib/gomoku/families";
import { PuzzlePlayPage } from "@/components/puzzles/PuzzlePlayPage";
import { gameCopyOf } from "@/lib/catalogue/gameKeys";
import { gamePath, puzzleFor, variantFor } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { rulesPageFor } from "@/lib/learn/rulesPage";

export async function generateMetadata({ params }: PageProps<"/games/[slug]/play">): Promise<Metadata> {
  const { slug } = await params;
  const puzzle = puzzleFor(slug);
  const copy = gameCopyOf(variantFor(slug) ?? puzzle ?? "");
  return { title: copy === null ? "Games" : `Play ${copy.label}` };
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
  const puzzle = puzzleFor(slug);
  if (puzzle !== null) return <PuzzlePlayPage kind={puzzle} query={await searchParams} />;
  const variant = variantFor(slug);
  if (variant === null) notFound();
  const copy = RULE_VARIANT_DISPLAY[variant];
  const rules = rulesPageFor(variant);
  const siblings = siblingsOf(variant);
  // The member's own board, so a phone and a laptop set out the same one.
  const reader = await currentReader();
  const board = await appearanceFor(reader.memberId);
  // Where a new game starts for them: board size, the switches, the clock.
  const defaults = await gameDefaultsFor(reader.memberId);
  // How the record writes its moves, as this member last chose (`moveFormats.ts`).
  const { moveFormat } = await preferencesFor();

  return (
    <Page board>
      <SiteHeader />
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
      <footer className="flex flex-col gap-2 border-t border-rule pt-5 text-sm text-muted">
        <p>
          {/*
            The name leads to the game — its own page, where everything about
            it is — rather than to a second board, which is where the reader
            already is.
          */}
          <Link href={gamePath(variant)} className="font-medium text-ink underline underline-offset-4">
            {copy.label}
          </Link>{" "}
          <span className="font-mincho">{copy.kanji}</span> — {copy.tagline}{" "}
          {/* Over the board, not a page away from it: see `RulesModal`. */}
          <RulesModal rules={{ title: rules.title, kanji: rules.kanji, object: rules.object, board: rules.board, play: rules.play, house: rules.house }} />.
        </p>
        {siblings !== null && siblings.games.length > 0 ? (
          <p data-testid="family-links">
            Also in {siblings.family.title}{" "}
            <span className="font-mincho">{siblings.family.kanji}</span>:{" "}
            {siblings.games.map((game, i) => (
              <span key={game}>
                {i > 0 ? " · " : ""}
                <Link href={gamePath(game)} className="underline underline-offset-4">
                  {gameCopyFor(game).label}
                </Link>
              </span>
            ))}
          </p>
        ) : null}
      </footer>
  </Page>
  );
}
