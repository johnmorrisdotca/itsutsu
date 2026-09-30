import type { ResumedRun } from "./solveShared";

/**
 * AN UNFINISHED PUZZLE, KEPT ON THE DEVICE AS WELL AS ON THE ACCOUNT.
 *
 * A run is sent to the account when it is paused or its page is left
 * (`useKeptRun`), and its page opens it again from there. With no connection
 * that send goes nowhere, and a puzzle left on a train was a puzzle lost. So
 * the same run is written here too, in this browser, and a page opening the
 * puzzle takes whichever of the two has been played further. It goes when the
 * puzzle ends, as the account's does.
 *
 * Only what the account would keep is kept, so a visitor's and a race's are
 * not; and only the most recent few, since a device is not an archive.
 */

const KEY = "itsutsu:puzzle-runs";
const MOST = 20;

/** Which puzzle a run is of: everything the account's key names (`runOf`), defaults spelled out. */
export type RunIdentity = {
  kind: string;
  size: number;
  level: string;
  seed: number;
  gameLength?: string;
  language?: string;
  doubleSet?: boolean;
  diagonals?: boolean;
  clock?: string;
};

export function runKey(run: RunIdentity): string {
  return [run.kind, run.size, run.level, run.seed, run.gameLength ?? "short", run.language ?? "english", run.doubleSet === true, run.diagonals === true, run.clock ?? "none"].join("|");
}

type Stored = Record<string, { run: ResumedRun; at: number }>;

function read(): Stored {
  try {
    const text = window.localStorage.getItem(KEY);
    const stored = text === null ? {} : (JSON.parse(text) as unknown);
    return typeof stored === "object" && stored !== null ? (stored as Stored) : {};
  } catch {
    return {};
  }
}

function write(stored: Stored): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(stored));
  } catch {
    /* Storage refused: the account's copy is the only one, as it always was. */
  }
}

/** A run as `useKeptRun` sends it: kept here under its puzzle, newest last, the oldest dropped past the most kept. */
export function keepRunOnDevice(body: RunIdentity & ResumedRun): void {
  const stored = read();
  stored[runKey(body)] = {
    run: { progress: body.progress, elapsedMs: body.elapsedMs, checksUsed: body.checksUsed, hintsUsed: body.hintsUsed, ...(body.steps === undefined ? {} : { steps: body.steps }) },
    // Later than every other, even within one millisecond, so "most recent" is never a tie.
    at: Math.max(Date.now(), ...Object.values(stored).map((entry) => entry.at + 1)),
  };
  const newest = Object.entries(stored).sort(([, a], [, b]) => b.at - a.at).slice(0, MOST);
  write(Object.fromEntries(newest));
}

export function runOnDevice(identity: RunIdentity): ResumedRun | null {
  return read()[runKey(identity)]?.run ?? null;
}

export function forgetRunOnDevice(identity: RunIdentity): void {
  const stored = read();
  const key = runKey(identity);
  if (!(key in stored)) return;
  delete stored[key];
  write(stored);
}

/** Of the account's run and this device's, the one played further; either, when there is only one. */
export function furtherRun(account: ResumedRun | null, device: ResumedRun | null): ResumedRun | null {
  if (account === null) return device;
  if (device === null) return account;
  return device.elapsedMs > account.elapsedMs ? device : account;
}
