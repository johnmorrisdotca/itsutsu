"use client";

import { useEffect, useState } from "react";

import { COMPUTER_TAKEOVER_MS } from "@/lib/party/online/online.constants";
import type { OnlineRules, OnlineTableView } from "@/lib/party/online/online.types";
import { computerDriver } from "@/lib/party/online/onlineSeats";

/**
 * A COMPUTER'S TURN, WORKED OUT IN THIS BROWSER when this browser is the one
 * that should (`computerDriver`): the member whose move handed the computer
 * the turn, at once; anybody at the table once it has waited thirty seconds.
 * The move is sent like any other, for the computer's seat, and the server
 * checks it like any other.
 *
 * No game online has a computer player yet (docs/plans/party-online/README.md,
 * "Computer seats"), so nothing calls `rules.computer` today; Kumimoji's and
 * Pair Go's arrive with their games. A clock on this page is the only timer
 * here — a thirty-second wait for a takeover asks the server nothing.
 */
export function useComputerTurn<S, M>({
  view,
  game,
  rules,
  send,
  sending,
}: {
  view: OnlineTableView;
  game: S | null;
  rules: OnlineRules<S, M>;
  send: (move: M, seat: number) => void;
  sending: boolean;
}): void {
  const [now, setNow] = useState<number | null>(null);
  const readerId = view.seats.find((one) => one.yours)?.memberId ?? null;
  const table = {
    status: view.status,
    toPlay: view.toPlay,
    moveCount: view.moveCount,
    movedAt: new Date(view.movedAt),
    seats: view.seats,
    lastMoverId: view.lastMoverId,
  };
  const due = readerId !== null && rules.computer !== undefined && view.toPlay !== null && view.seats[view.toPlay]?.kind === "computer";
  const driving = due && readerId !== null && now !== null && computerDriver(table, readerId, new Date(now));

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
  }, [due, view.movedAt, view.version]);

  useEffect(() => {
    if (!driving || sending || game === null || view.toPlay === null || rules.computer === undefined) return;
    const move = rules.computer(game, view.toPlay);
    if (move !== null) send(move, view.toPlay);
  }, [driving, sending, game, view.toPlay, view.version, rules, send]);
}
