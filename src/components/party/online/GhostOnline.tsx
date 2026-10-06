"use client";

import { useState } from "react";

import { AskIfAway } from "@/components/game/AskIfAway";
import { ghostJudge } from "@/lib/party/superghost/ghostWords";
import { GHOST_PHASE, ghostLettersOf, playGhost, spellsWord, withLetter } from "@/lib/party/superghost/superghost";
import type { GhostEnd, GhostGame, GhostMove } from "@/lib/party/superghost/superghost.types";
import type { GhostTableMove } from "@/lib/party/online/onlineWordGames";

import { GhostFragment } from "../GhostFragment";
import { GhostKeys } from "../GhostKeys";
import { GhostRoundOver, GhostTurnLine } from "../GhostTurnLine";
import { useGhostWords } from "../useGhostWords";
import type { OnlineBoardProps } from "./online.types";
import { ghostWords, onlineWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * SUPERGHOST AT A TABLE ON SEVERAL DEVICES: the turn line, the fragment and
 * the keys the table on one device draws, the keys only on the reader's own
 * turn. The word list is loaded in this browser and judges the move here —
 * whether a letter finished a word, whether a word named is one — and that
 * verdict goes with the move: the server takes this browser's word for words
 * and checks the rest (`onlineWordGames.ts`, John 2026-09-29).
 */
export function GhostOnline({ game, canMove, onMove }: OnlineBoardProps<GhostGame, GhostTableMove>) {
  const say = useSpeaker();
  const GHOST_COPY = ghostWords(say.locale);
  const ONLINE_COPY = onlineWords(say.locale);
  const [pending, setPending] = useState<string | null>(null);
  const words = useGhostWords(game.language);
  const judge = words === "ready" ? ghostJudge(game.language) : null;
  const playing = game.phase !== GHOST_PHASE.finished;

  const move = (made: GhostMove) => {
    if (judge === null || playGhost(game, made, judge) === null) return;
    const word =
      made.kind === "letter" ? spellsWord(game, withLetter(game.fragment, made.letter, made.end), judge) : made.kind === "answer" ? judge.isWord(made.word) : false;
    setPending(null);
    onMove({ move: made, word });
  };
  const onEnd = (end: GhostEnd) => {
    if (pending !== null && canMove) move({ kind: "letter", letter: pending, end });
  };

  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="ghost-game" data-state={game.phase} data-rounds={game.rounds.length} data-words={words}>
      <div className="flex flex-col gap-3" data-testid="ghost-stage">
        <GhostTurnLine game={game} judge={judge} />
        <GhostFragment game={game} pending={playing && canMove ? pending : null} onEnd={onEnd} note={<GhostRoundOver game={game} judge={judge} />} />
      </div>
      {words === "loading" ? <p className="text-sm text-muted" data-testid="ghost-words-loading">{GHOST_COPY.loading}</p> : null}
      {playing && canMove ? <GhostKeys key={`${game.rounds.length}:${game.record}`} game={game} pending={pending} onPending={setPending} onMove={move} judge={judge} /> : null}
      {/* "ARE YOU STILL THERE?" on the reader's own turn, as every surface a person plays on asks. */}
      <AskIfAway watching={canMove && playing} detail={ONLINE_COPY.idleDetail} kept={ONLINE_COPY.idleKept} />
    </div>
  );
}

/** A seat's standing at Superghost: the letters of the ghost it holds, or none. */
export function ghostStanding(game: GhostGame, seat: number): string {
  const held = ghostLettersOf(game, seat);
  return held === "" ? "—" : held;
}
