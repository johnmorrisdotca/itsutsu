/**
 * THE BROWSER'S HALF OF PLAYING OFFLINE: the names the keeper (public/sw.js)
 * keeps its pages under, and what a page can ask of it. The keeper is plain
 * JavaScript served as it is, so it cannot import these; `offline.coverage.test.ts`
 * holds its spellings to these ones.
 */

/** Where the keeper keeps the pages it was handed while online. Read by the games list, the offline page and sign-out. */
export const KEPT_PAGES_CACHE = "itsutsu-pages-v1";

/** Where it keeps the files pages are drawn with, and the pictures and icons they show. */
export const KEPT_FILES_CACHE = "itsutsu-files-v1";
export const KEPT_PICTURES_CACHE = "itsutsu-pictures-v1";

/** The keeper's own address, and the page it answers with for one it never kept. */
export const KEEPER_SCRIPT = "/sw.js";
export const OFFLINE_PAGE = "/offline.html";

/** The addresses a game is played at with nothing asked of the site: its practice board or solve, and its table at one device. */
const PLAYED_AT = /^(\/games\/[^/]+)\/(play|pass-and-play)$/;

/**
 * The games this device can open with no connection, from the addresses the
 * keeper holds: each game's own address (`gamePath`), to the address it is
 * played at — the latest kept, with no seed, since a puzzle draws its own.
 * A race is never kept, and an address of anything else is not a game played
 * here.
 */
export function keptGamesFrom(urls: readonly string[]): Map<string, string> {
  const kept = new Map<string, string>();
  for (const href of urls) {
    const url = new URL(href, "https://itsutsu.invalid");
    const found = PLAYED_AT.exec(url.pathname);
    if (found === null || url.searchParams.has("race")) continue;
    url.searchParams.delete("seed");
    // Later addresses were kept later, so the last one read is the one the player last played.
    kept.set(found[1], `${url.pathname}${url.search}`);
  }
  return kept;
}

/** Whether this browser can keep pages at all: a secure page with service workers and Cache Storage. */
export function canKeep(): boolean {
  return typeof window !== "undefined" && window.isSecureContext && "serviceWorker" in navigator && "caches" in window;
}

/** The addresses the keeper holds, oldest first; none where nothing can be kept. */
export async function keptAddresses(): Promise<string[]> {
  if (!canKeep()) return [];
  try {
    const cache = await caches.open(KEPT_PAGES_CACHE);
    return (await cache.keys()).map((request) => request.url);
  } catch {
    return [];
  }
}

/**
 * Signing out: the kept pages were drawn for whoever was signed in, so they go
 * with them. Asked of the keeper, which puts its offline page back, and done
 * here too, in case no keeper is running to be asked.
 */
export async function forgetKeptPages(): Promise<void> {
  if (!canKeep()) return;
  navigator.serviceWorker.controller?.postMessage({ type: "forget-pages" });
  try {
    const cache = await caches.open(KEPT_PAGES_CACHE);
    const keys = await cache.keys();
    await Promise.all(keys.filter((key) => new URL(key.url).pathname !== OFFLINE_PAGE).map((key) => cache.delete(key)));
  } catch {
    /* Nothing kept, or nothing to keep it in: nothing to forget. */
  }
}

/** Everything kept for offline: the pages, and the files and pictures they were drawn with. The pages go through `forgetKeptPages`, which keeps the offline page. */
export async function forgetEverythingKept(): Promise<void> {
  await forgetKeptPages();
  if (!canKeep()) return;
  await Promise.all([caches.delete(KEPT_FILES_CACHE), caches.delete(KEPT_PICTURES_CACHE)]).catch(() => undefined);
}
