// Relative, like the rest of lib/houseki: the browser specs read these.
import { HOUSEKI_CAMPAIGN_LIST, HOUSEKI_KIND_LIST, HOUSEKI_SPECS, levelsIn } from "./houseki.constants";
import { housekiRequestKey } from "./housekiAddress";
import type { HousekiCampaign, HousekiKind, HousekiRequest } from "./houseki.types";

/**
 * WHAT A HOUSEKI GAME REMEMBERS ON THE DEVICE: the levels won in each campaign,
 * the Dailies finished, and the games left half way, which are kept until each
 * is finished and wait in My games, the most recent first. A won level is also written to the
 * server (once, and only if the server's replay agrees), and that is what pays
 * points; this is what a screen shows without asking, and what a player who is
 * offline still has.
 *
 * Plain data, and tolerant: what is read back is whatever a browser kept,
 * possibly from an older version of the site or edited by hand, so every piece
 * is checked and what cannot be read is dropped, never trusted. A run's save is
 * the package's own text (`encodeGame`), and it is only ever opened by the
 * package, which refuses what it did not write.
 */
export type HousekiRun = {
  /** What was asked for (a level, a lesson, the Daily or a free game): the key of it names which board the save is of. */
  request: HousekiRequest;
  /** The package's save of the game as it stood, `encodeGame`'s text. */
  save: string;
  /** When it was kept, in milliseconds since 1970: the one a person left most recently is the one offered. */
  at: number;
};

export type HousekiProgress = {
  /** The levels won in each campaign, ascending, each from 1. */
  won: Partial<Record<HousekiCampaign, number[]>>;
  /** The days (YYYY-MM-DD, UTC) whose Daily was finished, newest last, the last thirty kept. */
  dailies: string[];
  /** The games left half way, one for each thing asked for (`housekiRequestKey`), the most recently kept first, and no more than `HOUSEKI_RUNS_MOST` of them. */
  runs: HousekiRun[];
};

/** Every game's progress; a game with none yet has no entry. */
export type HousekiSave = Partial<Record<HousekiKind, HousekiProgress>>;

/** The key it is kept under in `localStorage`. */
export const HOUSEKI_STORAGE_KEY = "itsutsu.houseki.v1";

/** How many unfinished games are kept for one game: the one that has waited longest makes way for a new one. */
export const HOUSEKI_RUNS_MOST = 8;

/** The most a kept save may be: a run is a list of moves and a long free game is many, and a browser's storage is small. */
export const HOUSEKI_RUN_MOST = 400_000;

const DAYS_KEPT = 30;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

const isLevel = (value: unknown, levels: number): value is number => Number.isInteger(value) && (value as number) >= 1 && (value as number) <= levels;

/** A request read back from what a browser kept, or null for anything this game does not offer. */
export function requestFrom(kind: HousekiKind, raw: unknown): HousekiRequest | null {
  if (typeof raw !== "object" || raw === null) return null;
  const spec = HOUSEKI_SPECS[kind];
  const entry = raw as Record<string, unknown>;
  if (entry.kind === "daily") return spec.daily ? { kind: "daily" } : null;
  if (entry.kind === "lesson") return isLevel(entry.number, spec.lessons) ? { kind: "lesson", number: entry.number as number } : null;
  if (entry.kind === "level") {
    const campaign = HOUSEKI_CAMPAIGN_LIST.find((each) => each === entry.campaign);
    return campaign !== undefined && isLevel(entry.number, levelsIn(kind, campaign)) ? { kind: "level", campaign, number: entry.number as number } : null;
  }
  if (entry.kind === "free") {
    const size = spec.sizes.find((each) => each.id === entry.size);
    const colours = spec.colours.find((each) => each === entry.colours);
    return size !== undefined && colours !== undefined ? { kind: "free", size: size.id, colours, arcade: spec.arcade && entry.arcade === true } : null;
  }
  return null;
}

/** What was kept, read back: a save, with anything it cannot make sense of left out. */
export function decodeHouseki(text: string | null): HousekiSave {
  if (text === null) return {};
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return {};
  }
  if (typeof raw !== "object" || raw === null) return {};
  const save: HousekiSave = {};
  for (const kind of HOUSEKI_KIND_LIST) {
    const entry = (raw as Record<string, unknown>)[kind];
    if (typeof entry !== "object" || entry === null) continue;
    const own = entry as { won?: unknown; dailies?: unknown; runs?: unknown };
    const won: HousekiProgress["won"] = {};
    for (const campaign of HOUSEKI_CAMPAIGN_LIST) {
      const levels = levelsIn(kind, campaign);
      const list = (own.won as Record<string, unknown> | undefined)?.[campaign];
      if (levels > 0 && Array.isArray(list)) {
        const clean = [...new Set(list.filter((level): level is number => isLevel(level, levels)))].sort((a, b) => a - b);
        if (clean.length > 0) won[campaign] = clean;
      }
    }
    const dailies = Array.isArray(own.dailies) && HOUSEKI_SPECS[kind].daily ? [...new Set(own.dailies.filter((day): day is string => typeof day === "string" && DAY.test(day)))].sort().slice(-DAYS_KEPT) : [];
    const runs: HousekiRun[] = [];
    for (const item of Array.isArray(own.runs) ? own.runs : []) {
      if (typeof item !== "object" || item === null) continue;
      const kept = item as { request?: unknown; save?: unknown; at?: unknown };
      const request = requestFrom(kind, kept.request);
      if (request !== null && typeof kept.save === "string" && kept.save.length > 0 && kept.save.length <= HOUSEKI_RUN_MOST && typeof kept.at === "number" && Number.isFinite(kept.at)) {
        if (!runs.some((each) => housekiRequestKey(each.request) === housekiRequestKey(request))) runs.push({ request, save: kept.save, at: kept.at });
      }
    }
    runs.sort((a, b) => b.at - a.at);
    if (Object.keys(won).length > 0 || dailies.length > 0 || runs.length > 0) save[kind] = { won, dailies, runs: runs.slice(0, HOUSEKI_RUNS_MOST) };
  }
  return save;
}

