import { connection } from "next/server";
import Link from "next/link";

import { currentSession } from "@/lib/auth/currentSession";

import { GameCount } from "@/components/games/GameCount";
import { PlayerName } from "@/components/players/PlayerName";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
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
  if ((await currentSession()) === null) return null;

  const [played, counts] = await Promise.all([recentGamesOf(variant), fetchPlayedCounts()]);
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
          <li key={game.id} className="flex items-baseline justify-between gap-2 py-1.5">
            <span className="min-w-0 truncate">
              <PlayerName name={game.blackName} fallback={SEAT_DISPLAY.one.label} />
              <span className="px-1 text-muted">vs</span>
              <PlayerName name={game.whiteName} fallback={SEAT_DISPLAY.two.label} />
            </span>
            <Link
              href={matchPath(variant, game.id)}
              className="shrink-0 text-xs text-muted underline-offset-2 hover:underline"
            >
              {game.moveCount} moves
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
