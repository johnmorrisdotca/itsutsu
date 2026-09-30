/**
 * Which way a phone adds a web app to its home screen, or `null` when there
 * is nothing to offer: already opened from the home screen, or not a phone
 * or tablet at all.
 *
 * Pure, so it is tested by value; the component hands it what the browser
 * says. iPadOS reports itself as a Mac, so a "Macintosh" with a touch screen
 * is an iPad. Every browser on iOS adds to the home screen from Share, so the
 * iOS answer does not depend on which one it is.
 */
export type InstallPlatform = "ios" | "android";

export type InstallDevice = {
  userAgent: string;
  maxTouchPoints: number;
  /** `display-mode: standalone`, or Safari's own `navigator.standalone`. */
  standalone: boolean;
};

export function installPlatform(device: InstallDevice): InstallPlatform | null {
  if (device.standalone) return null;
  const ua = device.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Macintosh/.test(ua) && device.maxTouchPoints > 1) return "ios";
  if (/Android/.test(ua)) return "android";
  return null;
}
