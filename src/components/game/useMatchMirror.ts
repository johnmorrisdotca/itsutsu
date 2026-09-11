"use client";

import { useEffect, useRef, useState } from "react";

import { MOVE_KINDS, VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import type { GameSettings, Move } from "@/lib/gomoku/gomoku.types";
import type { GameDetail, GameMove } from "@/lib/history/gameHistory.types";
import { SHARED_OPENINGS } from "@/lib/history/gameSettingsSchema";
import type { GameSession } from "./game.types";

/** Which match the game in this browser is, remembered across reloads by its seed. */
const KEY = "gomoku.match.v1";

type Remembered = { seed: number; variant: string; id: string };

function rememberedMatch(): Remembered | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw === null ? null : (JSON.parse(raw) as Remembered);
  } catch {
    return null;
  }
}

function remember(entry: Remembered | null): void {
  try {
    if (entry === null) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, JSON.stringify(entry));
  } catch {
    // Forgetting is survivable: the next stone starts a fresh record.
  }
}

/** A move as the API takes it. Keys are ordered so two of the same compare equal as text. */
export type Request = Record<string, unknown>;

function requestFor(
  kind: string,
  row: number,
  col: number,
  stone: string,
  from: { row: number; col: number } | undefined,
  cells: unknown,
  anyColour: boolean,
): Request | null {
  if (kind === MOVE_KINDS.pass) return { pass: true };
  if (kind === MOVE_KINDS.piece) return { cells };
  if (kind === MOVE_KINDS.move) return { row, col, from: { row: from?.row, col: from?.col } };
  if (kind === MOVE_KINDS.place || kind === MOVE_KINDS.skip) {
    return anyColour ? { row, col, stone } : { row, col };
  }
  return null;
}

const same = (a: Request, b: Request) => JSON.stringify(a) === JSON.stringify(b);

/**
 * The request that starts this board as a match on the server, the first
 * time a stone goes down on it.
 *
 * `rated: false`, said outright rather than left to whatever the route
 * defaults an absent field to. A board somebody is only trying out is not a
 * game either side staked a rating on, and two ordinary names typed into the
 * boxes here do not fold together the way a blank or a repeated one does —
 * so leaving this unsaid was how trying out a board reached a real ladder
 * without anyone asking for a rated game.
 */
export function createMatchRequest(
  settings: GameSettings,
  seed: number,
  variant: string,
  opener: string,
  blackName: string,
  whiteName: string,
): Request {
  return {
    hotSeat: true,
    seed,
    size: settings.size,
    variant,
    obstacles: settings.obstacles,
    opening: settings.opening,
    handicap: settings.handicap.stone === null ? undefined : settings.handicap,
    winLength: settings.winLength,
    opener,
    blackName,
    whiteName,
    allowResign: false,
    open: false,
    rated: false,
  };
}

/**
 * Whether a game can be kept as a match at all. A record holds stones; a
 * board that changes size, seats that swap, quarter turns and the swap
 * openings are not stones, so a game using them stays in the browser.
 */
export function keepable(settings: GameSettings): boolean {
  const spec = VARIANT_SPECS[settings.variant];
  return (
    !settings.allowResize &&
    !settings.allowSwap &&
    spec.quadrantSize === null &&
    SHARED_OPENINGS.includes(settings.opening)
  );
}

