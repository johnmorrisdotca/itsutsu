import type { JaText } from "./jaText.types";

/**
 * WHERE THE JAPANESE IS KEPT ONCE SOMETHING HAS LOADED IT.
 *
 * One slot, filled once per runtime: by `jaText.server.ts` in every server
 * build, which imports the words and registers them as it is evaluated, and by
 * `JaLocale` in a browser, which does the same when it is drawn for a reader of
 * Japanese. A browser that is reading English never fills it, because the words
 * were never sent (`next.config.ts` resolves `jaText.server` to an empty module
 * for the browser).
 *
 * No imports but a type, so that both fillers and `jaText.ts` can use it
 * without any of them importing the other round a circle.
 */
let registered: JaText | null = null;

export function registerJaText(text: JaText): void {
  registered = text;
}

export function registeredJaText(): JaText | null {
  return registered;
}
