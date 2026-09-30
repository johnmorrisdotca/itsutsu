import { useCallback, useEffect, useMemo, useState } from "react";

import type { CardGameKind } from "./games/cardGames.constants.ts";
import { newGame, rulesFor } from "./play.ts";
import type { GameOf, MoveOf, NewGameOptions } from "./play.ts";

/**
 * A card game in React state: the game, the moves the person to play may
 * make, and `play` to make one. Computers take their turns by themselves,
 * one move every `computerDelay` milliseconds, so a person can follow them.
 * Drawing the table is yours: this holds the game and nothing else.
 *
 * ```tsx
 * const table = useCardGame("crazyEights", { players: ["You", "Ann"], computers: [false, true] });
 * table.moves.map((move) => <button onClick={() => table.play(move)}>…</button>);
 * ```
 */
export type CardGameState<K extends CardGameKind> = {
  /** The game now, or null when the table was one the game is not offered for. */
  game: GameOf<K> | null;
  /** The seat to move, or null once the game is over. */
  toPlay: number | null;
  /** Whether the seat to move is a computer's. */
  computerToPlay: boolean;
  /** The moves the seat to move may make: none while a computer is thinking or once the game is over. */
  moves: readonly MoveOf<K>[];
  over: boolean;
  /** Every seat that won, once the game is over. */
  winners: readonly number[];
  /** Make a move for the person to play. Returns false for a move the rules refuse. */
  play: (move: MoveOf<K>) => boolean;
  /** Deal a new game with the same table and a new seed, or the options given. */
  restart: (options?: Partial<NewGameOptions>) => void;
};

export function useCardGame<K extends CardGameKind>(kind: K, options: NewGameOptions, computerDelay = 700): CardGameState<K> {
  const rules = useMemo(() => rulesFor(kind), [kind]);
  const [game, setGame] = useState<GameOf<K> | null>(() => newGame(kind, options));

  const toPlay = game === null ? null : rules.toPlay(game);
  const over = game !== null && rules.over(game);
  const computerToPlay = game !== null && toPlay !== null && !over && rules.seats(game).computers[toPlay] === true;

  useEffect(() => {
    if (!computerToPlay || game === null) return;
    const timer = setTimeout(() => setGame((now) => (now === game ? (rules.play(game, rules.computer(game)) ?? now) : now)), computerDelay);
    return () => clearTimeout(timer);
  }, [computerToPlay, computerDelay, game, rules]);

  const play = useCallback(
    (move: MoveOf<K>) => {
      if (game === null || computerToPlay) return false;
      const next = rules.play(game, move);
      if (next === null) return false;
      setGame(next);
      return true;
    },
    [computerToPlay, game, rules],
  );

  const restart = useCallback((changes?: Partial<NewGameOptions>) => setGame(newGame(kind, { ...options, seed: undefined, ...changes })), [kind, options]);

  return {
    game,
    toPlay,
    computerToPlay,
    moves: game === null || computerToPlay ? [] : rules.moves(game),
    over,
    winners: over && game !== null ? rules.winners(game) : [],
    play,
    restart,
  };
}
