"use client";

import { useState, useSyncExternalStore } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BUTTON_BASE, BUTTON_QUIET, TAP_HEIGHT } from "@/components/ui/ui.constants";
import { keepEveryGame, type KeepProgress } from "@/lib/offline/keepAll";
import { offlineGameAddresses } from "@/lib/offline/offlineGames";
import { canKeep, forgetEverythingKept } from "@/lib/offline/offlineKeeper";

/** What was kept the last time every game was, on this device. */
const KEY = "itsutsu:kept-all";
type Kept = { bytes: number; at: string };

function readKept(): Kept | null {
  try {
    const text = window.localStorage.getItem(KEY);
    return text === null ? null : (JSON.parse(text) as Kept);
  } catch {
    return null;
  }
}

function subscribeKeeper(listener: () => void): () => void {
  if (!canKeep()) return () => {};
  navigator.serviceWorker.addEventListener("controllerchange", listener);
  return () => navigator.serviceWorker.removeEventListener("controllerchange", listener);
}

/** Whether the keeper is running this page: only then is there anywhere to keep anything. Never on the server. */
function useKeeperRunning(): boolean {
  return useSyncExternalStore(
    subscribeKeeper,
    () => canKeep() && navigator.serviceWorker.controller !== null,
    () => false,
  );
}

export function megabytes(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

/**
 * KEEP EVERY GAME OFFLINE, like a region saved in a maps app. John,
 * 2026-09-30: "it helps to allow a user to save offline stuff, like Google
 * Maps did… Curious if that's useful for our itsutsu too. Or if it's
 * automatic." Both: a game is kept on this device the first time it is opened,
 * with nothing to press; this keeps all of them at once, before a flight, with
 * how far it has got and what it came to, and takes them away again.
 *
 * Drawn only where the keeper is running (a production build, a browser that
 * can), since a button that keeps nothing is a promise it cannot keep.
 */
export function KeepAllOffline() {
  const say = useSpeaker();
  const running = useKeeperRunning();
  const [progress, setProgress] = useState<KeepProgress | null>(null);
  const [kept, setKept] = useState<Kept | null | undefined>(undefined);
  if (!running) return null;
  const shown = kept === undefined ? readKept() : kept;

  async function keepAll() {
    const addresses = offlineGameAddresses();
    setProgress({ done: 0, total: addresses.length, bytes: 0 });
    const ended = await keepEveryGame(addresses, setProgress);
    const record: Kept = { bytes: ended.bytes, at: new Date().toISOString() };
    try {
      window.localStorage.setItem(KEY, JSON.stringify(record));
    } catch {
      /* Not remembered: the games are kept all the same. */
    }
    setKept(record);
    setProgress(null);
  }

  async function removeAll() {
    await forgetEverythingKept();
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* Nothing remembered to forget. */
    }
    setKept(null);
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted" data-testid="keep-all-offline">
      {progress !== null ? (
        <span role="status" data-testid="keep-all-progress">
          {say.say("chrome.offline.keeping", { done: say.number(progress.done), total: say.number(progress.total), size: megabytes(progress.bytes) })}
        </span>
      ) : shown !== null ? (
        <>
          <span data-testid="keep-all-done">
            {say.say("chrome.offline.done", { size: megabytes(shown.bytes) })}
          </span>
          <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT}`} onClick={() => void keepAll()}>
            {say.say("chrome.offline.again")}
          </button>
          <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT}`} onClick={() => void removeAll()} data-testid="keep-all-remove">
            {say.say("chrome.offline.remove")}
          </button>
        </>
      ) : (
        <>
          <span>{say.say("chrome.offline.intro")}</span>
          <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT}`} onClick={() => void keepAll()} data-testid="keep-all-button">
            {say.say("chrome.offline.keepAll")}
          </button>
        </>
      )}
    </div>
  );
}
