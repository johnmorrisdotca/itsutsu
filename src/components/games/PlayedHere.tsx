import { connection } from "next/server";
import Link from "next/link";

import { GameCount } from "@/components/games/GameCount";
import { PlayerName } from "@/components/players/PlayerName";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { SEAT_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { recordPath } from "@/lib/gomoku/slugs";
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
 */
export async function PlayedHere({ variant, title }: { variant: string; title: string }) {
  await connection();

  const [played, counts] = await Promise.all([recentGamesOf(variant), fetchPlayedCounts()]);
  if (played.length === 0) return null;
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
      <ul className="flex flex-col divide-y divide-rule text-sm">
        {played.map((game) => (
          <li key={game.id} className="flex items-baseline justify-between gap-2 py-1.5">
            <span className="min-w-0 truncate">
              <PlayerName name={game.blackName} fallback={SEAT_DISPLAY.one.label} />
              <span className="px-1 text-muted">vs</span>
              <PlayerName name={game.whiteName} fallback={SEAT_DISPLAY.two.label} />
            </span>
            <Link
              href={recordPath(variant, game.id)}
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
