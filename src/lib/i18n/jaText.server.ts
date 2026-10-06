import { registerJaTextLoader } from "./jaRegistry";
import { loadJaText } from "./jaText.data";

/**
 * Makes the Japanese loadable in every server build that asks for it.
 *
 * `jaText.ts` imports this for its effect. It registers HOW to read the words,
 * not the words: they are read from `jaText.generated.json.br` the first time a
 * reader of Japanese needs them, so nothing is read for anybody else. A browser
 * build never evaluates this: `next.config.ts` resolves this module to
 * `jaText.browser.ts` there, which is what keeps the Japanese out of the
 * JavaScript an English reader is sent.
 */
registerJaTextLoader(loadJaText);
