"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import type { KeptRecordRules } from "@/lib/party/kept/kept.types";

import { resignedBy, resignWinners, splitResignation, withResignation } from "@/lib/party/resign";

import { adoptRecord, keptRecorder } from "./keptRecord";

/**
 * A PASS-AND-PLAY GAME KEPT IN THIS BROWSER, one game at a time under its own
 * key: Chinese Checkers round the star (`partyCheckersStore.ts`), Pair Go
 * (`pairGoStore.ts`), Halma round the square (`partyHalmaStore.ts`), and Block
 * Five for four (`partyBlocksStore.ts`).
 *
 * One game at a time, in `localStorage`, as text the game's own module writes
 * and reads back (never the board, which the moves make again). Play never
 * waits on a server: a table of friends round one phone is a thing that
 * happens on that phone, offline as well, and it is kept there
 * so that closing the tab, or answering a call, does not lose the game — leave
 * and come back, and it is where it was.
 *
 * AND IT IS IN ITS PLAYER'S HISTORY. The store's `record` files the game with
 * the site as it starts, ends or is put away (`keptRecord.ts`), through a
 * queue on the device, so a signed-in member finds every game they played on
 * one screen on My games › History, and can open it again on any device.
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
  /**
   * How the game is filed in its player's history (`keptRecord.ts`): which game
   * it is, whether it is over, who won and who sat where. Every store passes
   * one; a game played on one device is in the history like any other.
   */
  record?: KeptRecordRules<Game>,
  /**
   * How a table ends when its player to move resigns (`lib/party/resign.ts`):
   * the engine's own terms for over, given the seat. A game kept after
   * resigning carries the seat after its text, and is opened through this.
   */
  resign?: (game: Game, seat: number) => Game,
): {
  keep: (game: Game | null) => void;
  useKept: () => [Game | null | undefined, (game: Game | null) => void];
  adopt: (text: string, id: string) => boolean;
} {
  const listeners = new Set<() => void>();
  const plainEncode = encode;
  const plainDecode = decode;
  const resigned = resign;
  // A resignation rides after the game's own text, and opens the game as it ended.
  encode = (game) => withResignation(plainEncode(game), game as object);
  decode = (text) => {
    const split = splitResignation(text);
    const game = plainDecode(split.text);
    return game !== null && split.seat !== null && resigned !== undefined ? resigned(game, split.seat) : game;
  };
  if (record !== undefined) {
    const own = record;
    record = {
      ...own,
      over: (game) => resignedBy(game as object) !== null || own.over(game),
      winners: (game) => {
        const seat = resignedBy(game as object);
        return seat === null ? own.winners(game) : resignWinners(own.seats(game).length, seat);
      },
    };
  }

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

  const recorder = record === undefined ? null : keptRecorder(key, encode, record);

  /** Write a game down, or forget the kept one; everybody reading it hears. */
  function keep(game: Game | null): void {
    // The game as it was, for the record to tell a move from a new game and a game put away.
    const before = recorder === null ? null : decode(read());
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
    try {
      recorder?.(before, game);
    } catch {
      /* The history is a convenience: a game is never stopped because its record could not be written. */
    }
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

  /**
   * A game opened from the history (`/games/<slug>/kept/<id>`), made this
   * browser's game under the record it already has, so it is resumed rather
   * than filed again. The game it replaces is not lost: its record is in the
   * history too. False for text these rules cannot play out again.
   */
  function adopt(text: string, id: string): boolean {
    const game = decode(text);
    if (game === null || record === undefined) return false;
    adoptRecord(key, id, record.over(game));
    try {
      window.localStorage.setItem(key, encode(game));
      unkept = undefined;
    } catch {
      unkept = encode(game);
    }
    for (const listener of listeners) listener();
    return true;
  }

  return { keep, useKept, adopt };
}
