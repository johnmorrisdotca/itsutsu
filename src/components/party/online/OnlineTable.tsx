"use client";

import { useRouter } from "next/navigation";
import { PartyColoursProvider } from "../partyMarbles";
import { PartySeatColour } from "../PartySeatColour";
import type { PieceColour } from "@/lib/pieces/pieceColours";
import { useCallback, useMemo, useState } from "react";

import { WinCoverOver, useWinMoment } from "@/components/game/WinCover";
import { resultLine, tableNews } from "@/components/game/winNews";
import { TableWallpaper } from "../TableWallpaper";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS } from "@/components/ui/ui.constants";
import { ONLINE_SEAT_KINDS, ONLINE_STATUS } from "@/lib/party/online/online.constants";
import type { OnlineTableView } from "@/lib/party/online/online.types";
import { onlineRulesOf } from "@/lib/party/online/onlineGames";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { OnlineSeats } from "./OnlineSeats";
import { ONLINE_COPY } from "./online.constants";
import type { OnlineTableProps } from "./online.types";
import { ONLINE_VIEWS } from "./onlineViews";
import { useComputerTurn } from "./useComputerTurn";
import { useOnlineTable } from "./useOnlineTable";

/**
 * A PARTY TABLE ON SEVERAL DEVICES, at /games/<slug>/tables/<id>: the game's
 * own board, drawn from the table the server keeps, answering a tap only on
 * the reader's own turn; the seats, with each open seat's link; and Leave and
 * End. See docs/plans/party-online/README.md.
 *
 * A move is sent with how many moves the page had seen, and the answer is the
 * new table, which this page takes as its own copy. Every other page at the
 * table sees it at its next poll (`useOnlineTable`). The rules the board is
 * drawn from are the same ones the server checks the move by
 * (`onlineRulesOf`), so what a page offers is what the server takes.
 */
