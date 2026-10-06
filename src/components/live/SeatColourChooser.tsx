"use client";

import { useState } from "react";

import { STONE_SETS } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import { PieceColourPicker } from "@/components/board/PieceColourPicker";
import { GAME_STATUS } from "@/lib/gomoku/gomoku.constants";
import { stoneName } from "@/lib/gomoku/seatWords";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { pieceColourName, type PieceColour } from "@/lib/pieces/pieceColours";
import { refusalWords, seatColourRefusal, type SeatColours } from "@/lib/pieces/seatColours";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

import { rememberPieceColour } from "./rememberPieceColour";

/**
 * YOUR PIECES' COLOUR IN A LIVE GAME, AND ONLY YOURS. John, 2026-09-29: "allow
 * people to select their Marble colour when they lay their first move… IYT i
 * think confirms your colour when you're doing the first move."
 *
 * Shared: the choice is written on the game (`POST /api/games/[id]/colour`),
 * so the player opposite and anyone watching see the same pieces, as on
 * ItsYourTurn — a colour only one of the two saw would make "your red stones"
 * mean nothing across the board. The side keeps its name: the rules, the
 * openings and the record are written in Black and White, and "Black to move"
 * still says which side, while the stones show the colour.
 *
 * `first` is the moment IYT asks: the seat's first move, drawn beside whose
 * turn it is with the words that ask. Every other time it is a quiet row under
 * the board, for changing it forty moves in.
 */
export function SeatColourChooser({
  gameId,
  seat,
  token,
  colours,
  appearance,
  first,
  saves,
  onChanged,
}: {
  gameId: string;
  seat: Stone;
  token: string | null;
  colours: SeatColours;
  appearance: Appearance;
  /** The seat has not moved yet and it is its turn: ask, as IYT does. */
  first: boolean;
  /** An account to remember the colour on as this member's usual (`pieceColour`). */
  saves: boolean;
  onChanged: (colours: SeatColours) => void;
}) {
  const say = useSpeaker();
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const side = stoneName(say, seat);
  const set = STONE_SETS[appearance.stoneSet];

  async function choose(colour: PieceColour | null) {
    setBusy(true);
    setProblem(null);
    try {
      const response = await fetch(`/api/games/${gameId}/colour`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colour, ...(token === null ? {} : { token }) }),
      });
      const answer = (await response.json().catch(() => null)) as { colours?: SeatColours; error?: string } | null;
      if (!response.ok || answer?.colours === undefined) {
        setProblem(answer?.error ?? say.say("live.seatColourFailed"));
        return;
      }
      onChanged(answer.colours);
      if (saves) rememberPieceColour(colour);
    } finally {
      setBusy(false);
    }
  }

  const chosen = colours[seat] ?? null;
  return (
    <div
      className={first ? "flex flex-col gap-2 rounded-xl border border-rule bg-ivory px-3 py-2.5" : "flex flex-col gap-1.5"}
      data-testid="seat-colour"
      data-first={first ? "true" : "false"}
      data-colour={chosen ?? "usual"}
    >
      <p className="text-sm">
        {first ? (
          <>
            <span className="font-semibold">{say.say("live.yourPieces")}</span>{" "}
            {say.pairsWithKanji ? <span className="font-mincho text-muted">色</span> : null}
            {say.pairsWithKanji ? " — " : "："}
            {chosen === null
              ? say.say("live.seatColourFirst", { colour: side.toLowerCase() })
              : say.say("live.seatColourChosen", { name: pieceColourName(say, chosen), colour: side })}
          </>
        ) : (
          <span className="text-muted">
            {chosen === null
              ? say.say("live.seatColourLine", { colour: side })
              : say.say("live.seatColourLineNamed", { colour: side, name: pieceColourName(say, chosen) })}
          </span>
        )}
      </p>
      <PieceColourPicker
        value={chosen}
        onChoose={(colour) => void choose(colour)}
        usual={{ face: seat === "black" ? set.black : set.white, name: say.say("live.seatColourUsual", { colour: side }) }}
        label={say.say("live.seatColourPlaying", { colour: side })}
        unavailable={(colour) => {
          const refusal = seatColourRefusal(seat, colour, colours);
          return refusal === null ? null : refusalWords(refusal, say);
        }}
        disabled={busy}
        testId="seat-colour-picker"
      />
      {problem !== null ? (
        <p className="text-xs text-shu" role="alert" data-testid="seat-colour-problem">
          {problem}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Where the chooser stands on a live board: beside whose turn it is on the
 * seat's first move (`place="first"`), under the board after that
 * (`place="later"`), and nowhere for somebody watching or a game that is over.
 */
export function LiveSeatColour({
  place,
  seat,
  state,
  yourTurn,
  ...rest
}: Omit<Parameters<typeof SeatColourChooser>[0], "first" | "seat"> & {
  place: "first" | "later";
  seat: Stone | null;
  state: { status: string; moves: readonly { stone: Stone }[] };
  yourTurn: boolean;
}) {
  if (seat === null || state.status !== GAME_STATUS.playing) return null;
  const first = yourTurn && !state.moves.some((move) => move.stone === seat);
  if ((place === "first") !== first) return null;
  return <SeatColourChooser {...rest} seat={seat} first={first} />;
}
