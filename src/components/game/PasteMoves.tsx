"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Controls";
import { SectionTitle } from "@/components/ui/Controls";
import { INPUT_CLASS } from "@/components/ui/ui.constants";
import { VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import { MOVE_FORMATS, formatsFor, readMoves, siteOf, type MoveFormat } from "@/lib/record/readMoves";
import { PRACTICE_COPY } from "./game.constants";
import type { GamePanelProps } from "./game.types";

/**
 * A GAME SOMEBODY PASTED IN, PLAYED OUT ON THE PRACTICE BOARD.
 *
 * John, 2026-09-21: "you can paste a moves list to view that game and browse
 * around. accept several published formats on that game."
 *
 * The reading is `readMoves`, which is pure and tested against a corpus of
 * ugly real lists; this is the box, the button, and what the screen says when
 * it goes wrong. The two are apart because one of them is a parser and the
 * other is a panel, and the parser is the half worth testing hard.
 *
 * IT PLAYS THE MOVES THROUGH THE BOARD, one at a time, exactly as a finger
 * would. Nothing here decides whether a move is legal — `actions.play` asks
 * the engine, the engine answers, and a move the engine will not take stops
 * the run with its number said out loud. A reader that laid the stones out
 * itself would be a second copy of the rules, and the first wrong one.
 *
 * AND IT STARTS FROM AN EMPTY BOARD. Pasting a game onto a position somebody
 * had already clicked out would play one game on top of another and call the
 * result theirs.
 */
export function PasteMoves({ session, actions }: GamePanelProps) {
  const [text, setText] = useState("");
  const [said, setSaid] = useState<string | null>(null);
  // Which site the list came from, or null for anywhere — see `PRACTICE_COPY.paste.from`.
  const [from, setFrom] = useState<MoveFormat | null>(null);
  const { variant, size } = session.state.settings;
  const spec = VARIANT_SPECS[variant];

  function walk() {
    const site = from ?? siteOf(text);
    const read = readMoves(text, size, site !== null ? [site] : formatsFor(variant, { flips: spec.flips, go: spec.go }));
    if (read.points.length === 0) {
      setSaid(read.problem ?? PRACTICE_COPY.paste.nothing);
      return;
    }
    /*
     * ONE CALL, on a fresh board of the same game. `playMoves` keeps every
     * setting the reader has chosen — the board size, the rules, the handicap
     * — so a list is played out under the game they are looking at.
     *
     * NOT A LOOP OVER `actions.play`. That closes over the state of the render
     * it came from, so forty calls in one handler would all play move one and
     * the board would show a single stone under a list of forty. See `layOut`.
     */
    const run = actions.playMoves(read.points);
    /*
     * The reader's complaint first, then the rules'. A list that could not be
     * READ stopped before the engine ever saw it, so that is the earlier and
     * more useful thing to say; a move the rules refuse is named by number.
     */
    setSaid(
      read.problem ??
        (run.refusedAt === null
          ? PRACTICE_COPY.paste.read(run.played, read.format ?? "coordinates")
          : PRACTICE_COPY.paste.refused(run.refusedAt)),
    );
  }

  return (
    <section className="flex flex-col gap-2" data-testid="paste-moves">
      <SectionTitle kanji={PRACTICE_COPY.paste.kanji}>{PRACTICE_COPY.paste.label}</SectionTitle>
      <p className="text-xs text-muted">{PRACTICE_COPY.paste.hint(spec.flips ? "f5d6c3" : spec.go ? ";B[pd];W[dp]" : "H8 K10 J9")}</p>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={3}
        className={`${INPUT_CLASS} font-mono text-xs`}
        placeholder={PRACTICE_COPY.paste.placeholder}
        aria-label={PRACTICE_COPY.paste.label}
        data-testid="paste-moves-text"
      />
      <label className="flex items-center gap-2 text-xs text-muted">
        {PRACTICE_COPY.paste.fromLabel}
        <select
          value={from ?? ""}
          onChange={(event) => setFrom(event.target.value === "" ? null : (event.target.value as MoveFormat))}
          className={`${INPUT_CLASS} py-1 text-xs`}
          data-testid="paste-moves-from"
        >
          <option value="">{PRACTICE_COPY.paste.from.anywhere}</option>
          <option value={MOVE_FORMATS.itsYourTurn}>{PRACTICE_COPY.paste.from.itsYourTurn}</option>
          <option value={MOVE_FORMATS.goldToken}>{PRACTICE_COPY.paste.from.goldToken}</option>
        </select>
      </label>
      {from !== null ? <p className="text-xs text-muted">{PRACTICE_COPY.paste.fromHint}</p> : null}
      <div className="flex items-center gap-2">
        <Button onClick={walk} disabled={text.trim() === ""} data-testid="paste-moves-go">
          {PRACTICE_COPY.paste.button}
        </Button>
        {text === "" ? null : (
          <button
            type="button"
            onClick={() => {
              setText("");
              setSaid(null);
            }}
            className="text-xs text-muted underline underline-offset-4"
            data-testid="paste-moves-clear"
          >
            {PRACTICE_COPY.paste.clear}
          </button>
        )}
      </div>
      {/*
        WHAT HAPPENED, ALWAYS — how many moves went down as much as what could
        not be read. A box that only speaks up on failure leaves somebody who
        pasted forty moves and got twelve with no way to tell.
      */}
      {said === null ? null : (
        <p className="text-xs text-ink-soft" data-testid="paste-moves-said">
          {said}
        </p>
      )}
    </section>
  );
}