export function OnlineTable({ initial, appearance, intervals, gameHref, gameLabel, tags }: OnlineTableProps) {
  const hydrated = useHydrated();
  const router = useRouter();
  const { view, mutate, paused, resume, hurrying, every } = useOnlineTable(initial, intervals);
  const rules = onlineRulesOf(view.game);
  const shown = ONLINE_VIEWS[view.game];
  const names = view.seats.map((seat) => seat.name).join("\n");
  const game = useMemo(() => {
    const decoded = rules.decode(view.state);
    return decoded === null ? null : rules.named(decoded, names.split("\n"));
  }, [rules, view.state, names]);
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<"leave" | "end" | null>(null);

  const send = useCallback(
    async (move: unknown, seat: number) => {
      setSending(true);
      setProblem(null);
      try {
        const answer = await fetch(`/api/tables/${view.id}/moves`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ moves: view.moveCount, seat, move }),
        });
        const body = (await answer.json().catch(() => null)) as (OnlineTableView & { error?: string; table?: OnlineTableView | null }) | null;
        if (answer.ok && body !== null) await mutate(body, { revalidate: false });
        else {
          if (body?.table) await mutate(body.table, { revalidate: false });
          setProblem(body?.error ?? ONLINE_COPY.couldNotStart);
        }
      } catch {
        setProblem("The site could not be reached.");
      } finally {
        setSending(false);
      }
    },
    [view.id, view.moveCount, mutate],
  );
  const { thinking } = useComputerTurn({ view, rules, send, sending });

  const seatAction = async (what: "leave" | "end") => {
    setProblem(null);
    const answer = await fetch(`/api/tables/${view.id}/${what}`, { method: "POST" }).catch(() => null);
    setConfirming(null);
    if (answer === null || !answer.ok) {
      const body = (await answer?.json().catch(() => null)) as { error?: string } | null;
      setProblem(body?.error ?? "The site could not be reached.");
      return;
    }
    if (what === "leave") router.push("/play");
    else await mutate();
  };

  const playing = view.status === ONLINE_STATUS.playing;
  /*
   * THE WIN COVER over the board (`WinCover`), when this page sees the table
   * finish — by the reader's own move or at the next poll — and never on a
   * finished table opened again. Said to the reader: "You win", or the quieter
   * cover naming who did. A table somebody ended has no winner, and no cover.
   */
  const moment = useWinMoment(playing ? "playing" : view.status === ONLINE_STATUS.finished ? "ended" : "unknown");
  const news = moment.open
    ? tableNews({
        names: view.seats.map((seat, at) => seat.name || (seat.kind === ONLINE_SEAT_KINDS.computer ? ONLINE_COPY.computerSeat : `Player ${at + 1}`)),
        winners: view.winners,
        you: view.mySeat,
        next: null,
      })
    : null;
  const canMove = playing && view.toPlay === view.mySeat && !sending;
  // Every place's colour as the server keeps it, and how this reader changes their own (`setTableColour`).
  const colours = view.seats.map((one) => one.colour);
  const chooseColour = async (_seat: number, colour: PieceColour | null) => {
    const response = await fetch(`/api/tables/${view.id}/colour`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ colour }) });
    if (response.ok) void mutate();
  };

  return (
    <PartyColoursProvider colours={colours} choose={(seat, colour) => void chooseColour(seat, colour)}>
    <section
      className="grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start"
      // A table for the size chooser (`BoardScale`): at Large and Full the board takes the room and the side keeps a width of its own.
      data-scale-desk
      data-testid="online-table"
      data-game={view.game}
      data-state={view.status}
      data-version={view.version}
      data-to-play={view.toPlay ?? undefined}
      data-my-seat={view.mySeat}
      data-poll-every={every}
      data-poll-hurrying={hurrying ? "true" : undefined}
      {...readyMark(hydrated)}
    >
      {/* The board's column, for the size chooser and for just the board. */}
      <div className="flex min-w-0 flex-col gap-3" data-scale-board data-bare-board>
        <StatusLine view={view} sending={sending} thinking={thinking} />
        {game === null ? null : (
          <WinCoverOver news={news} onClose={moment.close}>
            <shown.Board game={game} appearance={appearance} canMove={canMove} onMove={(move: unknown) => void send(move, view.mySeat)} />
          </WinCoverOver>
        )}
        {problem !== null ? (
          <p className="text-sm text-shu" role="alert" data-testid="online-problem">
            {problem}
          </p>
        ) : null}
        {paused ? (
          <button type="button" onClick={resume} className="self-start text-xs text-muted underline underline-offset-4" data-testid="online-paused">
            {ONLINE_COPY.paused}
          </button>
        ) : null}
      </div>

      <aside className="flex min-w-0 flex-col gap-4">
        {/* This reader's own colour, any time while the table plays; nobody chooses anybody else's. */}
        {playing ? (
          <div data-chrome>
            <PartySeatColour seat={view.mySeat} name="" yours playing={view.seats.length} />
          </div>
        ) : null}
        <OnlineSeats view={view} standing={(seat) => (game === null ? "" : shown.standing(game, seat))} gameLabel={gameLabel} tags={tags} />
        {playing ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {confirming === null ? (
              <>
                <button type="button" onClick={() => setConfirming("leave")} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="online-leave">
                  {ONLINE_COPY.leave}
                </button>
                {view.canEnd ? (
                  <button type="button" onClick={() => setConfirming("end")} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="online-end">
                    {ONLINE_COPY.end}
                  </button>
                ) : null}
              </>
            ) : (
              <span className="flex flex-wrap items-center gap-2" data-testid="online-confirm">
                <span>{confirming === "leave" ? ONLINE_COPY.leaveConfirm : ONLINE_COPY.endConfirm}</span>
                <button type="button" onClick={() => void seatAction(confirming)} className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="online-confirm-yes">
                  {confirming === "leave" ? ONLINE_COPY.leaveYes : ONLINE_COPY.endYes}
                </button>
                <button type="button" onClick={() => setConfirming(null)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`}>
                  {ONLINE_COPY.keep}
                </button>
              </span>
            )}
          </div>
        ) : null}
        {view.status === ONLINE_STATUS.finished ? <TableWallpaper game={view.game} result={resultLine(view.seats.map((seat, at) => seat.name || `Player ${at + 1}`), view.winners)} /> : null}
        <p className="text-sm">
          <Link href={gameHref} className="underline underline-offset-4">
            {ONLINE_COPY.about} →
          </Link>
        </p>
      </aside>
    </section>
    </PartyColoursProvider>
  );
}

/** What the table waits on, in words: the reader, somebody by name, an open seat — or how it ended. */
function StatusLine({ view, sending, thinking }: { view: OnlineTableView; sending: boolean; thinking: boolean }) {
  if (view.status === ONLINE_STATUS.ended) {
    return (
      <p className={`${PANEL_CLASS} text-sm`} data-testid="online-status" data-state="ended">
        {ONLINE_COPY.ended(view.endedBy)}
      </p>
    );
  }
  if (view.status !== ONLINE_STATUS.playing || view.toPlay === null) return null;
  const toPlay = view.seats[view.toPlay];
  const yours = view.toPlay === view.mySeat;
  const words = sending
    ? ONLINE_COPY.sending
    : thinking
      ? ONLINE_COPY.computerThinking(toPlay?.name || ONLINE_COPY.computerSeat)
    : yours
      ? ONLINE_COPY.yourTurn
      : toPlay?.kind === ONLINE_SEAT_KINDS.open
        ? ONLINE_COPY.waitingOpen
        : ONLINE_COPY.waitingOn(toPlay?.name || (toPlay?.kind === ONLINE_SEAT_KINDS.computer ? ONLINE_COPY.computerSeat : `Player ${view.toPlay + 1}`));
  return (
    <p
      className={`text-sm font-semibold ${yours ? "text-ink" : "text-muted"}`}
      data-testid="online-status"
      data-yours={yours ? "true" : undefined}
      data-thinking={thinking ? "true" : undefined}
      aria-live="polite"
    >
      {words}
    </p>
  );
}
