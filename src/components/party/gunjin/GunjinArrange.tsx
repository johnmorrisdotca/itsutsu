"use client";

import { useMemo, useState } from "react";

import { roleName } from "@johnmorrisdotca/gunjin";
import { rosterForSetup } from "@/lib/party/gunjin/gunjinEngine";

import type { Appearance } from "@/components/board/board.types";
import { BUTTON_BASE, BUTTON_LEAD, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS } from "@/components/ui/ui.constants";
import { arrangementIsValid, homeSquares, randomArrangement } from "@/lib/party/gunjin/gunjin";
import type { GunjinGame, GunjinPlacement, GunjinSquare } from "@/lib/party/gunjin/gunjin.types";
import { gunjinSeatView } from "@/lib/party/gunjin/gunjinView";
import { freshSeed } from "@/lib/puzzles/random";
import { seededRandom } from "@/lib/party/gunjin/gunjin";

import { GunjinBoard } from "./GunjinBoard";
import { gunjinBoardWords, gunjinPlacingWords, gunjinWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/** The pieces of a roster as "General ×1, Colonel ×2": each kind once with how many. */
function rosterCounts(roster: readonly string[]): { kind: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const kind of roster) counts.set(kind, (counts.get(kind) ?? 0) + 1);
  return [...counts].map(([kind, count]) => ({ kind, count }));
}

const sameSquare = (a: GunjinSquare, b: GunjinSquare) => a.x === b.x && a.y === b.y;

/**
 * A SIDE ARRANGING ITS PIECES IN SECRET: the board with only the arranger's own
 * pieces on it, a shuffle to start from, and a tap to swap two pieces or move
 * one to an empty square of its own rows. The arrangement is the first move:
 * Finish setup hands the rules the whole of it and they take it or refuse it
 * with the board's own placing rules said aloud.
 *
 * Mounted once per arranger (`key`), so the second side never starts from the
 * first side's pieces; the draft lives here and nowhere else until it is
 * finished, and the board it is drawn on is the arranger's view, which shows no
 * enemy piece because none has been placed.
 */
export function GunjinArrange({
  game,
  appearance,
  onFinish,
  busy = false,
  framed = true,
}: {
  game: GunjinGame;
  appearance: Appearance;
  onFinish: (placements: readonly GunjinPlacement[]) => void;
  busy?: boolean;
  /** Whether the screen lays itself out (the board and its presses, side matter beside them), or is a plain column inside a table that does (`GunjinOnline`). */
  framed?: boolean;
}) {
  const say = useSpeaker();
  const GUNJIN_COPY = gunjinWords(say.locale);
  const GUNJIN_PLACING_RULES = gunjinPlacingWords(say.locale);
  const seat = game.match.currentPlayer;
  const board = gunjinBoardWords(say.locale)[game.size]!;
  const [draft, setDraft] = useState<GunjinPlacement[]>(() => randomArrangement(game, seededRandom(freshSeed())));
  const [picked, setPicked] = useState<GunjinSquare | null>(null);
  const [refused, setRefused] = useState(false);
  const home = useMemo(() => homeSquares(game.size, seat), [game.size, seat]);
  const view = useMemo(() => gunjinSeatView(game, seat as 0 | 1).view, [game, seat]);
  const roster = useMemo(() => rosterCounts(rosterForSetup(game.match, seat as 0 | 1)), [game.match, seat]);

  const onSquare = (square: GunjinSquare) => {
    setRefused(false);
    const there = draft.find((piece) => sameSquare(piece, square));
    if (picked === null) {
      if (there !== undefined) setPicked(square);
      return;
    }
    if (sameSquare(picked, square)) {
      setPicked(null);
      return;
    }
    const mine = draft.find((piece) => sameSquare(piece, picked));
    if (mine === undefined) return;
    if (there === undefined && !home.some((one) => sameSquare(one, square))) return;
    setDraft((was) =>
      was.map((piece) => {
        if (piece === mine) return { ...piece, x: square.x, y: square.y };
        if (there !== undefined && piece === there) return { ...piece, x: picked.x, y: picked.y };
        return piece;
      }),
    );
    setPicked(null);
  };

  const finish = () => {
    if (!arrangementIsValid(game, draft)) {
      setRefused(true);
      return;
    }
    onFinish(draft);
  };
  const chosen = picked === null ? null : draft.find((piece) => sameSquare(piece, picked));
  const boardEl = (
    <GunjinBoard
      view={view}
      appearance={appearance}
      label={GUNJIN_COPY.boardLabel(board.name)}
      draft={draft}
      selected={picked}
      targets={picked === null ? [] : home.filter((square) => !sameSquare(square, picked))}
      onSquare={onSquare}
      testId="gunjin-arrange-board"
    />
  );
  const presses = (
    <div className="flex min-w-0 flex-col gap-3" data-bare-beside={framed ? "" : undefined}>
      <p className="min-h-5 text-sm font-semibold" aria-live="polite" data-testid="gunjin-arrange-chosen">
        {chosen === undefined || chosen === null ? "" : GUNJIN_COPY.chosen(roleName("en", chosen.kind))}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`${BUTTON_BASE} ${BUTTON_QUIET}`}
          onClick={() => {
            setDraft(randomArrangement(game, seededRandom(freshSeed())));
            setPicked(null);
            setRefused(false);
          }}
          data-testid="gunjin-shuffle"
        >
          {GUNJIN_COPY.shuffle}
        </button>
        <button type="button" className={`${BUTTON_LEAD} ${BUTTON_STRONG}`} onClick={finish} disabled={busy} data-testid="gunjin-finish">
          {GUNJIN_COPY.finish}
        </button>
      </div>
      {refused ? (
        <p className="text-sm text-shu" role="alert" data-testid="gunjin-arrange-refused">
          {GUNJIN_COPY.invalid} {GUNJIN_PLACING_RULES[board.mode] ?? ""}
        </p>
      ) : null}
    </div>
  );
  // How to arrange, and the pieces to arrange: side matter, which just the board leaves out.
  const help = (
    <div className={`${PANEL_CLASS} flex min-w-0 flex-col gap-3`}>
      <p className="text-sm text-muted" data-testid="gunjin-arrange-help">
        {GUNJIN_COPY.arrangeHelp}
      </p>
      <div className="flex flex-col gap-1" data-testid="gunjin-roster">
        <span className="text-xs font-semibold tracking-[0.1em] text-muted uppercase">{GUNJIN_COPY.yourPieces}</span>
        <ul className="grid grid-cols-2 gap-x-3 text-xs">
          {roster.map(({ kind, count }) => (
            <li key={kind}>
              {roleName("en", kind)} ×{count}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
  if (!framed) {
    return (
      <div className="flex min-w-0 flex-col gap-3" data-testid="gunjin-arrange" data-seat={seat} data-pieces={draft.length}>
        {boardEl}
        {presses}
        <div data-chrome>{help}</div>
      </div>
    );
  }
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start" data-scale-desk data-testid="gunjin-arrange" data-seat={seat} data-pieces={draft.length}>
      {/* The board's column: the board, and under it the presses, which sit beside it in just the board on a desk (`data-bare-beside`, globals.css). */}
      <div className="flex min-w-0 flex-col gap-3" data-scale-board data-bare-board>
        {boardEl}
        {presses}
      </div>
      <aside className="flex min-w-0 flex-col gap-3">{help}</aside>
    </div>
  );
}
