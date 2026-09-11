import { connection } from "next/server";
import Link from "next/link";

import { LadderSideView, PlayerLink } from "@/components/players/Standings";
import { RecordLine } from "@/components/players/PlayerRecord";
import { PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { currentMemberId, currentSession } from "@/lib/auth/currentSession";
import { findMember } from "@/lib/auth/members";
import { playPath, standingsPath } from "@/lib/gomoku/slugs";
import { fetchPlayerRecord } from "@/lib/history/playerRecord";
import { fetchVariantLeaders } from "@/lib/rating/variantRatings";

/**
 * Where everybody stands at one game, in the side column of that game's page.
 *
 * Four of the seven things John asked a game's page to do, and they are four
 * because he listed them separately rather than because they are four
 * questions: who is best at it, where everybody stands, where the reader
 * stands, and whether any of these people would give them a game. Each is the
 * same ladder read from a different seat, so they are one panel.
 *
 * A SIDE-VIEW, NOT THE TABLE. This began as the whole standings table in the
 * middle of the page, then as that table crammed into a 288px column, and John
 * named the mistake in both: "it should be a side-view so not the real view you
 * see in a full page obviously... less columns". So this is rank, player,
 * rating, twenty-five deep, and `/games/<slug>/standings` holds the records,
 * the tiers, the ladder against the programs and what a reader may do about any
 * of them. A sidebar leaderboard is a well-worn shape; the job here was to use
 * it rather than re-derive it.
 *
 * AND IT DRAWS ITS TABLE EVEN WHEN NOBODY HAS PLAYED. That is John's rule and
 * it is the opposite of what this panel used to do — it printed a sentence of
 * apology where the headings should have been. "empty tables are fine! show
 * the table. Show nothing has been played yet... and that's a change to have a
 * link saying - be the first to play!" Thirty-nine of the games here have
 * barely been touched; shown this way each of them is an invitation instead of
 * a regret. See Show The Data, Not The Way To It in AGENTS.md.
 *
 * `connection()` because a game's page is PRERENDERED — all forty of them, and
 * rightly, since what a game is does not depend on who is asking. A database
 * read out in the page itself asks at build time a question only a running site
 * can answer: it killed the build on the old /rules/drop-four and nothing
 * deployed at all. This panel is fetched when somebody actually asks for the
 * page, which is also the only moment its answer is true.
 */

/** How much of the ladder the side-view shows before sending you to all of it. */
const SHOWN = 25;

export async function GameLadder({ variant, title }: { variant: string; title: string }) {
  await connection();

  /*
   * WHO IS ASKING — the session, not the address.
   *
   * `/games/<slug>` is open without an invite, and `proxy.ts` is exact about
   * what an open page may hold: pages that "render nothing a visitor wrote"
   * and hold "no data". A ladder is the opposite of both — it is members'
   * names, their ratings and their records. So a stranger is told what this
   * panel is and shown the door, which is the honest version of the rule: an
   * empty table would say nobody has played this game, and people have.
   *
   * It is the SESSION that decides, and that distinction is a person. Asking
   * `currentEmail()` here turned away everybody who joined with an invite code
   * and never signed in with Google — which is how everybody John invites gets
   * in. Read first, so an anonymous request costs no query at all.
   */
  const session = await currentSession();
  if (session === null) {
    return (
      <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="game-ladder">
        <Heading />
        <p className="text-sm text-muted" data-testid="game-ladder-shut">
          Reading about {title} is open to anybody. Who is winning at it is the playing half of
          this site, and that needs an invite.
        </p>
        {/*
          The same words the catalogue uses for the same door, so a reader who
          has already met it recognises it rather than wondering whether this
          is a different one.
        */}
        <p className="text-sm">
          <Link href="/join" className="font-semibold underline-offset-2 hover:underline" data-testid="ladder-join">
            I have an invite →
          </Link>
        </p>
      </section>
    );
  }

  /*
   * An invite holder has no address, and several things below are about a
   * named person rather than about a reader: their own record, and which of
   * these names is theirs. Those are skipped rather than guessed at.
   */
  const mine = session.email ? session.email.trim().toLowerCase() : null;
  const [standings, me, myId] = await Promise.all([
    fetchVariantLeaders(variant, SHOWN),
    mine === null ? Promise.resolve(null) : findMember(mine),
    // The id, because a record is found by the person rather than by the name
    // they happen to go by today — see `fetchPlayerRecord`.
    mine === null ? Promise.resolve(null) : currentMemberId(),
  ]);

  /*
   * The reader's own record at THIS game, which is a different figure from
   * their standing on it: a standing counts rated games in one pool, and a
   * record counts every game they finished. Read only when there is somebody
   * to read it for — a name this page cannot establish gets no line at all,
   * rather than a line of noughts that would read as "you have never played
   * this" about somebody the page simply failed to identify.
   */
  const yours =
    me === null
      ? null
      : ((await fetchPlayerRecord(me.name, myId)).byVariant.find((row) => row.variant === variant) ?? null);

  const leader = standings[0];

  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="game-ladder">
      <Heading />

      {/*
        Said in a sentence as well as shown in a table, because "who's the best
        at that game" is a question with one name for an answer, and a reader
        should not have to read a ranking to get it.
      */}
      {leader === undefined ? null : (
        <p className="text-sm" data-testid="game-champion">
          <span className="text-muted">Champion:</span> <PlayerLink name={leader.name} />{" "}
          <span className="font-mono text-muted tabular-nums">{leader.rating}</span>
        </p>
      )}

      <LadderSideView
        standings={standings}
        emptyNote={`Nobody holds a standing at ${title} yet. A standing comes from a rated game between two members.`}
        invitation={
          leader !== undefined ? undefined : (
            <p className="text-sm">
              <Link
                href={playPath(variant)}
                className="font-semibold underline-offset-2 hover:underline"
                data-testid="ladder-be-first"
              >
                Be the first to play {title} →
              </Link>
            </p>
          )
        }
      />
      <WholeLadder variant={variant} />

      {/*
        Where the reader stands at this game, under the ladder they are
        reading. Their own figure and the ladder's are deliberately not the
        same number — a standing is rated games in one pool, this is every game
        of it they have finished — and each of these counts leads to exactly
        the games it counted.
      */}
      {me !== null && yours !== null ? (
        <div
          className="flex flex-col gap-1 border-t border-rule pt-2 text-sm"
          data-testid="your-game-record"
        >
          <span className="text-muted">Your record at {title}:</span>
          <RecordLine record={yours} of={{ player: me.name, variant }} testId="your-game-record-line" />
        </div>
      ) : null}
    </section>
  );
}

/** The panel's name. */
function Heading() {
  return (
    <h2 className={SECTION_TITLE}>
      Who is best at it <span className="font-mincho normal-case tracking-normal">名人</span>
    </h2>
  );
}

/**
 * The way on to the whole of it: the records, the tiers, the ladder against
 * the programs, and what a reader may do about any of these people.
 *
 * UNDER the table rather than beside the heading, which is both the shape a
 * reader expects of a leaderboard and the only one that fits: a 288px column
 * broke "Who is best at it 名人" across two lines to make room for it.
 *
 * It is here whether or not the ladder has anybody on it. A side-view that led
 * nowhere would be the dead end this site has a gate against, and an empty one
 * that led nowhere would be a dead end with nothing in it.
 */
function WholeLadder({ variant }: { variant: string }) {
  return (
    <p className="text-xs">
      <Link
        href={standingsPath(variant)}
        className="text-muted underline-offset-2 hover:underline"
        data-testid="game-ladder-all"
      >
        The whole ladder →
      </Link>
    </p>
  );
}
