import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { GameTrailNav } from "@/components/games/GameTrail";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { partyTableFor } from "@/components/party/partyTables";
import { appearanceFor } from "@/lib/auth/members";
import { currentReader } from "@/lib/auth/currentReader";
import { gamePath, variantFor } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";

export async function generateMetadata({ params }: PageProps<"/games/[slug]/pass-and-play">): Promise<Metadata> {
  const variant = variantFor((await params).slug);
  const table = partyTableFor(variant);
  return { title: variant === null || table === null ? "Games" : headingOf(RULE_VARIANT_DISPLAY[variant].label, table.title) };
}

/** "Chinese Checkers, pass and play"; "Pair Go" and "Block Five for four", which name their game already. */
function headingOf(game: string, title: string): string {
  return title.includes(game) ? title : `${game}, ${title.toLowerCase()}`;
}

/**
 * A GAME FOR THE WHOLE TABLE, ON ONE DEVICE, at /games/<slug>/pass-and-play.
 *
 * Chinese Checkers for two, three, four or six, passed round one phone or
 * tablet (John, 2026-09-28), Pair Go: Go for two teams of two, taking
 * turns, Halma for four racing corner to corner, and Block Five for four
 * laying shapes out from their corners. Beside `/play`, the practice board for two: this is its own address
 * because it is its own game — more players than the two seats a board has —
 * and only the games in `PARTY_PLAY_GAMES` answer here, each through its row
 * in `PARTY_TABLES`.
 *
 * Playing is for members, as every board is: the gate lets nobody in here
 * without an invite, and the game's own page, which a stranger can read, is
 * where it is offered. Nothing here is written anywhere but the reader's own
 * browser, so the only thing read on the server is how they like their board
 * drawn.
 */
export default async function PassAndPlayPage({ params }: PageProps<"/games/[slug]/pass-and-play">) {
  const variant = variantFor((await params).slug);
  const table = partyTableFor(variant);
  if (variant === null || table === null) notFound();
  const copy = RULE_VARIANT_DISPLAY[variant];
  const reader = await currentReader();
  const appearance = (await appearanceFor(reader.memberId)) ?? DEFAULT_APPEARANCE;
  const { Game } = table;

  return (
    <Page board>
      <SiteHeader />
      <GameTrailNav game={{ label: copy.label, href: gamePath(variant) }} steps={[{ label: table.title }]} />
      <PageTitle
        title={headingOf(copy.label, table.title)}
        kanji={table.kanji}
        lead={table.lead}
      />
      <Game appearance={appearance} gameHref={gamePath(variant)} />
    </Page>
  );
}
