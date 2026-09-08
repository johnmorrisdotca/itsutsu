import { cookies, headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

import { GameReplay } from "@/components/history/GameReplay";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { InvitePanel, type SeatInvite } from "@/components/live/InvitePanel";
import { SharedGame } from "@/components/live/SharedGame";
import { SharedRules } from "@/components/live/SharedRules";
import { NotesPanel } from "@/components/game/NotesPanel";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { SEAT_DISPLAY, STONES } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { matchPath, seatPath, slugFor } from "@/lib/gomoku/slugs";
import { variantLabel } from "@/lib/gomoku/variants.constants";
import { fetchGameDetail } from "@/lib/history/gameHistory";
import { GAME_RESULT_DISPLAY } from "@/lib/history/gameHistory.constants";
import type { GameDetail } from "@/lib/history/gameHistory.types";
import { seatForToken } from "@/lib/history/liveGame";
import { prisma } from "@/lib/prisma";

/** The cookie a claimed seat lives in. One per match, so two games never share a claim. */
export function seatCookieName(id: string): string {
  return `seat_${id}`;
}

/** The site's own origin, taken from the request so links work behind any host. */
async function origin(): Promise<string> {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host") ?? "localhost:6600";
  const protocol = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

/**
 * A match, at /games/<slug>/<id>.
 *
 * The same address whether the game is being played or has been filed: while
 * it is live the board is the shared one, moving as the other side moves, and
 * once it is over the same page replays it. A move number on the end names a
 * position — /games/gomoku/<id>/12 is the board after the twelfth stone — and
 * both views keep the address current as the position changes, so what is in
 * the bar is always the thing on the screen.
 *
 * A seat is claimed through /seat/<token>, which puts the credential in a
 * cookie and leaves it out of the address. So a seat link can be scanned from
 * a phone, and the address that phone then shows can be read aloud, sent on
 * or screenshotted without handing the seat to anyone.
 */
export async function MatchPage({ slug, id, move }: { slug: string; id: string; move?: number }) {
  const game = await fetchGameDetail(id);
  if (game === null || slugFor(game.variant) !== slug) notFound();
  if (move !== undefined && (!Number.isInteger(move) || move < 0 || move > game.moveCount)) {
    notFound();
  }

  const token = (await cookies()).get(seatCookieName(id))?.value;
  const seat = await seatForToken(id, token);

  return game.status === "active" ? (
    <LiveMatch game={game} token={token ?? null} seat={seat} />
  ) : (
    <FiledMatch game={game} move={move ?? game.moveCount} />
  );
}

async function LiveMatch({
  game,
  token,
  seat,
}: {
  game: GameDetail;
  token: string | null;
  seat: Stone | null;
}) {
  /*
   * Seat links are only handed out to someone who already holds one. A reader
   * with no claim, or the wrong one, gets a board they can watch and not
   * touch — so a shared spectator link cannot be turned into a seat.
   */
  let invites: SeatInvite[] = [];
  if (seat !== null) {
    const tokens = await prisma.game.findUnique({
      where: { id: game.id },
      select: { blackToken: true, whiteToken: true },
    });

    if (tokens !== null) {
      const base = await origin();
      const pairs: [Stone, string][] = [
        [STONES.black, tokens.blackToken],
        [STONES.white, tokens.whiteToken],
      ];

      invites = await Promise.all(
        pairs.map(async ([stone, seatToken]) => {
          const url = `${base}${seatPath(game.variant, game.id, seatToken)}`;
          return {
            stone,
            url,
            qr: await QRCode.toDataURL(url, { width: 320, margin: 1 }),
          };
        }),
      );
    }
  }

  return (
    <div className="paper flex flex-1 flex-col items-center px-4 py-8 sm:px-8">
      <main className="flex w-full max-w-5xl flex-col gap-6">
        <SiteHeader />

        <div className="flex w-full flex-col items-start gap-8 lg:flex-row">
          <div className="w-full min-w-0 flex-1">
            <div className="mx-auto w-full max-w-[min(100%,36rem)]">
              <SharedGame
                initial={game}
                token={token}
                seat={seat}
                basePath={matchPath(game.variant, game.id)}
              />
            </div>
          </div>

          <aside className="flex w-full flex-col gap-4 lg:w-80">
            <SharedRules game={game} token={token} seat={seat} />
            {seat !== null ? (
              <div className={PANEL_CLASS}>
                <NotesPanel gameKey={`shared:${game.id}`} />
              </div>
            ) : null}
            {invites.length > 0 ? (
              <InvitePanel invites={invites} yourStone={seat} />
            ) : (
              <p className="rounded-2xl border border-dashed border-rule px-4 py-6 text-sm text-muted">
                You are watching this game. Open your own seat link to play.
              </p>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

function FiledMatch({ game, move }: { game: GameDetail; move: number }) {
  const result = GAME_RESULT_DISPLAY[game.result];
  const black = game.blackName.trim() || SEAT_DISPLAY.one.label;
  const white = game.whiteName.trim() || SEAT_DISPLAY.two.label;

  return (
    <div className="paper flex flex-1 flex-col items-center px-4 py-8 sm:px-8">
      <main className="flex w-full max-w-6xl flex-col gap-6">
        <SiteHeader />

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">
              {black} <span className="px-1 text-muted">vs</span> {white}
            </h1>
            <p className="text-sm text-muted">
              {new Date(game.playedAt).toLocaleString()} · {game.size}×{game.size} ·{" "}
              {variantLabel(game.variant)}{" "}
              · {result.label} <span className="font-mincho">{result.kanji}</span>
            </p>
          </div>
          <Link href="/history" className="text-sm underline underline-offset-4">
            Back to the record
          </Link>
        </div>

        <GameReplay
          game={game}
          initialIndex={move}
          basePath={matchPath(game.variant, game.id)}
        />
      </main>
    </div>
  );
}
