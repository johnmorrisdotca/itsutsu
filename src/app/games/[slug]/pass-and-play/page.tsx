import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { GameTrailNav } from "@/components/games/GameTrail";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PartyCheckersGame } from "@/components/party/PartyCheckersGame";
import { PARTY_COPY } from "@/components/party/party.constants";
import { appearanceFor } from "@/lib/auth/members";
import { currentReader } from "@/lib/auth/currentReader";
import { PARTY_PLAY_GAMES } from "@/lib/gomoku/party/partyCheckers";
import { gamePath, variantFor } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";

/** The game this address is about, when it is one with a table for more than two. */
function partyGameFor(slug: string) {
  const variant = variantFor(slug);
  return variant !== null && PARTY_PLAY_GAMES.includes(variant) ? variant : null;
}

export async function generateMetadata({ params }: PageProps<"/games/[slug]/pass-and-play">): Promise<Metadata> {
  const variant = partyGameFor((await params).slug);
  return { title: variant === null ? "Games" : `${RULE_VARIANT_DISPLAY[variant].label}: ${PARTY_COPY.title}` };
}

/**
 * A GAME FOR THE WHOLE TABLE, ON ONE DEVICE, at /games/<slug>/pass-and-play.
 *
 * Chinese Checkers for two, three, four or six, passed round one phone or
 * tablet (John, 2026-09-28). Beside `/play`, the practice board for two: this
 * is its own address because it is its own game — more colours than the
 * engine has, and a table rather than two seats — and only the games in
 * `PARTY_PLAY_GAMES` answer here.
 *
 * Playing is for members, as every board is: the gate lets nobody in here
 * without an invite, and the game's own page, which a stranger can read, is
 * where it is offered. Nothing here is written anywhere but the reader's own
 * browser, so the only thing read on the server is how they like their board
 * drawn.
 */
export default async function PassAndPlayPage({ params }: PageProps<"/games/[slug]/pass-and-play">) {
  const variant = partyGameFor((await params).slug);
  if (variant === null) notFound();
  const copy = RULE_VARIANT_DISPLAY[variant];
  const reader = await currentReader();
  const appearance = (await appearanceFor(reader.memberId)) ?? DEFAULT_APPEARANCE;

  return (
    <Page board>
      <SiteHeader />
      <GameTrailNav game={{ label: copy.label, href: gamePath(variant) }} steps={[{ label: PARTY_COPY.title }]} />
      <PageTitle title={`${copy.label}, ${PARTY_COPY.title.toLowerCase()}`} kanji={PARTY_COPY.kanji} lead={PARTY_COPY.lead} />
      <PartyCheckersGame appearance={appearance} gameHref={gamePath(variant)} />
    </Page>
  );
}
