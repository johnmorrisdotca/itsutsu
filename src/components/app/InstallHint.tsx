"use client";

import { useSyncExternalStore } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";

import {
  dismissInstallHint,
  installHintServerSnapshot,
  installHintSnapshot,
  promptInstall,
  subscribeInstallHint,
} from "./installHint.store";

/**
 * "Add to your home screen", on a phone that has not yet, with that phone's
 * own steps: Share, then Add to Home Screen, on an iPhone or iPad; the
 * browser's install sheet on Android, one press away when Chrome offers it,
 * and its menu when the browser does not.
 *
 * Nothing on the server and nothing on a desk, so the page a desktop reader
 * or a browser test sees is the page as it was. Not shown inside the app, and
 * not again on a phone once waved away.
 */
export function InstallHint() {
  const hydrated = useHydrated();
  const hint = useSyncExternalStore(subscribeInstallHint, installHintSnapshot, installHintServerSnapshot);
  /*
   * A box of its own only to carry the hydration marker, so "no hint on a
   * desk" can be asserted once the browser has answered rather than before.
   * `contents`, so an empty one takes no room and no gap.
   */
  return (
    <div className="contents" data-testid="install-hint-slot" {...readyMark(hydrated)}>
      {hint.platform === null || hint.dismissed ? null : <Hint platform={hint.platform} canPrompt={hint.canPrompt} />}
    </div>
  );
}

function Hint({ platform, canPrompt }: { platform: "ios" | "android"; canPrompt: boolean }) {
  const say = useSpeaker();
  const hint = { platform, canPrompt };

  const steps =
    hint.platform === "ios" ? say.say("install.ios") : hint.canPrompt ? null : say.say("install.android");

  return (
    <aside
      data-testid="install-hint"
      data-platform={hint.platform}
      className="flex flex-col gap-2 rounded-2xl border border-rule bg-ivory px-4 py-3 text-sm"
    >
      <p className="font-medium text-ink">{say.say("install.title")}</p>
      <p className="text-ink-soft">{say.say("install.lead")}</p>
      {steps === null ? null : <p className="text-ink-soft">{steps}</p>}
      <div className="flex flex-wrap gap-2">
        {hint.canPrompt ? (
          <button
            type="button"
            onClick={() => void promptInstall()}
            className={`${BUTTON_BASE} ${BUTTON_STRONG}`}
            data-testid="install-hint-install"
          >
            {say.say("install.button")}
          </button>
        ) : null}
        <button
          type="button"
          onClick={dismissInstallHint}
          className={`${BUTTON_BASE} ${BUTTON_QUIET}`}
          data-testid="install-hint-dismiss"
        >
          {say.say("install.dismiss")}
        </button>
      </div>
    </aside>
  );
}
