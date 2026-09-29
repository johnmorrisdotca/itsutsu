"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * A PASS-AND-PLAY GAME KEPT IN THIS BROWSER, one game at a time under its own
 * key: Chinese Checkers round the star (`partyCheckersStore.ts`), Pair Go
 * (`pairGoStore.ts`), and Halma round the square (`partyHalmaStore.ts`).
 *
 * One game at a time, in `localStorage`, as text the game's own module writes
 * and reads back (never the board, which the moves make again), and nowhere
 * else: no account, no database, nothing a server is asked. A table of friends
 * round one phone is a thing that happens on that phone, and it is kept there
 * so that closing the tab, or answering a call, does not lose the game — leave
 * and come back, and it is where it was.
 *
 * `useSyncExternalStore` rather than an effect that sets state (see
 * `doorstepMemory.ts`): the server has no browser to read, so it answers
 * `undefined` — "not read yet", which is not the same as "no game" — and the
 * page draws nothing either way until the browser has said which.
 *
 * Every access is wrapped. A browser told to block site data throws rather
 * than answering, and a game that will not start because a convenience failed
 * is worse than one that is not kept.
 */
export function keptInBrowser<Game>(
  key: string,
  encode: (game: Game) => string,
  decode: (text: string | null) => Game | null,
): {
  keep: (game: Game | null) => void;
  useKept: () => [Game | null | undefined, (game: Game | null) => void];
} {
  const listeners = new Set<() => void>();

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    // Another tab of this browser playing the same game: its moves arrive here too.
    const fromElsewhere = (event: StorageEvent) => {
      if (event.key === key) listener();
    };
    window.addEventListener("storage", fromElsewhere);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", fromElsewhere);
    };
  }

  /*
   * The game as last written, when storage refused to take it: this tab plays
   * on from here, and only the keeping past it is lost.
   */
  let unkept: string | null | undefined;

  function read(): string | null {
    if (unkept !== undefined) return unkept;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  const onTheServer = () => undefined;

  /** Write a game down, or forget the kept one; everybody reading it hears. */
  function keep(game: Game | null): void {
    const text = game === null ? null : encode(game);
    try {
      if (text === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, text);
      unkept = undefined;
    } catch {
      /* Storage refused: the game goes on in this tab, and is not kept past it. */
      unkept = text;
    }
    for (const listener of listeners) listener();
  }

  /**
   * The kept game — `undefined` until the browser has been asked, null when it
   * holds none (or holds something that is not a game it can play out again) —
   * and the way to keep another.
   */
  function useKept(): [Game | null | undefined, (game: Game | null) => void] {
    const text = useSyncExternalStore<string | null | undefined>(subscribe, read, onTheServer);
    const game = useMemo(() => (text === undefined ? undefined : decode(text)), [text]);
    const keepIt = useCallback((next: Game | null) => keep(next), []);
    return [game, keepIt];
  }

  return { keep, useKept };
}
