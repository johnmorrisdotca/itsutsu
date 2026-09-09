import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";

import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { InvitePanel, type SeatInvite } from "@/components/live/InvitePanel";
import { SharedGame } from "@/components/live/SharedGame";
import { SharedRules } from "@/components/live/SharedRules";
import { GameViewClient } from "@/components/game/GameViewClient";
import { ChallengeButton } from "@/components/mine/ChallengeButton";
import { NotesPanel } from "@/components/game/NotesPanel";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { STONES } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant, Stone } from "@/lib/gomoku/gomoku.types";
import { isHotSeat } from "@/lib/history/liveGame";
import { isIgnoring } from "@/lib/social/ignores";
import { ratingRefusal } from "@/lib/rating/rateable";
import { matchPath, recordPath, seatPath, slugFor } from "@/lib/gomoku/slugs";
import { fetchGameDetail } from "@/lib/history/gameHistory";
import type { GameDetail } from "@/lib/history/gameHistory.types";
import { seatCookieName } from "@/lib/history/seatCookie";
import { resolveSeat, seatIsFree } from "@/lib/history/seats";
import { currentEmail, currentMemberId } from "@/lib/auth/currentSession";
import { appearanceFor, gameDefaultsFor } from "@/lib/auth/members";
import { appearanceFrom } from "@/components/board/appearance";
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
  if (game === null) notFound();
  /*
   * The address names the game as well as the match, and either player may
   * change the game until the first stone is down. So the slug in the address
   * goes stale the moment somebody does — and this said "there is no page at
   * this address" about the board they were sitting at, because it had just
   * stopped being a game of that name.
   *
   * The id is the identity; the slug is how the address reads. A real game
   * reached by the name it used to go under leads to the game, at the address
   * it goes under now — which also mends every link anybody sent out before
   * the rules were settled.
   */
  if (slugFor(game.variant) !== slug) redirect(matchPath(game.variant, id, move));
  if (move !== undefined && (!Number.isInteger(move) || move < 0 || move > game.moveCount)) {
    notFound();
  }

  const claim = await resolveSeat(id, (await cookies()).get(seatCookieName(id))?.value, await currentMemberId());
  const token = claim?.token;
  const seat = claim?.seat ?? null;

  // A match that is over lives in the record, at the record's address.
  if (game.status !== "active") redirect(recordPath(game.variant, game.id, move));

  /*
   * A hot-seat match — two people at one screen — opens on the full board,
   * with undo and the rest, in the browser that holds its key. Anyone else
   * who has the address may watch it.
   */
  const tokens = await prisma.game.findUnique({
    where: { id },
    select: { blackToken: true, whiteToken: true, blackMemberId: true, whiteMemberId: true },
  });
  if (tokens !== null && isHotSeat(tokens) && claim !== null) {
    // The member's own board, so a phone and a laptop set out the same one.
    const mine = await currentEmail();
    const board = await appearanceFor(mine);
    const defaults = await gameDefaultsFor(mine);
    return (
      <Page width="wide">
        <SiteHeader />
        <GameViewClient
          variant={game.variant as RuleVariant}
          trackPath
          match={{ game, at: move }}
          appearance={board}
          signedIn={mine !== null}
          defaults={defaults}
        />
      </Page>
    );
  }

  /*
   * Who sits across the board: the other seat's name and, when it is an
   * account that said where it is, its country — the way the elder sites put
   * it, "against Kyokosan from Canada".
   */
  let opponent: { name: string; country: string; awayUntil: string | null } | null = null;
  let muted: Stone | null = null;
  if (seat !== null && tokens !== null) {
    const otherId = seat === STONES.black ? tokens.whiteMemberId : tokens.blackMemberId;
    const otherName = (seat === STONES.black ? game.whiteName : game.blackName).trim();
    // Found by id, because that is what a seat holds now. The ignore list is
    // still keyed by address, so theirs is read back from the row.
    const member =
      otherId === null
        ? null
        : await prisma.member.findUnique({
            where: { id: otherId },
            select: { email: true, name: true, country: true, awayFrom: true, awayUntil: true },
          });
    const myEmail = await currentEmail();
    if (myEmail !== null && member?.email && (await isIgnoring(myEmail, member.email))) {
      muted = seat === STONES.black ? STONES.white : STONES.black;
    }
    if (member !== null || otherName !== "") {
      const now = new Date().getTime();
      const away =
        member?.awayFrom && member.awayUntil && member.awayFrom.getTime() <= now && member.awayUntil.getTime() > now
          ? member.awayUntil.toISOString()
          : null;
      opponent = { name: member?.name || otherName || "the other seat", country: member?.country ?? "", awayUntil: away };
    }
  }

  return <LiveMatch game={game} token={token ?? null} seat={seat} move={move ?? game.moveCount} opponent={opponent} muted={muted} />;
}

