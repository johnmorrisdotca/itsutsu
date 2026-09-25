import { INBOX_COPY } from "@/components/inbox/inbox.constants";
import { unreadInbox } from "@/lib/inbox/inbox";
import { currentMemberId } from "@/lib/auth/currentSession";
import Link from "next/link";

import { LocalGameCardClient } from "@/components/mine/LocalGameCardClient";
import { MyGamesList } from "@/components/mine/MyGamesList";
import { MyPuzzleRuns } from "@/components/mine/MyPuzzleRuns";
import { OpenSeatsSection } from "@/components/mine/OpenSeatsSection";
import { readOpenSeatFilter } from "@/lib/history/openSeatsFilter";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { memberNamed } from "@/lib/auth/members";

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
  // The other member the address narrows to, by id, with a name to print — or null.
  const withMember = typeof asked.with === "string" ? await memberNamed(asked.with) : null;
  // The one page that says how much is new in the inbox: one count, here, not on every page's header.
  const unread = await unreadInbox(await currentMemberId());
  return (
    <Page>
      <SiteHeader />

      <PageTitle
        title="My games"
        kanji="対局"
        lead="Yours to move first, oldest waiting at the top — the one that has been sitting longest is usually the one somebody is wondering about."
        /*
          John, 2026-09-24: the two links beside this heading were "probably
          noise". All the games went: the header's Games is the same place. The
          inbox stays only when something in it is unread, because this is the
          one page that counts it (the count is kept off every other page for
          what it costs); a link saying there is nothing new said nothing.
        */
        aside={
          unread > 0 ? (
            <Link
              href="/inbox"
              className="text-sm font-semibold text-shu underline underline-offset-4"
              data-testid="play-inbox"
              data-unread={unread}
            >
              {INBOX_COPY.unread(unread)} {INBOX_COPY.kanji} →
            </Link>
          ) : null
        }
      />

      {/*
        Which group, if any, the reader has asked to see whole. A query
        parameter rather than component state, so an opened group is an address
        — linkable, reloadable, and the same page on the way back. See
        `MyGamesList`.
      */}
      {/*
        NARROWED TO ONE PERSON, SAID, WITH THE WAY OFF. A buddy's row says
        "2 going" and this is the page those two are on: the games running
        between the reader and them, exactly the set the number counted. A
        link that narrows silently is the fault the every-count-is-a-link
        rule exists to stop, so the chip says who, and taking it off is a
        press.
      */}
      {withMember !== null ? (
        <p className="flex flex-wrap items-center gap-2 text-xs" data-testid="play-narrowed">
          <span className="text-muted">Games with</span>
          <span className="rounded-full border border-rule px-2.5 py-1 font-medium">{withMember.name}</span>
          <Link href="/play" className="text-muted underline underline-offset-4" data-testid="play-narrowed-off">
            every game
          </Link>
        </p>
      ) : null}
      <MyGamesList
        withMember={withMember?.id ?? null}
        showAll={typeof asked.all === "string" ? asked.all : null}
        /*
          And where the last page of the finished group ended. In the query beside
          `all` for the same reason: a page of a list is a place, so it can be
          linked, reloaded and arrived back at. Only the finished group pages —
          see `MyGamesList` — so a cursor without `?all=finished` names a position
          in a list nobody asked to see, and opens nothing.
        */
        cursor={typeof asked.cursor === "string" ? asked.cursor : null}
      />
      {/* The puzzles left unfinished, kept on the account: see `MyPuzzleRuns`. */}
      <MyPuzzleRuns />
      <LocalGameCardClient />
      {/*
        The seats other members have posted, and who is here: moved from the
        top of /games on 2026-09-24, when New game became the one place a game
        is set up and /games the library. See `OpenSeatsSection`.
      */}
      <OpenSeatsSection filter={readOpenSeatFilter(asked)} />
    </Page>
  );
}
