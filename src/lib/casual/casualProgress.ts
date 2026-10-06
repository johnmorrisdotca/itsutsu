// Relative, like the rest of lib/casual: the browser specs read these.
import type { CasualKind } from "./casual.types";
import { CASUAL_KIND_LIST, CASUAL_SPECS } from "./casual.constants";

/**
 * WHAT A CASUAL GAME REMEMBERS, kept in the browser it is played in and
 * nowhere else: the levels won, and the level the player was last on. A
 * casual game earns no points and no experience and writes nothing to the
 * server, so this is the whole of its record.
 *
 * Plain data, and tolerant: what is read back is whatever a browser kept,
 * possibly from an older version of the site or edited by hand, so every
 * piece is checked and what cannot be read is dropped, never trusted.
 */
export type CasualProgress = {
  /** The levels won, ascending, each from 1. */
  won: number[];
  /** The level last started and not yet won, or null when the player is between levels. */
  going: number | null;
};

/** Every casual game's progress; a game with none yet has no entry. */
export type CasualSave = Partial<Record<CasualKind, CasualProgress>>;

/** The key it is kept under in `localStorage`. */
export const CASUAL_STORAGE_KEY = "itsutsu.casual.v1";

const isLevel = (value: unknown, levels: number): value is number => Number.isInteger(value) && (value as number) >= 1 && (value as number) <= levels;

/** What was kept, read back: a save, with anything it cannot make sense of left out. */
export function decodeCasual(text: string | null): CasualSave {
  if (text === null) return {};
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return {};
  }
  if (typeof raw !== "object" || raw === null) return {};
  const save: CasualSave = {};
  for (const kind of CASUAL_KIND_LIST) {
    const entry = (raw as Record<string, unknown>)[kind];
    if (typeof entry !== "object" || entry === null) continue;
    const { levels } = CASUAL_SPECS[kind];
    const wonRaw = (entry as { won?: unknown }).won;
    const won = Array.isArray(wonRaw) ? [...new Set(wonRaw.filter((level): level is number => isLevel(level, levels)))].sort((a, b) => a - b) : [];
    const goingRaw = (entry as { going?: unknown }).going;
    const going = isLevel(goingRaw, levels) && !won.includes(goingRaw) ? goingRaw : null;
    if (won.length > 0 || going !== null) save[kind] = { won, going };
  }
  return save;
}

/** A save as text, to keep. */
export function encodeCasual(save: CasualSave): string {
  return JSON.stringify(save);
}

const progressOf = (save: CasualSave, kind: CasualKind): CasualProgress => save[kind] ?? { won: [], going: null };

/** The save after the player starts a level: it is the one they are on, until they win it or start another. */
export function startLevel(save: CasualSave, kind: CasualKind, level: number): CasualSave {
  if (!isLevel(level, CASUAL_SPECS[kind].levels)) return save;
  const was = progressOf(save, kind);
  if (was.won.includes(level) && was.going === null) return save;
  return { ...save, [kind]: { won: was.won, going: was.won.includes(level) ? null : level } };
}

/** The save after a level is won: it joins the levels won, and the player is between levels. */
export function winLevel(save: CasualSave, kind: CasualKind, level: number): CasualSave {
  if (!isLevel(level, CASUAL_SPECS[kind].levels)) return save;
  const was = progressOf(save, kind);
  const won = was.won.includes(level) ? was.won : [...was.won, level].sort((a, b) => a - b);
  return { ...save, [kind]: { won, going: was.going === level ? null : was.going } };
}

/** The save after a level is given up or left: it stays unwon, and is no longer the one in progress. */
export function leaveLevel(save: CasualSave, kind: CasualKind): CasualSave {
  const was = save[kind];
  if (was === undefined || was.going === null) return save;
  return { ...save, [kind]: { won: was.won, going: null } };
}

/** The level a player is on in a game (started, not won), or null. */
export function goingLevel(save: CasualSave, kind: CasualKind): number | null {
  return save[kind]?.going ?? null;
}

/** The levels won in a game. */
export function wonLevels(save: CasualSave, kind: CasualKind): number[] {
  return save[kind]?.won ?? [];
}

/** The level to offer next: the first not yet won, or the last when every one is. */
export function nextLevel(save: CasualSave, kind: CasualKind): number {
  const { levels } = CASUAL_SPECS[kind];
  const won = wonLevels(save, kind);
  for (let level = 1; level <= levels; level += 1) if (!won.includes(level)) return level;
  return levels;
}

/** Whether a game has any progress at all: a level won, or one in progress. */
export function hasProgress(save: CasualSave, kind: CasualKind): boolean {
  const was = save[kind];
  return was !== undefined && (was.won.length > 0 || was.going !== null);
}
