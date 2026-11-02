"use client";

import { useEffect, useRef, useState } from "react";

import { COMPUTER_TAKEOVER_MS, ONLINE_SEAT_KINDS } from "@/lib/party/online/online.constants";
import type { OnlineRules, OnlineTableView } from "@/lib/party/online/online.types";
import type { ComputerAnswer, ComputerAsk } from "@/lib/party/online/onlineComputerWorker";
import { computerDriver } from "@/lib/party/online/onlineSeats";

/**
 * A COMPUTER'S TURN, WORKED OUT IN THIS BROWSER when this browser is the one
 * that should (`computerDriver`): the member whose move handed the computer
 * the turn, at once; anybody at the table once it has waited thirty seconds.
 * The search runs in a worker (`onlineComputerWorker.ts`), so the board never
 * freezes, and the move is sent like any other, for the computer's seat, and
 * checked by the server like any other.
 *
 * ASKED ONCE PER POSITION: keyed on the table's move count and the seat to
 * play, as the live board's own computer seat is (`useBotSeat`), so a
 * re-render with the same position never asks again, and an answer about a
 * position the table has left is dropped by its number. The only timer is
 * this page's own thirty-second wait for a takeover, which asks the server
 * nothing.
 *
 * `thinking` is true while the worker is working, for the page to say so.
 */
export function useComputerTurn<S, M>({
  view,
  rules,
  send,
  sending,
}: {
  view: OnlineTableView;
  rules: OnlineRules<S, M>;
  send: (move: M, seat: number) => void;
  sending: boolean;
}): { thinking: boolean } {
  const [now, setNow] = useState<number | null>(null);
  const [thinking, setThinking] = useState(false);
  const worker = useRef<Worker | null>(null);
  const asked = useRef(0);
  const latest = useRef({ send });
  useEffect(() => {
    latest.current = { send };
  });

  const readerId = view.seats.find((one) => one.yours)?.memberId ?? null;
  const toPlay = view.toPlay === null ? undefined : view.seats[view.toPlay];
  const level = toPlay?.kind === ONLINE_SEAT_KINDS.computer && rules.computers !== undefined ? rules.computers.levelOf(toPlay) : null;
  const due = readerId !== null && level !== null && view.toPlay !== null;
  const table = {
    status: view.status,
    toPlay: view.toPlay,
    moveCount: view.moveCount,
    movedAt: new Date(view.movedAt),
    seats: view.seats,
    lastMoverId: view.lastMoverId,
  };
  const driving = due && readerId !== null && now !== null && computerDriver(table, readerId, new Date(now)) && typeof Worker !== "undefined";

  // The clock is read in an effect, never in render: once when the turn arrives, and once more when a takeover falls due.
  useEffect(() => {
    if (!due) return;
    const waits = Math.max(0, new Date(view.movedAt).getTime() + COMPUTER_TAKEOVER_MS - Date.now());
    const first = window.setTimeout(() => setNow(Date.now()), 0);
    const later = window.setTimeout(() => setNow(Date.now()), waits + 50);
    return () => {
      window.clearTimeout(first);
      window.clearTimeout(later);
    };
  }, [due, view.movedAt, view.moveCount]);

  // One worker for as long as this browser answers for a computer at the table.
  useEffect(() => {
    if (!driving) return;
    const made = new Worker(new URL("@/lib/party/online/onlineComputerWorker.ts", import.meta.url), { type: "module" });
    worker.current = made;
    made.addEventListener("message", (event: MessageEvent<ComputerAnswer>) => {
      if (event.data.id !== asked.current) return;
      setThinking(false);
      const answer = event.data;
      if (answer.move !== null) latest.current.send(answer.move as M, answer.seat);
    });
    made.addEventListener("error", () => setThinking(false));
    return () => {
      asked.current += 1;
      made.terminate();
      worker.current = null;
      setThinking(false);
    };
  }, [driving]);

  const position = `${view.moveCount}:${view.toPlay}`;
  useEffect(() => {
    if (!driving || sending || worker.current === null || view.toPlay === null || level === null) return;
    asked.current += 1;
    setThinking(true);
    worker.current.postMessage({ id: asked.current, game: view.game, state: view.state, seat: view.toPlay, level } satisfies ComputerAsk);
    // The state is read with the position: a new table at the same position is the same question.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driving, sending, position]);

  return { thinking };
}
