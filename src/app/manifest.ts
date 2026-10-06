import type { MetadataRoute } from "next";

import { appManifest } from "@/lib/app/appManifest";
import { currentSpeaker } from "@/lib/i18n/currentLocale";

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
 *
 * It is asked in the reader's language, from the request's own cookie or `Accept-Language` (`currentSpeaker`),
 * which makes it a route that runs per request rather than a file built once.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  return appManifest(await currentSpeaker());
}
