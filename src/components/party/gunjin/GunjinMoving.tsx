"use client";

import { useMemo, useState } from "react";

import type { Appearance } from "@/components/board/board.types";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import type { GunjinGame, GunjinSquare } from "@/lib/party/gunjin/gunjin.types";
import { gunjinNewsLines } from "@/lib/party/gunjin/gunjinNews";
import { gunjinSeatView } from "@/lib/party/gunjin/gunjinView";

import { GunjinBoard } from "./GunjinBoard";
import { gunjinBoardWords, gunjinWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

const sameSquare = (a: GunjinSquare | null, b: GunjinSquare) => a !== null && a.x === b.x && a.y === b.y;

/** The last few moves, as both players may read them, beside the board. */
export function MovesPanel({ game, names, note }: { game: GunjinGame; names: readonly string[]; note?: string }) {
  const say = useSpeaker();
  const GUNJIN_COPY = gunjinWords(say.locale);
  const lines = gunjinNewsLines(game, names, 6, say);
  return (
    <div className={`${PANEL_CLASS} flex min-w-0 flex-col gap-2`} data-testid="gunjin-moves">
      {note === undefined ? null : <p className="text-sm text-muted">{note}</p>}
      <span className="text-xs font-semibold tracking-[0.1em] text-muted uppercase">{GUNJIN_COPY.lastMove}</span>
      {lines.length === 0 ? (
        <p className="text-sm text-muted">{GUNJIN_COPY.noMovesYet}</p>
      ) : (
        <ol className="flex flex-col gap-1 text-sm" data-testid="gunjin-moves-list">
          {lines.map((line, at) => (
            <li key={`${at}-${line}`}>{line}</li>
          ))}
        </ol>
      )}
    </div>
  );
}

/**
 * A SIDE AT THE BOARD: its own ranks, the other side as backs, the last move
 * ringed, and — when it is this side's turn to move (`active`) — a piece to
 * choose and a lit square to send it to. The same screen at a table round one
 * device and at one on two (`GunjinOnline`), drawn from the seat's view alone
 * (`gunjinSeatView`), which is why it can be given a game with the other side's
 * secrets already taken out. `active` off, the board is only to look at.
 */
export function GunjinMoving({
  game,
  seat,
  names,
  appearance,
  active = true,
  framed = true,
  onMove,
}: {
  game: GunjinGame;
  seat: 0 | 1;
  names: readonly string[];
  appearance: Appearance;
  active?: boolean;
  /** Whether the screen lays itself out (the board and what plays it, side matter beside them), or is a plain column inside a table that does (`GunjinOnline`). */
  framed?: boolean;
  onMove: (from: GunjinSquare, to: GunjinSquare) => void;
}) {
  const say = useSpeaker();
  const GUNJIN_COPY = gunjinWords(say.locale);
  const [picked, setPicked] = useState<GunjinSquare | null>(null);
  const { view, legal } = useMemo(() => gunjinSeatView(game, seat), [game, seat]);
  const board = gunjinBoardWords(say.locale)[game.size]!;
  const targets = useMemo(() => (picked === null ? [] : legal.filter((move) => sameSquare(picked, move.from)).map((move) => move.to)), [legal, picked]);
  const last = game.match.log.at(-1);
  const onSquare = (square: GunjinSquare) => {
    if (picked !== null && targets.some((one) => one.x === square.x && one.y === square.y)) {
      onMove(picked, square);
      setPicked(null);
      return;
    }
    const mine = (view.pieces ?? []).some((piece) => piece.owner === seat && piece.x === square.x && piece.y === square.y);
    setPicked(mine && !sameSquare(picked, square) ? square : null);
  };
  const hint = !active ? GUNJIN_COPY.watching : picked === null ? GUNJIN_COPY.pickPiece : targets.length === 0 ? GUNJIN_COPY.noMoves : GUNJIN_COPY.pickTarget(names[seat]!);
  const drawn = (
    <GunjinBoard
      view={view}
      appearance={appearance}
      label={GUNJIN_COPY.boardLabel(board.name)}
      selected={picked}
      targets={targets}
      last={last?.from !== undefined && last.to !== undefined ? { from: last.from, to: last.to } : null}
      onSquare={active ? onSquare : undefined}
    />
  );
  const hinted = (
    <p className="text-sm font-semibold" data-bare-beside={framed ? "" : undefined} data-testid="gunjin-hint" aria-live="polite">
      {hint}
    </p>
  );
  if (!framed) {
    return (
      <div className="flex min-w-0 flex-col gap-3" data-testid="gunjin-moving" data-seat={seat} data-active={active ? "true" : "false"}>
        {drawn}
        {hinted}
        {/* The moves are furniture in just the board. */}
        <div data-chrome>
          <MovesPanel game={game} names={names} />
        </div>
      </div>
    );
  }
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start" data-scale-desk data-testid="gunjin-moving" data-seat={seat} data-active={active ? "true" : "false"}>
      {/* The board's column: the board, and under it what plays it, which sits beside it in just the board on a desk (`data-bare-beside`, globals.css). */}
      <div className="flex min-w-0 flex-col gap-3" data-scale-board data-bare-board>
        {drawn}
        {hinted}
      </div>
      <aside className="flex min-w-0 flex-col gap-3">
        <MovesPanel game={game} names={names} />
      </aside>
    </div>
  );
}
