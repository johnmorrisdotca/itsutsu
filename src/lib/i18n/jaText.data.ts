import type { JaText } from "./jaText.types";
import { JA_COPY_TEXT } from "./jaText.copy.generated.constants";
import { JA_PHRASE_TEXT } from "./jaText.phrases.generated.constants";

/**
 * All the Japanese a reader is shown: the phrase catalogue's and the copy that
 * sits beside data. Imported by `jaText.server.ts` and by `JaLocale`, and by
 * nothing else a browser can reach (`jaText.coverage.test.ts`).
 */
export const JA_TEXT: JaText = { ...JA_COPY_TEXT, phrases: JA_PHRASE_TEXT };
