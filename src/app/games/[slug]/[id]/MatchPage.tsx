import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";

import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { InvitePanel, type SeatInvite } from "@/components/live/InvitePanel";
import { SharedGame } from "@/components/live/SharedGame";
import { SharedRules } from "@/components/live/SharedRules";
import { NotesPanel } from "@/components/game/NotesPanel";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { STONES } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { matchPath, recordPath, seatPath, slugFor } from "@/lib/gomoku/slugs";
import { fetchGameDetail } from "@/lib/history/gameHistory";
import type { GameDetail } from "@/lib/history/gameHistory.types";
import { seatCookieName } from "@/lib/history/seatCookie";
import { resolveSeat } from "@/lib/history/seats";
import { currentEmail } from "@/lib/auth/currentSession";
import { prisma } from "@/lib/prisma";

/** The site's own origin, taken from the request so links work behind any host. */
async function origin(): Promise<string> {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host") ?? "localhost:6600";
  const protocol = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

/**
 * A match being played, at /games/<slug>/<id>.
 *
 * The board is the shared one, moving as the other side moves, and a move
 * number on the end names a position — /games/gomoku/<id>/12 is the board
 * after the twelfth stone — kept current in the bar as play goes on. Once the
 * game is over it belongs to the record, and this address hands over to
 * /history/<id>, where the same position is replayed.
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

  const claim = await resolveSeat(id, (await cookies()).get(seatCookieName(id))?.value, await currentEmail());
  const token = claim?.token;
  const seat = claim?.seat ?? null;

  // A match that is over lives in the record, at the record's address.
  if (game.status !== "active") redirect(recordPath(game.variant, game.id, move));

  return <LiveMatch game={game} token={token ?? null} seat={seat} />;
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
    <Page width="wide" gap="gap-6">
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
  </Page>
  );
}