/** A save as text, to keep. */
export function encodeHouseki(save: HousekiSave): string {
  return JSON.stringify(save);
}

const progressOf = (save: HousekiSave, kind: HousekiKind): HousekiProgress => save[kind] ?? { won: {}, dailies: [], runs: [] };

/** The save after a game is put down half way: it is the most recent kept for this game, and replaces any kept for the same thing before. */
export function keepRun(save: HousekiSave, kind: HousekiKind, run: HousekiRun): HousekiSave {
  if (run.save.length > HOUSEKI_RUN_MOST) return save;
  const was = progressOf(save, kind);
  const key = housekiRequestKey(run.request);
  const runs = [run, ...was.runs.filter((each) => housekiRequestKey(each.request) !== key)].slice(0, HOUSEKI_RUNS_MOST);
  return { ...save, [kind]: { ...was, runs } };
}

/** The save after one kept game is finished, given up or started over: nothing is waiting for it any more. */
export function dropRun(save: HousekiSave, kind: HousekiKind, request: HousekiRequest): HousekiSave {
  const was = save[kind];
  const key = housekiRequestKey(request);
  if (was === undefined || !was.runs.some((each) => housekiRequestKey(each.request) === key)) return save;
  return { ...save, [kind]: { ...was, runs: was.runs.filter((each) => housekiRequestKey(each.request) !== key) } };
}

/** The save after a request is won: a level joins those won, a Daily the days finished, and the run kept for it is done with. */
export function winRequest(save: HousekiSave, kind: HousekiKind, request: HousekiRequest, today: string): HousekiSave {
  const was = progressOf(save, kind);
  const key = housekiRequestKey(request);
  const runs = was.runs.filter((each) => housekiRequestKey(each.request) !== key);
  if (request.kind === "level") {
    const list = was.won[request.campaign] ?? [];
    const won = list.includes(request.number) ? list : [...list, request.number].sort((a, b) => a - b);
    return { ...save, [kind]: { ...was, won: { ...was.won, [request.campaign]: won }, runs } };
  }
  if (request.kind === "daily") {
    const dailies = was.dailies.includes(today) ? was.dailies : [...was.dailies, today].sort().slice(-DAYS_KEPT);
    return { ...save, [kind]: { ...was, dailies, runs } };
  }
  return { ...save, [kind]: { ...was, runs } };
}

/** The levels won in a campaign. */
export function wonLevels(save: HousekiSave, kind: HousekiKind, campaign: HousekiCampaign): number[] {
  return save[kind]?.won[campaign] ?? [];
}

/** How many levels a game has had won, over all its campaigns. */
export function wonCount(save: HousekiSave, kind: HousekiKind): number {
  return HOUSEKI_CAMPAIGN_LIST.reduce((total, campaign) => total + wonLevels(save, kind, campaign).length, 0);
}

/** The level to offer next in a campaign: the first not yet won, or the last when every one is. */
export function nextLevel(save: HousekiSave, kind: HousekiKind, campaign: HousekiCampaign): number {
  const levels = levelsIn(kind, campaign);
  const won = wonLevels(save, kind, campaign);
  for (let level = 1; level <= levels; level += 1) if (!won.includes(level)) return level;
  return Math.max(1, levels);
}

/** The game kept for this thing asked for, or null. */
export function runFor(save: HousekiSave, kind: HousekiKind, request: HousekiRequest): HousekiRun | null {
  const key = housekiRequestKey(request);
  return save[kind]?.runs.find((each) => housekiRequestKey(each.request) === key) ?? null;
}

/** The game put down most recently, which is the one Continue leads to, or null. */
export function latestRun(save: HousekiSave, kind: HousekiKind): HousekiRun | null {
  return save[kind]?.runs[0] ?? null;
}

/** Whether the Daily of a day has been finished in a game. */
export function dailyDone(save: HousekiSave, kind: HousekiKind, today: string): boolean {
  return save[kind]?.dailies.includes(today) ?? false;
}

/** Whether a game has anything at all kept: a level won, a Daily finished, or a game waiting. */
export function hasProgress(save: HousekiSave, kind: HousekiKind): boolean {
  const was = save[kind];
  return was !== undefined && (was.runs.length > 0 || was.dailies.length > 0 || wonCount(save, kind) > 0);
}
