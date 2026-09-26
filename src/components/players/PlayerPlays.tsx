import Link from "@/components/ui/Link";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { gamesHref } from "@/components/games/GameCount";
import { PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { matchPath } from "@/lib/gomoku/slugs";
import { NOT_A_REFUSED_OFFER } from "@/lib/history/offers";
import { prisma } from "@/lib/prisma";
import { puzzleRecordHref } from "@/lib/puzzles/puzzleRecordAddress";
import { solveCountsOf } from "@/lib/puzzles/server/puzzleRecord";

import { PlayerName } from "./PlayerName";

/** The most games in progress a player's page lists; the rest are a click on their own page's record away. */
const GOING_SHOWN = 10;

/**
 * EVERYTHING SOMEBODY HAS PLAYED, AND IS PLAYING, WITHIN A CLICK OF THEIR NAME.
 *
 * John, 2026-09-26: "No way to view played games.. clicking a name takes us to
 * profile and no links to the Game Played History viewer." A name leads here,
 * so here leads on: every game they have finished (the record, narrowed to
 * them), the games they have going now, each of which can be watched, the
 * games between them and the reader, and their solves of every puzzle, each
 * puzzle leading to its record narrowed to them.
 *
 * A CHILD'S PAGE SHOWS THIS AS IT SHOWS THEIR GAMES: to members, behind the
 * invite, never to a stranger (`src/proxy.ts` keeps /players shut). What a
 * child's page holds back is reaching them — no game offered to a reader not
 * on their buddy list (`mayReachMember`) — and that stays with the page.
 *
 * Two reads for the page: their games going, and their solves counted by
 * puzzle. Nothing per row.
 */
export async function PlayerPlays({ memberId, readerId }: { memberId: string; readerId: string | null }) {
  const you = memberId === readerId;
  const [going, puzzles] = await Promise.all([
    prisma.game.findMany({
      where: {
        status: "active",
        offeredAt: null,
        ...NOT_A_REFUSED_OFFER,
        blackMemberId: { not: null },
        whiteMemberId: { not: null },
        OR: [{ blackMemberId: memberId }, { whiteMemberId: memberId }],
      },
      orderBy: [{ lastMoveAt: "desc" }, { id: "asc" }],
      take: GOING_SHOWN,
      select: { id: true, variant: true, blackName: true, whiteName: true, blackMemberId: true, whiteMemberId: true },
    }),
    solveCountsOf(memberId),
  ]);

  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-4`} data-testid="player-plays">
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <Link href={gamesHref({ memberId })} className="font-semibold underline-offset-2 hover:underline" data-testid="player-all-games">
          {you ? "Your" : "Their"} games, every one finished →
        </Link>
        {readerId !== null && !you ? (
          <Link href={gamesHref({ memberId: readerId, against: memberId })} className="underline-offset-2 hover:underline" data-testid="player-games-together">
            Your games together →
          </Link>
        ) : null}
      </p>

      <div className="flex flex-col gap-1.5" data-testid="player-going">
        <h3 className={SECTION_TITLE}>
          Playing now <span className="font-mincho normal-case tracking-normal">対局中</span>
        </h3>
        {going.length === 0 ? (
          <p className="text-sm text-muted" data-testid="player-going-none">
            No games going right now.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-rule text-sm">
            {going.map((game) => {
              const black = game.blackMemberId === memberId;
              const other = black ? { name: game.whiteName, id: game.whiteMemberId } : { name: game.blackName, id: game.blackMemberId };
              return (
                <li key={game.id} className="flex items-center justify-between gap-3 py-1.5" data-testid="player-going-game" data-game={game.id}>
                  <span className="flex min-w-0 items-center gap-2">
                    <GameThumb variant={game.variant} size="small" />
                    <span>
                      <GameName variant={game.variant} /> · vs <PlayerName name={other.name} memberId={other.id} fallback="somebody" />
                    </span>
                  </span>
                  <Link href={matchPath(game.variant, game.id)} className="text-xs underline-offset-2 hover:underline" data-testid="player-going-watch">
                    watch
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-1.5" data-testid="player-puzzles">
        <h3 className={SECTION_TITLE}>
          Puzzles <span className="font-mincho normal-case tracking-normal">解</span>
        </h3>
        {puzzles.length === 0 ? (
          <p className="text-sm text-muted" data-testid="player-puzzles-none">
            No puzzles finished here yet.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-rule text-sm">
            {puzzles.map((row) => (
              <li key={row.kind} className="flex items-center justify-between gap-3 py-1.5" data-testid="player-puzzle" data-kind={row.kind}>
                <span className="flex min-w-0 items-center gap-2">
                  <GameThumb variant={row.kind} size="small" />
                  <GameName variant={row.kind} />
                </span>
                {/* How many, leading to exactly those: this puzzle's record, narrowed to them. */}
                <Link href={puzzleRecordHref(row.kind, { member: memberId })} className="text-xs tabular-nums underline-offset-2 hover:underline" data-testid="player-puzzle-solves">
                  {row.solves} finished →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
