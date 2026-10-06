import type { JaText } from "./jaText.types";

/**
 * WHERE THE JAPANESE IS KEPT ONCE SOMETHING HAS LOADED IT.
 *
 * One slot, filled once per runtime: in a server build by the loader
 * `jaText.server.ts` registers, which reads the words from their one file the
 * first time somebody asks, and in a browser by `JaLocale`, which registers the
 * words it was handed when it is drawn for a reader of Japanese. A browser that
 * is reading English never fills it, because the words were never sent
 * (`next.config.ts` resolves `jaText.server` to an empty module for the browser).
 *
 * No imports but a type, so that both fillers and `jaText.ts` can use it
 * without any of them importing the other round a circle.
 */
let registered: JaText | null = null;
let loader: (() => JaText) | null = null;

/** How a server build reads the words, run the first time they are asked for and never again. */
export function registerJaTextLoader(load: () => JaText): void {
  loader = load;
}

export function registerJaText(text: JaText): void {
  registered = text;
}

export function registeredJaText(): JaText | null {
  if (registered === null && loader !== null) registered = loader();
  return registered;
}
