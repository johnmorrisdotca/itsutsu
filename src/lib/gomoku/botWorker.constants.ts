/**
 * What the browser's computer player is allowed, kept APART from the worker.
 *
 * `botWorker.ts` calls `self.addEventListener` at module scope, because that is
 * what a worker is. Importing any VALUE from it therefore drags the whole module
 * into whatever bundle the importer is in — and on the server there is no
 * `self`, so the page 500s before it ever reaches the browser that would have
 * been fine. That happened: the live match page threw `ReferenceError: self is
 * not defined` on every server render and then recovered on the client, which
 * made it look like an intermittent fault rather than a static import.
 *
 * So the numbers live here and the worker is reached only through
 * `new URL("./botWorker.ts", import.meta.url)`, which is a bundler instruction
 * rather than an import. Types may still come from the worker: `import type` is
 * erased and carries nothing into the bundle.
 */

/**
 * How long a browser move may think.
 *
 * Far past the 250 ms a paid function allows, and deliberately: measured over
 * thirty-six games at 19x19 with no draws, the same grade given two seconds beat
 * itself on the server's budget 78% of the time. That is most of a grade of
 * strength, bought with time nobody is billed for.
 *
 * Still bounded. A player waiting on a board wants an opponent rather than a
 * progress bar, and a runaway loop on somebody's laptop is our bug however free
 * their CPU is.
 */
export const BROWSER_MOVE_MILLIS = 2_000;
