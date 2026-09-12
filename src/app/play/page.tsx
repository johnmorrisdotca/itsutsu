import { Paired } from "@/components/i18n/Paired";
import Link from "next/link";

import { LocalGameCardClient } from "@/components/mine/LocalGameCardClient";
import { MyGamesList } from "@/components/mine/MyGamesList";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";

export const metadata = { title: "My games 対局" };

// Every section of this reads the database on each visit; none of it is the
// same twice.
export const dynamic = "force-dynamic";

/**
 * The games somebody has going, on a page of their own.
 *
 * They used to be halfway down the lobby, under the sentence that starts a
 * game and the board of open seats and the room — a page that did four jobs
 * and grew a section every time somebody played. John, with several games on
 * the go: "IYT does this — you play your move, then the next game opens up.
 * We do not. Not very good discoverability. Just that icon up top."
 *
 * So the games you are playing are a place rather than a region of a longer
 * page. Starting a NEW one is its own page too, at /games/new — /games/<slug>/play
 * is a board and /games is the catalogue, so the games' own namespace keeping the
 * catalogue reads right and your matches getting an address of their own reads
 * better than both sharing one.
 *
 * AND THE WAY TO START ONE IS NOW REACHABLE FROM HERE, which for a while it was
 * not. This page listed your games and offered the catalogue, so a member with
 * nothing to move had to go to Games, pick one, and only then meet the screen
 * that settles a game — three pages to do the thing this page makes you want to
 * do. New game is in the navigation now, and the empty list offers it directly.
 * Not a third control on top of those: the bar is on every page, and a page with
 * its own duplicate of a bar row is a page with two answers to one question.
 *
 * AT /play, WHICH WAS /my-games. John: "why is it called My-games? really
 * hate that dash... why not just /play?" The stronger reason than the dash
 * is that the navigation already said Play and pointed here, so the label
 * and the address disagreed, and the label was the one that was right: on
 * a correspondence site, "play" means the games waiting on you. No redirect
 * from the old address, by this site's standing rule that an address is
 * right rather than forgiving — a bookmark to /my-games is a 404 now.
 */
export default async function MyGamesPage({ searchParams }: PageProps<"/play">) {
  const asked = await searchParams;
  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="flex items-baseline gap-2 text-lg font-semibold">
            <Paired en="My games" kanji="対局" kanjiClassName="text-sm font-normal opacity-70" />
          </h1>
          <p className="max-w-prose text-sm text-muted">
            Yours to move first, oldest waiting at the top — the one that has been sitting
            longest is usually the one somebody is wondering about.
          </p>
        </div>
        {/*
          The CATALOGUE, which is a different errand from starting a game and
          reads as one now that the bar carries New game: this is "show me what
          there is to play", not "play something". The offer to start one is in
          the navigation and in the empty list, where a reader who has nothing to
          move will meet it.
        */}
        <Link href="/games" className="text-sm font-semibold underline underline-offset-4" data-testid="to-new-game">
          All the games 遊び方 →
        </Link>
      </div>

      {/*
        Which group, if any, the reader has asked to see whole. A query
        parameter rather than component state, so an opened group is an address
        — linkable, reloadable, and the same page on the way back. See
        `MyGamesList`.
      */}
      <MyGamesList showAll={typeof asked.all === "string" ? asked.all : null} />
      <LocalGameCardClient />
    </Page>
  );
}
