import type { MetadataRoute } from "next";

import { APP_COLOURS } from "@/lib/app/app.constants";

/**
 * The web app manifest, for a phone that adds the site to its home screen.
 * Players arrive by QR code on their phones, so this is the door they use
 * more than a desktop tab. Standalone: a game wants the whole screen.
 *
 * It opens on the games list, and `id` and `scope` are the whole site, so a
 * later change to where it opens is the same installed app rather than a
 * second one. The icons and launch colours are what Android draws its splash
 * from; iOS reads its own tags instead (`appleWebApp` in the root layout).
 * `manifest.test.ts` holds every icon here to a file of the size it claims,
 * on an address the gate lets a stranger's phone fetch.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Itsutsu 五つ",
    short_name: "Itsutsu",
    description: "Five in a row, and the games that grew from it.",
    lang: "en",
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
      { name: "My games", url: "/play", icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }] },
      { name: "New game", url: "/games/new", icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }] },
    ],
  };
}
