import { readFileSync } from "node:fs";
import { join } from "node:path";

import { unpackText } from "@/lib/packed/pack";
import type { JaText } from "./jaText.types";

/**
 * All the Japanese a reader is shown: the phrase catalogue's and the copy that
 * sits beside data, READ FROM ONE FILE rather than imported.
 *
 * `jaText.generated.json.br` is made by `pnpm i18n:text` and is the sentences and
 * nothing else, as JSON packed with Brotli (`packed/pack.ts`): 0.10 MB where the
 * text is 0.47, which is what the function carries. It is read off disk, never `import`ed, because an import is
 * compiled into the build's chunks and the build makes a copy of a chunk for
 * each layer of the render (the server components and the client components
 * drawn on the server) and for each route handler's bundle: 0.5 MB of Japanese
 * four times over in the function that carries the API. A file read is one copy
 * on disk, whatever reads it, and the build's tracer ships it because the path
 * below is a string it can follow, so keep it literal
 * (`serverFileTracing.test.ts`; `pageFunction.coverage.test.ts` holds that no
 * page or route imports the Japanese).
 *
 * Read when a reader of Japanese first asks (`jaText.server.ts` registers this
 * as a loader, not as the words), so an English reader's request never opens it,
 * and once for the life of the process. Imported by `jaText.server.ts` and by
 * nothing else a browser can reach (`jaText.coverage.test.ts`).
 */
export function loadJaText(): JaText {
  const file = unpackText(readFileSync(join(process.cwd(), "src/lib/i18n", "jaText.generated.json.br")));
  const { phrases, copy } = JSON.parse(file) as { phrases: JaText["phrases"]; copy: Omit<JaText, "phrases"> };
  return { ...copy, phrases };
}