async function LiveMatch({
  game,
  token,
  seat,
  move,
  opponent,
  muted,
}: {
  game: GameDetail;
  token: string | null;
  seat: Stone | null;
  /** The position the address names, for forking a new game from it. */
  move: number;
  opponent: { name: string; country: string; awayUntil: string | null } | null;
  muted: Stone | null;
}) {
  /*
   * Whether this game will move a rating, and if it will not, why.
   *
   * Said here, while the game is still being played, because afterwards there
   * is nothing to say it with: the ladder has not moved and there is no gap on
   * a page to click on. A seat still posted on the noticeboard is left alone —
   * it has no name on it because nobody has taken it yet, which is a game
   * waiting rather than a game that will not count.
   */
  const refusal =
    game.rated && game.openSeat === null ? ratingRefusal(game.blackName, game.whiteName) : null;

  /*
   * The board this member likes, on the board they are actually playing on.
   * The shared game drew the default and nothing else, so a board dressed on
   * the account followed them into a local game and stopped at the door of a
   * real one.
   */
  const appearance = appearanceFrom(await appearanceFor(await currentEmail()));

  /*
   * Seat links are only handed out to someone who already holds one. A reader
   * with no claim, or the wrong one, gets a board they can watch and not
   * touch — so a shared spectator link cannot be turned into a seat.
   *
   * And only for a seat still waiting for somebody. The token IS the
   * credential — it plays that seat on its own, with no cookie and no account
   * — so this used to show each player the other's, for the length of the
   * game, which meant either of them could play the other's moves. A seat
   * somebody is already sitting in has no link worth giving out and every
   * reason not to have one on screen.
   */
  let invites: SeatInvite[] = [];
  if (seat !== null) {
    const tokens = await prisma.game.findUnique({
      where: { id: game.id },
      select: {
        blackToken: true,
        whiteToken: true,
        openSeat: true,
        blackClaimedAt: true,
        whiteClaimedAt: true,
        moveCount: true,
      },
    });

    if (tokens !== null) {
      const base = await origin();
      const pairs: [Stone, string][] = [
        [STONES.black, tokens.blackToken],
        [STONES.white, tokens.whiteToken],
      ];

      invites = await Promise.all(
        pairs
          .filter(([stone]) => seatIsFree(tokens, stone))
          .map(async ([stone, seatToken]) => {
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
              opponent={opponent}
              muted={muted}
              appearance={appearance}
            />
          </div>
        </div>

        <aside className="flex w-full flex-col gap-4 lg:w-80">
          <SharedRules game={game} token={token} seat={seat} refusal={refusal} />
          {seat !== null ? (
            <div className={`${PANEL_CLASS} flex flex-col gap-2`}>
              <h2 className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
                Fork <span className="font-mincho normal-case tracking-normal">分岐</span>
              </h2>
              <p className="text-xs text-muted">
                Start a second game from this exact position, against the same opponent. Both games go on.
              </p>
              <ChallengeButton from={{ id: game.id, move }} label={`Play from move ${move}`} />
            </div>
          ) : null}
          {seat !== null ? (
            <div className={PANEL_CLASS}>
              <NotesPanel gameKey={`shared:${game.id}`} />
            </div>
          ) : null}
          {invites.length > 0 ? (
            <InvitePanel invites={invites} yourStone={seat} />
          ) : seat === null ? (
            <p className="rounded-2xl border border-dashed border-rule px-4 py-6 text-sm text-muted">
              You are watching this game. Open your own seat link to play.
            </p>
          ) : null}
        </aside>
      </div>
  </Page>
  );
}
