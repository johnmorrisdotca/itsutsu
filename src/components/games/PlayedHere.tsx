import { connection } from "next/server";
import Link from "next/link";

import { currentSession } from "@/lib/auth/currentSession";
import { findMembersByNames, type NamedMember } from "@/lib/auth/members";
import { PlayerActions } from "@/components/players/PlayerActions";
import { playerKey } from "@/lib/rating/playerKey";
import { buddyEmails } from "@/lib/social/buddies";
import { ignoredEmails } from "@/lib/social/ignores";

import { GameCount } from "@/components/games/GameCount";
import { PlayerName } from "@/components/players/PlayerName";
import { PlayerLink } from "@/components/players/Standings";
import { CardArrow } from "@/components/ui/CardArrow";
import { PANEL_CLASS, RAISED_LINK, STRETCHED_LINK, STRETCHED_ROW } from "@/components/ui/ui.constants";
import { SEAT_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { matchPath, playPath } from "@/lib/gomoku/slugs";
import { fetchPlayedCounts, recentGamesOf } from "@/lib/history/gameCounts";
import { countText } from "@/lib/rating/figures";

/**
 * The games people have actually played of one game, beside its rules.
 *
 * A rules page had a staged screenshot in its sidebar and a line of prose, and
 * the real games were a small text link below four blocks of rules. John,
 * standing on that page: "where are the played games????" There were four of
 * them, finished and filed, one click away and invisible.
 *
 * A COMPONENT OF ITS OWN because of where it reads from. Every rules page is
 * prerendered at build time — forty of them, static, which is right for pages
 * that are the same for everybody. Reading the database in one of them asks a
 * question at build time that only a running site can answer, and the build
 * does not fail politely: it dies on `/rules/drop-four` with "Can't reach
 * database server at localhost:5432", and nothing deploys at all. That is what
 * happened, and it is why this is separate.
 *
 * `connection()` is how Next 16 says "this part waits for a request". The
 * rules themselves still prerender; only this panel is fetched when somebody
 * actually asks for the page, which is also the only time the answer is true.
 *
 * NOTHING AT ALL FOR SOMEBODY WITH NO SESSION, and that is the important line.
 * `/rules` is one of the few paths open without an invite, and `proxy.ts` says
 * in as many words what an open path may be: documentation, rendering "nothing
 * a visitor wrote", holding "no data". This panel broke that the day it
 * shipped — it put real members' names, their games and links to their pages
 * on a page anybody who guessed the address could read.
 *
 * Which is the same concern John spent a night on from the other side. He
 * asked for his twelve-year-old's surname off the site's lists, and this was
 * handing it to strangers in a link: the page showed "Hanako M." and the href
 * beside it read /players/hanako-morris.
 *
 * Signed in, the panel is what it was. Signed out, the rules are still the
 * rules — which is what an open page was always for.
 */
export async function PlayedHere({ variant, title }: { variant: string; title: string }) {
  await connection();

  /*
   * Documentation for a stranger; a record for anybody who is in.
   *
   * The SESSION decides, not the address: `currentEmail()` is null for a
   * browser holding an invite, and using it here hid the record from everybody
   * who joined with a code rather than with Google. A stranger is told about
   * the playing half once, by the ladder panel beside this one, rather than
   * twice by two panels saying the same thing.
   */
  const session = await currentSession();
  if (session === null) return null;
  const mine = session.email ? session.email.trim().toLowerCase() : null;

  const [played, counts] = await Promise.all([recentGamesOf(variant), fetchPlayedCounts()]);

  /*
   * THE PEOPLE, AS PEOPLE — and it is an acceptance criterion rather than a
   * flourish. `a-games-page-is-the-games-front-door` lists seven things a
   * reader must be able to do from here, one of them "BEING ABLE TO CHALLENGE
   * ANY OF THE PEOPLE WHO PLAYED IT", and says the ticket is not done "until a
   * reader can do all seven from the game's page without being sent somewhere
   * else to finish the errand".
   *
   * It lives HERE rather than on the ladder beside it, and that is a decision.
   * The ladder is a side-view now — rank, player, rating, in a 288px column,
   * because John asked for one in those words — and a column of actions does
   * not belong in it. This panel is in the wide column and is literally the
   * people who played this game, which is what the criterion names. Both asks
   * are kept rather than one traded against the other.
   *
   * One row per PERSON, not per game: the same two people playing five games
   * is one decision a reader makes about each of them, not ten.
   */
  const names = [...new Set(played.flatMap((game) => [game.blackName, game.whiteName]))].filter(
    (name) => name.trim() !== "",
  );
  const [members, buddies, ignored] = await Promise.all([
    names.length === 0
      ? Promise.resolve(new Map<string, NamedMember>())
      : (findMembersByNames(names) as Promise<Map<string, NamedMember>>),
    mine === null ? Promise.resolve(new Set<string>()) : buddyEmails(mine),
    mine === null ? Promise.resolve(new Set<string>()) : ignoredEmails(mine),
  ]);
  /*
   * Only names with an account behind them. A name typed into a game at one
   * screen is not somebody to ask anything of, and an offer to play them would
   * be an offer with nobody on the other end — the same rule `ItsutsuRecord`
   * keeps about its own opponents.
   */
  const people = names
    .map((name) => ({ name, member: members.get(playerKey(name)) }))
    .filter((one): one is { name: string; member: NamedMember } => one.member !== undefined);
  /*
   * NOT HIDDEN WHEN EMPTY. This used to `return null` here, which is the thing
   * John objected to: "empty tables are fine! show the table. Show nothing has
   * been played yet... and that's a change to have a link saying - be the first
   * to play!" A reader learns the shape of what the site keeps, and a game
   * nobody has played becomes an invitation instead of a silence. See Show The
   * Data, Not The Way To It in AGENTS.md.
   */
  const total = counts.get(variant)?.played ?? played.length;

  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="rules-played-here">
      <h2 className="flex items-baseline justify-between gap-2 text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
        <span>
          Played here <span className="font-mincho normal-case tracking-normal">棋譜</span>
        </span>
        {/*
          The count leads to all of them, which is this site's own rule about a
          number that refers to games, applied where it had not been.
        */}
        <GameCount
          count={countText(total)}
          variant={variant}
          className="normal-case tracking-normal"
          title={`Every game of ${title} played here`}
        />
      </h2>
      {played.length === 0 ? (
        <div className="flex flex-col gap-2 text-sm" data-testid="played-here-empty">
          <p className="text-muted">No games of {title} have been played here yet.</p>
          <p>
            <Link
              href={playPath(variant)}
              className="font-semibold underline-offset-2 hover:underline"
              data-testid="played-here-be-first"
            >
              Be the first to play {title} →
            </Link>
          </p>
        </div>
      ) : null}
      <ul className="flex flex-col divide-y divide-rule text-sm">
        {played.map((game) => (
          /*
            THE ROW IS THE GAME. It read as one — two names and a count of
            moves — and opened only on the small grey "5 moves" at its far
            end, which is the family-card fault on the page beside the family
            cards. The moves link is stretched over the row and the arrow
            says so; the names lead to the PEOPLE, so they are raised above
            the face. See STRETCHED_LINK in ui.constants.ts.
          */
          <li key={game.id} className={`${STRETCHED_ROW} flex items-center justify-between gap-2 rounded-md py-1.5`}>
            <span className="min-w-0 truncate">
              <PlayerName name={game.blackName} memberId={game.blackMemberId} fallback={SEAT_DISPLAY.one.label} className={RAISED_LINK} />
              <span className="px-1 text-muted">vs</span>
              <PlayerName name={game.whiteName} memberId={game.whiteMemberId} fallback={SEAT_DISPLAY.two.label} className={RAISED_LINK} />
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <Link
                href={matchPath(variant, game.id)}
                data-card-link=""
                className={`${STRETCHED_LINK} text-xs text-muted underline-offset-2 hover:underline`}
              >
                {game.moveCount} moves
              </Link>
              <CardArrow className="size-6" />
            </span>
          </li>
        ))}
      </ul>

      {people.length > 0 ? (
        <div className="flex flex-col gap-1.5 border-t border-rule pt-2" data-testid="played-here-people">
          <h3 className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
            Anyone for a game <span className="font-mincho normal-case tracking-normal">対局募集</span>
          </h3>
          <ul className="flex flex-col gap-1 text-sm">
            {people.map(({ name, member }) => (
              <li key={member.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                {/*
                  `PlayerLink` rather than `PlayerName`: these names all have a
                  member row behind them by the filter above, so there is no
                  empty seat to describe and no fallback to invent.
                */}
                <PlayerLink name={name} />
                <PlayerActions
                  compact
                  testId="played-here-actions"
                  email={member.email}
                  memberId={member.id}
                  isBuddy={member.email !== null && buddies.has(member.email)}
                  ignoring={member.email !== null && ignored.has(member.email)}
                  isComputer={Boolean(member.botTier)}
                  isYou={member.email !== null && member.email === mine}
                  signedIn={mine !== null}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
