import { useEffect, useMemo, useSyncExternalStore } from "react";

import { keepaliveFetch } from "@/lib/api/keepaliveFetch";
import { LOOK_STORAGE } from "@/lib/puzzles/meikyuu/look.constants";
import { choiceFrom, cleanChoice, DEFAULT_CHOICE, resolveLook, sameChoice, type LookChoice, type ResolvedLook } from "@/lib/puzzles/meikyuu/look";

/**
 * THE COLOURS A MEIKYUU BOARD WEARS NOW, held for the page and kept.
 *
 * One store, read by everything that draws a Meikyuu board (the play screen,
 * the finished maze, the set-up's preview, a finished solve's page) and written
 * by the one chooser (`MeikyuuColours`), so a choice made on any of them is on
 * all of them at once.
 *
 * KEPT TWICE. On this device (`localStorage`, every read and write in a
 * try/catch: a private window, blocked storage and the server all come out as
 * the default look and nothing broken) and, for a member, on the account
 * (`meikyuuFrame`, `meikyuuPaper` and `meikyuuInk` in the preferences
 * registry) so the colours follow them to another device. A page that knows the
 * account's choice hands it in (`MeikyuuLookSeed`); the account's wins over the
 * device's, field by field. A page that does not know it (the games chooser's
 * embedded set-up) shows the device's and writes only the device's.
 *
 * AT ITS DEFAULT THE BOARD IS EXACTLY AS IT WAS: the server's snapshot is the
 * default, so nothing a server draws differs by colour, and a stored choice
 * arrives after hydration, never as a mismatch.
 */
let current: LookChoice = DEFAULT_CHOICE;
let loaded = false;
let writesAccount = false;
const listeners = new Set<() => void>();

function tell(): void {
  for (const listener of listeners) listener();
}

/** This device's own choice, read once, in the browser only. */
function loadDevice(): void {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const stored = window.localStorage.getItem(LOOK_STORAGE);
    if (stored !== null) current = choiceFrom(cleanChoice(stored));
  } catch {
    // Storage refused: the default look, and a choice made now lives for the page.
  }
}

function keepOnDevice(choice: LookChoice): void {
  try {
    if (sameChoice(choice, DEFAULT_CHOICE)) window.localStorage.removeItem(LOOK_STORAGE);
    else window.localStorage.setItem(LOOK_STORAGE, JSON.stringify(choice));
  } catch {
    // Not kept on this device; still the page's.
  }
}

function keepOnAccount(preferences: Record<string, string | null>): void {
  if (!writesAccount) return;
  void keepaliveFetch("/api/me", "PATCH", { preferences }).catch(() => undefined);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function snapshot(): LookChoice {
  loadDevice();
  return current;
}

const serverSnapshot = (): LookChoice => DEFAULT_CHOICE;

/** What the account says, laid over what this device says. Called by `MeikyuuLookSeed`, once the page has mounted. */
export function seedLook(account: Partial<LookChoice>, saves: boolean): void {
  loadDevice();
  writesAccount = saves;
  const next = choiceFrom({ ...current, ...account });
  if (sameChoice(next, current)) return;
  current = next;
  keepOnDevice(next);
  tell();
}

/** A choice made: drawn at once, kept on this device, and kept on the account where there is one. */
export function chooseLook(patch: Partial<LookChoice>): void {
  loadDevice();
  const next = { ...current, ...patch };
  if (sameChoice(next, current)) return;
  current = next;
  keepOnDevice(next);
  keepOnAccount({ meikyuuFrame: next.frame, meikyuuPaper: next.paper, meikyuuInk: next.ink });
  tell();
}

/** Back to the board it has always been: the device and the account forget the choice. */
export function resetLook(): void {
  loadDevice();
  if (sameChoice(current, DEFAULT_CHOICE)) return;
  current = DEFAULT_CHOICE;
  keepOnDevice(DEFAULT_CHOICE);
  keepOnAccount({ meikyuuFrame: null, meikyuuPaper: null, meikyuuInk: null });
  tell();
}

/** The colours as the stylesheet reads them (`globals.css`, `--mkl-*`): the package's own custom properties are set from these. */
export function lookVariables(look: ResolvedLook): Record<string, string> {
  return {
    "--mkl-paper": look.paper,
    "--mkl-wall": look.wall,
    "--mkl-ring": look.ring,
    "--mkl-trail": look.trail,
    "--mkl-start": look.start,
    "--mkl-goal": look.goal,
  };
}

/**
 * The look now, and the way to change it. Writes the colours onto the page
 * (`:root`), where the package's drawing and the wallpaper's copy of it both
 * read them, whichever of them is on the screen.
 */
export function useMeikyuuLook(): { choice: LookChoice; look: ResolvedLook; choose: (patch: Partial<LookChoice>) => void; reset: () => void } {
  const choice = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const look = useMemo(() => resolveLook(choice), [choice]);
  useEffect(() => {
    const root = document.documentElement;
    for (const [name, value] of Object.entries(lookVariables(look))) root.style.setProperty(name, value);
  }, [look]);
  return { choice, look, choose: chooseLook, reset: resetLook };
}
