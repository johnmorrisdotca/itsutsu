import SCREENS from "./appleLaunch.data.json";

/**
 * The screens an iPhone or iPad can open the home-screen app on, in CSS
 * pixels and the device's pixel ratio, portrait. iOS picks a launch image by
 * matching a media query against the device exactly, so a size missing here
 * is a device that opens on a blank white screen instead.
 *
 * The list is data (`appleLaunch.data.json`) because the script that draws
 * the images is plain node and reads it too. Landscape is left out on
 * purpose: a phone is almost always held upright when an app is opened, and
 * each orientation doubles the tags every page carries in its head.
 */
export type LaunchScreen = { width: number; height: number; ratio: number };

export const APPLE_LAUNCH_SCREENS: readonly LaunchScreen[] = SCREENS;

export const LAUNCH_THEMES = ["light", "dark"] as const;

/** Where one launch image is kept, under `public/`. */
export function launchImagePath(screen: LaunchScreen, theme: (typeof LAUNCH_THEMES)[number]): string {
  return `/brand/app/splash/${theme}-${screen.width * screen.ratio}x${screen.height * screen.ratio}.png`;
}

/**
 * The `startupImage` list for `appleWebApp`: every screen in both themes, so
 * a phone in dark mode opens on the dark paper rather than a white flash.
 */
export function appleStartupImages(): { url: string; media: string }[] {
  return APPLE_LAUNCH_SCREENS.flatMap((screen) =>
    LAUNCH_THEMES.map((theme) => ({
      url: launchImagePath(screen, theme),
      media:
        `(device-width: ${screen.width}px) and (device-height: ${screen.height}px)` +
        ` and (-webkit-device-pixel-ratio: ${screen.ratio}) and (orientation: portrait)` +
        ` and (prefers-color-scheme: ${theme})`,
    })),
  );
}
