"use client";

import { INSTALL_HINT_DISMISSED_KEY } from "@/lib/app/app.constants";
import { installPlatform, type InstallPlatform } from "@/lib/app/installPlatform";

/**
 * What the "add to your home screen" hint knows, as a store React reads with
 * `useSyncExternalStore`: the browser's answer arrives once, after the page
 * has painted, and Chrome's install prompt may arrive later still.
 */

/** Chrome's install prompt, which is not in TypeScript's DOM library. */
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallHintState = {
  platform: InstallPlatform | null;
  /** Chrome has offered its own install prompt, so one press can open it. */
  canPrompt: boolean;
  dismissed: boolean;
};

const NOTHING: InstallHintState = { platform: null, canPrompt: false, dismissed: true };

let state: InstallHintState | null = null;
let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function set(next: Partial<InstallHintState>) {
  state = { ...read(), ...next };
  for (const listener of listeners) listener();
}

function remembered(): boolean {
  try {
    return window.localStorage.getItem(INSTALL_HINT_DISMISSED_KEY) !== null;
  } catch {
    return false;
  }
}

function read(): InstallHintState {
  if (state !== null) return state;
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  state = {
    platform: installPlatform({ userAgent: navigator.userAgent, maxTouchPoints: navigator.maxTouchPoints, standalone }),
    canPrompt: deferred !== null,
    dismissed: remembered(),
  };
  return state;
}

/*
 * Listened for as soon as this module loads, not when the hint mounts: Chrome
 * fires the prompt once, early, and a listener added after it has fired never
 * hears it. Held rather than shown, so the offer is ours to make.
 */
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as InstallPromptEvent;
    set({ canPrompt: true });
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    set({ platform: null, canPrompt: false });
  });
}

export function subscribeInstallHint(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function installHintSnapshot(): InstallHintState {
  return read();
}

export function installHintServerSnapshot(): InstallHintState {
  return NOTHING;
}

/** Chrome's own install sheet. Once used it cannot be shown again. */
export async function promptInstall(): Promise<void> {
  const event = deferred;
  if (event === null) return;
  deferred = null;
  await event.prompt();
  const choice = await event.userChoice;
  set(choice.outcome === "accepted" ? { platform: null, canPrompt: false } : { canPrompt: false });
}

export function dismissInstallHint(): void {
  try {
    window.localStorage.setItem(INSTALL_HINT_DISMISSED_KEY, new Date().toISOString());
  } catch {
    // Private browsing: dismissed for this visit, which is all it can be.
  }
  set({ dismissed: true });
}
