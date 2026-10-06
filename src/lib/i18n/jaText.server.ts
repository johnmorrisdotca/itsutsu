import { registerJaText } from "./jaRegistry";
import { JA_TEXT } from "./jaText.data";

/**
 * Loads the Japanese into every server build that asks for it.
 *
 * `jaText.ts` imports this for its effect. A browser build never evaluates it:
 * `next.config.ts` resolves this module to `jaText.browser.ts` there, which is
 * what keeps the Japanese out of the JavaScript an English reader is sent.
 */
registerJaText(JA_TEXT);
