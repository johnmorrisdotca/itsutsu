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
 * page. Starting a NEW one is its own page too, at /games, where the games
 * themselves already live — /games/<slug> is a board and /games/all is the
 * catalogue, so the games' own namespace keeping the catalogue reads right
 * and your matches getting an address of their own reads better than both
 * sharing one.
 */
export default function MyGamesPage() {
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
          The way out of this page is starting another game, so it is on the
          page rather than only in the navigation.
        */}
        <Link href="/games" className="text-sm font-semibold underline underline-offset-4" data-testid="to-new-game">
          All the games 遊び方 →
        </Link>
      </div>

      <MyGamesList />
      <LocalGameCardClient />
    </Page>
  );
}
