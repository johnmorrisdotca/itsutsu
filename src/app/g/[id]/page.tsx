import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { InvitePanel, type SeatInvite } from "@/components/live/InvitePanel";
import { SharedGame } from "@/components/live/SharedGame";
import { SharedRules } from "@/components/live/SharedRules";
import { NotesPanel } from "@/components/game/NotesPanel";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { STONES } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { fetchGameDetail } from "@/lib/history/gameHistory";
import { seatForToken } from "@/lib/history/liveGame";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Game · Gomoku",
  // A seat link is a credential; it must never be indexed.
  robots: { index: false, follow: false },
};

/** The site's own origin, taken from the request so links work behind any host. */
async function origin(): Promise<string> {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host") ?? "localhost:6600";
  const protocol = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

/**
 * A game two people play from their own devices.
 *
 * Seat links are only handed out to someone who already holds one. A reader
 * with no token, or the wrong one, gets a board they can watch and not touch —
 * so a shared spectator link cannot be turned into a seat.
 */
export default async function SharedGamePage({
  params,
  searchParams,
}: PageProps<"/g/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const token = typeof query.p === "string" ? query.p : undefined;

  const game = await fetchGameDetail(id);
  if (game === null) notFound();

  const seat = await seatForToken(id, token);

  let invites: SeatInvite[] = [];
  if (seat !== null) {
    const tokens = await prisma.game.findUnique({
      where: { id },
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
          const url = `${base}/g/${id}?p=${seatToken}`;
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
              <SharedGame initial={game} token={token ?? null} seat={seat} />
            </div>
          </div>

          <aside className="flex w-full flex-col gap-4 lg:w-80">
            <SharedRules game={game} token={token ?? null} seat={seat} />
            {seat !== null ? (
              <div className={PANEL_CLASS}>
                <NotesPanel gameKey={`shared:${id}`} />
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
