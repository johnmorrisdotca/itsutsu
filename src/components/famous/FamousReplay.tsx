"use client";

import { useMemo, useState } from "react";

import { Board } from "@/components/board/Board";
import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { PlayedMoves } from "@/components/history/PlayedMoves";
import { ReplayScrubber } from "@/components/history/ReplayScrubber";
import { Button, SectionTitle } from "@/components/ui/Controls";
import { famousTimeline } from "@/lib/famous/famous";
import { famousMoveNames, famousMoves } from "@/lib/famous/famousMoves";
import type { FamousGame } from "@/lib/famous/famous.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import { BoardFocus } from "@/components/board/BoardFocus";

/**
 * A FAMOUS GAME, STEPPED THROUGH: the board at any move, the scrubber a
 * finished game has (`ReplayScrubber`) and the list of moves (`PlayedMoves`),
 * each move a place to go. John, 2026-09-25: the famous games showed pictures
 * and no moves; he asked for the record and the scrubber the practice pages
 * use, and for no second one to be built.
 *
 * Folded until asked for, one card at a time: a page of twenty games does not
 * replay twenty boards for a reader who came for one. The replay is the
 * engine's own (`famousTimeline`), so a position shown is one the rules
 * reached; an Othello game's moves keep its record's names (`famousMoveNames`).
 */
export function FamousReplay({ game }: { game: FamousGame }) {
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const count = game.moves.split(" ").filter((token) => token !== "").length;

  return (
    <div className="flex flex-col gap-3" data-testid="famous-replay" {...readyMark(hydrated)}>
      {open ? (
        <Opened game={game} onClose={() => setOpen(false)} />
      ) : (
        <Button onClick={() => setOpen(true)} data-testid="famous-replay-open">
          Step through the {count} moves <span className="font-mincho">棋譜</span>
        </Button>
      )}
    </div>
  );
}

function Opened({ game, onClose }: { game: FamousGame; onClose: () => void }) {
  const timeline = useMemo(() => famousTimeline(game), [game]);
  const moves = useMemo(() => famousMoves(timeline), [timeline]);
  const names = useMemo(() => famousMoveNames(game, moves), [game, moves]);
  const last = timeline.length - 1;
  // The end first: the card's small picture is the final position, and this opens where it left off.
  const [index, setIndex] = useState(last);
  const move = moves[index - 1];
  const said = move === undefined ? null : (names?.get(move.number) ?? null);

  return (
    <>
      {/* The board, where it stands, its scrubber and its moves: openable on their own (`BoardFocus`). */}
      <BoardFocus label="this game">
      <div className="mx-auto w-full max-w-[min(100%,30rem)]" data-focus-board>
        <Board state={timeline[index]!} appearance={DEFAULT_APPEARANCE} readOnly onPlay={() => {}} />
      </div>
      <p className="text-sm text-muted" data-testid="famous-replay-at">
        Move <span className="font-mono tabular-nums">{index}</span> of <span className="font-mono tabular-nums">{last}</span>
        {said !== null ? <span className="font-mono"> · {said}</span> : null}
      </p>
      <ReplayScrubber index={index} last={last} onGo={setIndex} testId="famous" />
      <div className="flex flex-col gap-2">
        <SectionTitle kanji="棋譜">Moves</SectionTitle>
        <PlayedMoves
          size={game.size}
          moves={moves}
          at={index}
          onJump={setIndex}
          nameOf={names === null ? undefined : (played) => names.get(played.number) ?? ""}
          testId="famous-moves"
        />
      </div>
      </BoardFocus>
      <Button onClick={onClose} data-testid="famous-replay-close">
        Fold the moves away
      </Button>
    </>
  );
}
