import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { BoardScaled } from "@/components/board/BoardScaled";
import { GameTrailNav } from "@/components/games/GameTrail";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PARTY_KIND_TABLES } from "@/components/party/partyKindTables";
import { partyTableFor } from "@/components/party/partyTables";
import type { PartyTable } from "@/components/party/party.types";
import { appearanceFor } from "@/lib/auth/members";
import { currentReader } from "@/lib/auth/currentReader";
import { gameCopyFor } from "@/lib/catalogue/gameKeys";
import type { GameKey } from "@/lib/catalogue/gameKeys";
import { gamePath, partyKindFor, variantFor } from "@/lib/gomoku/slugs";
import { onlineOfferFor } from "@/lib/party/online/server/onlineOffer";

/**
 * The game this address names and its table, or null: a rule variant with a
 * pass-and-play mode (`PARTY_TABLES`), or a party game, whose table is the
 * whole of it (`PARTY_KIND_TABLES`).
 */
function tableAt(slug: string): { key: GameKey; table: PartyTable } | null {
  const party = partyKindFor(slug);
  if (party !== null) return { key: party, table: PARTY_KIND_TABLES[party] };
  const variant = variantFor(slug);
  const table = partyTableFor(variant);
  return variant === null || table === null ? null : { key: variant, table };
}

export async function generateMetadata({ params }: PageProps<"/games/[slug]/pass-and-play">): Promise<Metadata> {
  const found = tableAt((await params).slug);
  return { title: found === null ? "Games" : headingOf(gameCopyFor(found.key).label, found.table.title) };
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
 * in `PARTY_TABLES`. And every party game (`PartyKind`: Dots and Boxes for
 * two to six, Mancala for two), for which this table is the only way to
 * play, through its row in `PARTY_KIND_TABLES`.
 *
 * Playing is for members, as every board is: the gate lets nobody in here
 * without an invite, and the game's own page, which a stranger can read, is
 * where it is offered. A game on this device is written nowhere but the
 * reader's own browser, so what is read on the server is how they like their
 * board drawn — and, where the game can be played on several devices, the
 * reader's buddies and band for the set-up's seat choosers
 * (docs/plans/party-online/README.md).
 */
export default async function PassAndPlayPage({ params }: PageProps<"/games/[slug]/pass-and-play">) {
  const found = tableAt((await params).slug);
  if (found === null) notFound();
  const { key, table } = found;
  const copy = gameCopyFor(key);
  const reader = await currentReader();
  // And, where the game can be played on several devices, what its set-up offers for that (`onlineOfferFor`).
  const [kept, online] = await Promise.all([appearanceFor(reader.memberId), onlineOfferFor(key, reader.memberId)]);
  const appearance = kept ?? DEFAULT_APPEARANCE;
  const { Game } = table;

  return (
    <Page board="play">
      <SiteHeader />
      <GameTrailNav game={{ label: copy.label, href: gamePath(key) }} steps={[{ label: table.title }]} />
      {/* Furniture, for just the board: the table and what plays it stay. */}
      <div data-chrome>
        <PageTitle
          title={headingOf(copy.label, table.title)}
          kanji={table.kanji}
          lead={table.lead}
        />
      </div>
      {/* The table at the size this reader keeps for this kind of screen (`BoardScaled`), once a game is on it. */}
      <BoardScaled>
        <Game appearance={appearance} gameHref={gamePath(key)} online={online} />
      </BoardScaled>
    </Page>
  );
}
