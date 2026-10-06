"use client";

import { useEffect } from "react";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import Link from "@/components/ui/Link";
import { phraseWith } from "@/components/i18n/phraseWith";
import { KEEPER_SCRIPT, canKeep } from "@/lib/offline/offlineKeeper";

import { useOnline } from "./keptGames";

/**
 * PLAYING OFFLINE, ON EVERY PAGE: starts the keeper (public/sw.js) and says so
 * when there is no connection. In the root layout for the same reason the test
 * mode banner is: "every page" is only true of the layout.
 *
 * The keeper runs only in a production build. Under `next dev` a kept page
 * would be answered in place of the one just edited, which is the stale
 * server the repository's notes already warn of, made worse; and never inside
 * the embed, which is another site's page.
 *
 * Offline, the line names what still plays and what does not, with the way to
 * the list that marks the games this device holds (`ReadyOffline`).
 */
export function OfflineKeeper() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !canKeep() || window.location.pathname.startsWith("/embed")) return;
    const start = () => {
      // Loaded before the keeper was running (a first visit): the page and its files are handed to it to keep (`keepNow` in sw.js).
      const firstVisit = navigator.serviceWorker.controller === null;
      void navigator.serviceWorker
        .register(KEEPER_SCRIPT, { scope: "/" })
        .then(() => navigator.serviceWorker.ready)
        .then((ready) => {
          if (!firstVisit) return;
          const files = performance.getEntriesByType("resource").map((entry) => entry.name);
          ready.active?.postMessage({ type: "keep", page: window.location.href, files });
        })
        .catch(() => undefined);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, []);
  const online = useOnline();
  if (online) return null;
  return <OfflineLine />;
}

function OfflineLine() {
  const say = useSpeaker();
  return (
    <div role="status" data-testid="offline-line" className="w-full bg-ink px-4 py-1.5 text-center text-xs font-medium text-paper">
      {phraseWith(say.say("chrome.offline.notice"), {
        link: (
          <Link href="/games" className="underline underline-offset-2">
            {say.say("chrome.offline.gamesList")}
          </Link>
        ),
      })}
    </div>
  );
}
