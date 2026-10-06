"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";

import type { PlayerView } from "@johnmorrisdotca/gunjin";
import { roleName } from "@johnmorrisdotca/gunjin";
import { drawGunjinBoard } from "@johnmorrisdotca/gunjin/draw";

import type { Appearance } from "@/components/board/board.types";
import { BoardFrame } from "@/components/board/BoardFrame";
import { BOARD_THEMES } from "@/components/board/Board.constants";
import { GUNJIN_LAKES } from "@/lib/party/gunjin/gunjin.constants";
import { squareName } from "@/lib/party/gunjin/gunjinNews";
import type { GunjinPlacement, GunjinSquare } from "@/lib/party/gunjin/gunjin.types";
import { gunjinWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";


/** The package's own board is 52 units to a square inside a viewBox that leaves 2 units all round. */
const CELL = 52;
const MARGIN = 2;

const same = (a: GunjinSquare | null | undefined, b: GunjinSquare) => a?.x === b.x && a?.y === b.y;

/**
 * THE GUNJIN BOARD, ON THE SITE'S OWN BOARD. "Every board is the same board"
 * (AGENTS.md): the wood, the rim and the shadow are `BoardFrame`'s, in the
 * reader's own board theme, as the older party boards are; inside, the package's drawing (`drawGunjinBoard`, its SVG
 * text), whose paper is its own, and over it one real button a square so a
 * press, a finger or the keyboard all choose the same square.
 *
 * IT DRAWS A PLAYER'S VIEW AND NOTHING ELSE. The package's renderer takes only
 * a `PlayerView` — the viewer's own ranks and the other side as backs — so no
 * rank the viewer may not see is ever handed to it, and the buttons' labels
 * are made from that view too. A board with no `pieces` (the hand-over, the
 * first arrangement) is the empty board.
 *
 * It draws and listens and decides nothing: a press is told to the page as a
 * square, and the page asks the rules what it means.
 */
export function GunjinBoard({
  view,
  appearance,
  label,
  selected = null,
  targets = [],
  draft,
  last = null,
  onSquare,
  testId = "gunjin-board",
}: {
  view: PlayerView;
  appearance: Appearance;
  label: string;
  selected?: GunjinSquare | null;
  targets?: readonly GunjinSquare[];
  /** The viewer's own pieces being arranged, drawn as theirs. */
  draft?: readonly GunjinPlacement[];
  /** The last move, whose two squares are ringed: it is public, and the other player needs to see what moved. */
  last?: { from: GunjinSquare; to: GunjinSquare } | null;
  onSquare?: (square: GunjinSquare) => void;
  testId?: string;
}) {
  const say = useSpeaker();
  const GUNJIN_COPY = gunjinWords(say.locale);
  const { width, height } = view;
  const theme = BOARD_THEMES[appearance.boardTheme];
  const svg = useMemo(() => drawGunjinBoard(view, { language: "en", material: "ivory", selected, targets, draft }), [view, selected, targets, draft]);
  // What stands on each square, as the viewer may know it: their own piece by name, the other side's as "Opponent piece".
  const named = useMemo(() => {
    const map = new Map<string, string>();
    for (const piece of view.pieces ?? []) map.set(`${piece.x}:${piece.y}`, piece.kind === null ? GUNJIN_COPY.opponent : roleName("en", piece.kind));
    for (const piece of draft ?? []) map.set(`${piece.x}:${piece.y}`, roleName("en", piece.kind));
    return map;
  }, [view, draft]);

  // One tab stop, the cursor, and the arrow keys move it: a hundred buttons are not a hundred tab stops.
  const [cursor, setCursor] = useState<GunjinSquare>({ x: 0, y: height - 1 });
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const onKey = (event: KeyboardEvent) => {
    const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const next = { x: Math.min(width - 1, Math.max(0, cursor.x + step[0])), y: Math.min(height - 1, Math.max(0, cursor.y + step[1])) };
    setCursor(next);
    buttons.current.get(`${next.x}:${next.y}`)?.focus();
  };

  const insetX = (MARGIN / (width * CELL + 2 * MARGIN)) * 100;
  const insetY = (MARGIN / (height * CELL + 2 * MARGIN)) * 100;
  const lakes = GUNJIN_LAKES[view.mode as keyof typeof GUNJIN_LAKES] ?? [];
  const squares = Array.from({ length: width * height }, (_, at): GunjinSquare => ({ x: at % width, y: Math.floor(at / width) }));
  return (
    <BoardFrame size={width} rows={height} theme={theme} flipped={false} inset={0} lattice={false} shape="rhombus" coordinates={false}>
      <div
        // Important, because the package's own SVG says `height: auto` inline, which a layered utility does not beat.
        className="absolute inset-0 select-none [&>svg]:h-full! [&>svg]:w-full!"
        data-testid={`${testId}-drawing`}
        // The package's own drawing: SVG text built from the view's numbers, its labels escaped by the package. No name is put in it by hand.
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div
        className="absolute"
        style={{ inset: `${insetY}% ${insetX}%`, display: "grid", gridTemplateColumns: `repeat(${width}, 1fr)`, gridTemplateRows: `repeat(${height}, 1fr)` }}
        role="group"
        aria-label={label}
        data-testid={testId}
        data-width={width}
        data-height={height}
        data-phase={view.phase}
        data-viewer={view.viewer}
        data-mode={view.mode}
        data-selected={selected === null ? "" : `${selected.x},${selected.y}`}
        data-targets={targets.map((square) => `${square.x},${square.y}`).join(" ")}
        onKeyDown={onKey}
      >
        {squares.map((square) => {
          const lake = lakes.some(([x, y]) => x === square.x && y === square.y);
          const what = lake ? GUNJIN_COPY.lake : (named.get(`${square.x}:${square.y}`) ?? GUNJIN_COPY.empty);
          const ringed = same(last?.from, square) || same(last?.to, square);
          return (
            <button
              key={`${square.x}:${square.y}`}
              ref={(element) => {
                if (element === null) buttons.current.delete(`${square.x}:${square.y}`);
                else buttons.current.set(`${square.x}:${square.y}`, element);
              }}
              type="button"
              tabIndex={same(cursor, square) ? 0 : -1}
              aria-label={GUNJIN_COPY.cell(squareName(height, square.x, square.y), what)}
              data-square={`${square.x},${square.y}`}
              data-last={ringed ? "true" : undefined}
              data-lake={lake ? "true" : undefined}
              disabled={onSquare === undefined}
              onFocus={() => setCursor(square)}
              onClick={() => onSquare?.(square)}
              className={`min-h-0 min-w-0 touch-manipulation p-0 bg-transparent focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-[#c4972e] ${ringed ? "outline-2 -outline-offset-2 outline-[#c4972e]/80" : ""}`}
            />
          );
        })}
      </div>
    </BoardFrame>
  );
}
