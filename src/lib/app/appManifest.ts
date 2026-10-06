import type { MetadataRoute } from "next";

import type { Speaker } from "@/lib/i18n/i18n";

import { APP_COLOURS } from "./app.constants";

/**
 * The web app manifest's content, for a reader's language. Pure, so a test can ask it of English and of Japanese
 * and `src/app/manifest.ts` can ask it of whoever is asking (`currentSpeaker`).
 */
export function appManifest(say: Speaker): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Itsutsu 五つ",
    short_name: "Itsutsu",
    description: say.say("chrome.tagline"),
    lang: say.tag,
    dir: "ltr",
    start_url: "/games",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: APP_COLOURS.light,
    theme_color: APP_COLOURS.light,
    categories: ["games", "entertainment"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/app/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/app/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // A long press on the icon. The two places a player goes back to.
    shortcuts: [
      { name: say.say("nav.play"), url: "/play", icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }] },
      { name: say.say("nav.newGame"), url: "/games/new", icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }] },
    ],
  };
}
