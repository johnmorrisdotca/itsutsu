import { KEPT_FILES_CACHE, KEPT_PAGES_CACHE } from "./offlineKeeper";

/** How far keeping every game has got: pages done of all, and the bytes this device now holds for them. */
export type KeepProgress = { done: number; total: number; bytes: number };

/**
 * The files a page names: its scripts, styles and fonts, in its tags and in
 * the data the router reads (`static/chunks/…` without the leading
 * `/_next/`). Not the ones a script fetches for itself later — a word list
 * loaded when a word puzzle starts is kept the first time it is loaded.
 */
export function filesNamedIn(html: string): string[] {
  const found = new Set<string>();
  for (const match of html.matchAll(/(?:\/_next\/)?static\/(?:chunks|css|media)\/[^"'\\\s)]+/g)) {
    found.add(match[0].startsWith("/_next/") ? match[0] : `/_next/${match[0]}`);
  }
  return [...found];
}

/**
 * KEEP EVERY GAME ON THIS DEVICE, from the page, straight into the keeper's
 * caches (public/sw.js reads them). One page at a time, so the site is asked
 * for one page at once, never a burst; a page already kept is kept as it is
 * and asked for again not at all. What does not answer is left for its first
 * visit, as it would have been.
 */
export async function keepEveryGame(addresses: readonly string[], onProgress: (progress: KeepProgress) => void): Promise<KeepProgress> {
  const pages = await caches.open(KEPT_PAGES_CACHE);
  const files = await caches.open(KEPT_FILES_CACHE);
  const progress: KeepProgress = { done: 0, total: addresses.length, bytes: 0 };
  // A file most pages share is counted once, as it is kept once.
  const counted = new Set<string>();
  for (const address of addresses) {
    const url = new URL(address, window.location.origin).href;
    try {
      let page = await pages.match(url);
      if (page === undefined) {
        const answer = await fetch(url, { credentials: "same-origin" });
        if (answer.ok && !answer.redirected) {
          await pages.put(url, answer.clone());
          page = answer;
        }
      }
      if (page !== undefined) {
        const html = await page.text();
        progress.bytes += html.length;
        for (const file of filesNamedIn(html)) {
          if (counted.has(file)) continue;
          counted.add(file);
          let kept = await files.match(file);
          if (kept === undefined) {
            const answer = await fetch(file);
            if (!answer.ok) continue;
            await files.put(file, answer.clone());
            kept = answer;
          }
          progress.bytes += (await kept.blob()).size;
        }
      }
    } catch {
      /* No answer for this one: it is kept on its first visit instead. */
    }
    progress.done += 1;
    onProgress({ ...progress });
  }
  return progress;
}
