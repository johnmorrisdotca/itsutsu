import { connection } from "next/server";
import Link from "next/link";

import { PlayerActions } from "@/components/players/PlayerActions";
import { PlayerLink, StandingsTable } from "@/components/players/Standings";
import { RecordLine } from "@/components/players/PlayerRecord";
import { PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { currentEmail } from "@/lib/auth/currentSession";
import { findMember, findMembersByNames, type NamedMember } from "@/lib/auth/members";
import { standingsPath } from "@/lib/gomoku/slugs";
import { fetchPlayerRecord } from "@/lib/history/playerRecord";
import { playerKey } from "@/lib/rating/playerKey";
import { fetchVariantLeaders } from "@/lib/rating/variantRatings";
import { buddyEmails } from "@/lib/social/buddies";
import { ignoredEmails } from "@/lib/social/ignores";

/**
 * Where everybody stands at one game, on that game's own page.
 *
 * Four of the seven things John asked a game's page to do, and they are four
 * because he listed them separately rather than because they are four
 * questions: who is best at it, where everybody stands, where the reader
 * stands, and whether any of these people would give them a game. Each is the
 * same ladder read from a different seat, so they are one panel.
 *
 * ALL OF THIS ALREADY EXISTED, at /champions/<slug>, and nothing led there but
 * a word in the footer. The page every game name on this site points at — the
 * rules page, which `GameName` sends every list, every record row and every
 * family card to — had a text link to it and no ladder on it. So the site had
 * two candidates for a game's front door: one already largely right and
 * unreachable, the other reachable from everywhere and stopping short.
 *
 * The front door is the rules page, because that is where the links already
 * go. This brings the ladder to the door rather than moving the door.
 * /champions/<slug> keeps the FULL fifty and the separate ladder against the
 * programs, and is linked from the head of this panel: a slice here, the whole
 * set one click on, which is the promise `GameCount` already makes about every
 * number on this site.
 *
 * `connection()` for the same reason `PlayedHere` has it. Every rules page is
 * prerendered, and a database read in one asks at build time a question only a
 * running site can answer — the build died on /rules/drop-four once already
 * and nothing deployed at all.
 */

/** How much of the ladder a game's own page shows before sending you to all of it. */
const SHOWN = 10;

export async function GameLadder({ variant, title }: { variant: string; title: string }) {
  await connection();

  /*
   * NOTHING ABOUT PEOPLE FOR A READER WITH NO INVITE, and this is the gate's
   * decision rather than a new one of mine.
   *
   * `/rules` is one of the few open paths in `proxy.ts`, and the reason
   * written there is exact: the rules and learning pages "are documentation:
   * they render nothing a visitor wrote, hold no data, and are the pages you
   * would want someone to be able to read and link to before deciding to ask
   * for an invite". A ladder is the opposite of all three — it is members'
   * names, their ratings and their records, and it is the site's data rather
   * than its documentation.
   *
   * So the front door has two halves. What a game IS, which anybody may read
   * and link to, and who plays it, which is for members. Moving the ladder
   * onto the rules page must not quietly move the gate with it, and a check
   * here rather than in `proxy.ts` is the right place for the same reason the
   * gate file says: additions belong after a decision has arrived at yes,
   * never inside the deciding.
   *
   * Read before anything else, so an anonymous request costs no query at all.
   */
  const mine = await currentEmail();
  if (mine === null) return null;

  const [standings, me] = await Promise.all([fetchVariantLeaders(variant, SHOWN), findMember(mine)]);

  /* What the reader may do about the people on this ladder, for the names actually shown. */
  const [members, buddies, ignored] = await Promise.all([
    findMembersByNames(standings.map((one) => one.name)) as Promise<Map<string, NamedMember>>,
    buddyEmails(mine),
    ignoredEmails(mine),
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
      : ((await fetchPlayerRecord(me.name)).byVariant.find((row) => row.variant === variant) ?? null);

  const leader = standings[0];

  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="game-ladder">
      <h2 className={`${SECTION_TITLE} flex items-baseline justify-between gap-2`}>
        <span>
          Who is best at it <span className="font-mincho normal-case tracking-normal">名人</span>
        </span>
        <Link
          href={standingsPath(variant)}
          className="text-xs font-normal tracking-normal normal-case underline-offset-2 hover:underline"
          data-testid="game-ladder-all"
        >
          The whole ladder →
        </Link>
      </h2>

      {leader === undefined ? (
        <p className="text-sm text-muted" data-testid="game-ladder-empty">
          Nobody holds a standing at {title} yet. Finish a rated game against another member and the
          first one appears here.
        </p>
      ) : (
        <>
          {/*
            Said in a sentence as well as shown in a table, because "who's the
            best at that game" is a question with one name for an answer, and a
            reader should not have to read a ranking to get it.
          */}
          <p className="text-sm" data-testid="game-champion">
            <span className="text-muted">Champion:</span> <PlayerLink name={leader.name} />{" "}
            <span className="font-mono tabular-nums text-muted">{leader.rating}</span>
          </p>
          <div className="overflow-x-auto">
            <StandingsTable
              standings={standings}
              actions={(standing) => {
                const member = members.get(playerKey(standing.name));
                const email = member?.email ?? null;
                return (
                  <PlayerActions
                    email={email}
                    memberId={member?.id}
                    isBuddy={email !== null && buddies.has(email)}
                    ignoring={email !== null && ignored.has(email)}
                    isComputer={Boolean(member?.botTier)}
                    isYou={email !== null && email === mine}
                    signedIn
                    compact
                    testId="ladder-actions"
                  />
                );
              }}
              actionsLabel="Ask"
            />
          </div>
        </>
      )}

      {/*
        Where the reader stands at this game, under the ladder they are
        reading. Their own figure and the ladder's are deliberately not the
        same number — a standing is rated games in one pool, this is every game
        of it they have finished — and each of these counts leads to exactly
        the games it counted.
      */}
      {me !== null && yours !== null ? (
        <p
          className="flex flex-wrap items-baseline gap-x-2 border-t border-rule pt-2 text-sm"
          data-testid="your-game-record"
        >
          <span className="text-muted">Your record at {title}:</span>
          <RecordLine record={yours} of={{ player: me.name, variant }} testId="your-game-record-line" />
        </p>
      ) : null}
    </section>
  );
}