async function call(url: string, method: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Keeps a game played at one screen as a match on the server, from its first
 * stone.
 *
 * The board here stays the board of record while it is being played — undo,
 * hints, the redo branch all live in the browser — and the server follows it:
 * a stone is appended, a stone taken back is struck out, a new line replaces
 * what came after the branch. The match id gives the game its address, and
 * the seat cookie the server set at creation is its key, so nothing secret is
 * kept in the page. A game the record cannot hold, or one the server refuses,
 * simply goes on without an address.
 */
export function useMatchMirror(
  session: GameSession,
  enabled: boolean,
  /** The match the address named, when the page was opened at one. */
  given: string | null,
): { matchId: string | null; synced: boolean } {
  const { record, state, names } = session;
  const { settings, opener } = state;
  const { seed, variant } = settings;

  /*
   * Which match this game is: the one named, or the one remembered for this
   * seed. A new game has a new seed, so the binding is derived from the key
   * during render and reset when the key changes, with no effect in between.
   */
  const key = `${variant}:${seed}:${given ?? ""}`;
  const [bound, setBound] = useState(() => ({ key, id: enabled ? bindTo(given, seed, variant) : null }));
  if (bound.key !== key) setBound({ key, id: enabled ? bindTo(given, seed, variant) : null });
  /** The record the server has caught up with, by reference. */
  const [syncedTo, setSyncedTo] = useState<Move[] | null>(null);

  const boundKey = useRef<string | null>(null);
  const idRef = useRef<string | null>(null);
  /** What the server holds, in request form; null until read. */
  const server = useRef<Request[] | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const broken = useRef(false);

  useEffect(() => {
    if (!enabled || bound.key !== key) return;
    if (boundKey.current !== key) {
      boundKey.current = key;
      idRef.current = bound.id;
      server.current = null;
      broken.current = false;
    }
    if (broken.current || !keepable(settings)) return;
    const anyColour = VARIANT_SPECS[variant].anyColour;
    const target: Request[] = [];
    for (const move of record) {
      const request = requestFor(move.kind, move.row, move.col, move.stone, move.from, move.cells, anyColour);
      if (request === null) return;
      target.push(request);
    }
    const nameOf = (stone: "black" | "white") => names[state.seats[stone]].trim();

    async function reconcile(): Promise<void> {
      let id = idRef.current;
      if (id === null) {
        if (target.length === 0) return;
        const response = await call(
          "/api/games/live",
          "POST",
          createMatchRequest(settings, seed, variant, opener, nameOf("black"), nameOf("white")),
        );
        if (!response.ok) throw new Error("not kept");
        const created = (await response.json()) as { id: string };
        id = created.id;
        idRef.current = id;
        server.current = [];
        remember({ seed, variant, id });
        setBound({ key, id });
      }
      if (server.current === null) {
        const response = await fetch(`/api/games/${id}`);
        if (!response.ok) throw new Error("not found");
        const detail = (await response.json()) as GameDetail;
        server.current = detail.moves.map((move: GameMove) =>
          requestFor(move.kind, move.row, move.col, move.stone, move.from, move.cells, anyColour) ?? {},
        );
      }
      const have = server.current;
      let common = 0;
      while (common < have.length && common < target.length && same(have[common], target[common])) {
        common += 1;
      }
      if (have.length > common) {
        const response = await call(`/api/games/${id}/moves`, "DELETE", { keep: common });
        if (!response.ok) throw new Error("not taken back");
        server.current = have.slice(0, common);
      }
      for (let i = common; i < target.length; i += 1) {
        const response = await call(`/api/games/${id}/moves`, "POST", target[i]);
        if (!response.ok) throw new Error("not kept");
        server.current.push(target[i]);
      }
      setSyncedTo(record);
    }

    queue.current = queue.current.then(reconcile).catch(() => {
      // The server would not follow: the game goes on here, without an address.
      broken.current = true;
      idRef.current = null;
      remember(null);
      setBound({ key, id: null });
    });
    // Names are read when the match is created; a later change does not re-send moves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key, bound, record, settings, variant, seed, opener]);

  return { matchId: bound.key === key ? bound.id : null, synced: syncedTo === record };
}

/** The match a game with this seed is, if the browser remembers one. */
function bindTo(given: string | null, seed: number, variant: string): string | null {
  if (given !== null) return given;
  const remembered = rememberedMatch();
  return remembered !== null && remembered.seed === seed && remembered.variant === variant
    ? remembered.id
    : null;
}
