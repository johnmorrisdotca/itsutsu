/*
 * PLAYING WITH NO CONNECTION. John, 2026-09-30: "Allow the user to play
 * certain games off-line."
 *
 * Most of what is played here never asks the site anything once its page is
 * open: the practice board (both sides, or the computer, which thinks in the
 * browser), every pass-and-play table, the card and party games at one
 * device, and every puzzle solved alone. What stopped them working on a train
 * was only that the PAGE could not be loaded. So this keeps, on the device,
 * the pages that were opened and the files they were drawn with, and hands
 * them back when the network does not answer.
 *
 * Rules, each for a reason:
 *
 * - A PAGE IS ASKED OF THE NETWORK FIRST, every time. The copy kept here is
 *   only ever an answer to "the network did not answer" — never a faster one,
 *   so nobody is shown yesterday's page while online.
 * - A page is kept ON FIRST VISIT, from the answer that was fetched anyway: no
 *   page is ever fetched to be kept, so this costs the site nothing. Only the
 *   pages a game is found and played from are kept (`KEPT_PAGE`); a page of
 *   records or players offline would be an old page passed off as the site.
 * - The files a page is drawn with (`/_next/static/`) are named by their
 *   contents, so a kept one is never wrong: kept on first use, answered from
 *   the device.
 * - `/api/` and every server round trip is never touched. What those answer
 *   is the site's, now, or nothing.
 * - A seed in a puzzle's address is drawn by the page itself (`PuzzlePlay`),
 *   so a puzzle asked for at another seed is answered with the same puzzle's
 *   page without one, and the page reads the seed out of the address.
 * - Signing out empties the kept pages (`forget-pages`), because they were
 *   drawn for whoever was signed in.
 *
 * Nothing registers this outside a production build (`OfflineKeeper`).
 */

const VERSION = "v1";
const PAGES = `itsutsu-pages-${VERSION}`;
const FILES = `itsutsu-files-${VERSION}`;
const PICTURES = `itsutsu-pictures-${VERSION}`;
const KEPT = [PAGES, FILES, PICTURES];

/** The page shown for an address this device has not kept. Static, holding nothing of anybody's. */
const OFFLINE_PAGE = "/offline.html";

/** How many of each are kept, oldest dropped first: room for every game kept at once (`offlineGames.ts`), never the whole site. */
const MOST = { [PAGES]: 200, [FILES]: 2000, [PICTURES]: 300 };

/** How long a page waits on a network that has not answered before a kept copy is offered instead. */
const PATIENCE_MS = 6000;

/**
 * The pages worth keeping: the front page, My games (whose games kept on this
 * device are read from the device, so they are current offline too), the
 * games list in its views, a game's front door, its set-up, its practice board
 * or solve, and its pass-and-play table. And the dice roller, which rolls in
 * the browser and so needs nothing from the site once kept.
 */
const KEPT_PAGE = /^\/(play|dice|games(\/(cards|list|party|new))?|games\/[^/]+(\/(new|play|pass-and-play))?)?$/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => cache.add(new Request(OFFLINE_PAGE, { cache: "reload" })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name.startsWith("itsutsu-") && !KEPT.includes(name)).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "keep") {
    event.waitUntil(keepNow(event.data.page, event.data.files));
    return;
  }
  if (event.data?.type !== "forget-pages") return;
  event.waitUntil(
    caches.delete(PAGES).then(() => caches.open(PAGES).then((cache) => cache.add(new Request(OFFLINE_PAGE, { cache: "reload" })).catch(() => undefined))),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(page(request, url));
    return;
  }
  // A page asked for by the router rather than the browser (a link followed inside the site). Offline it fails,
  // and the router then asks for the address as a page, which is answered above.
  if (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) return;
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(kept(FILES, request));
    return;
  }
  if (/^\/(art|brand)\/|^\/(icon-192\.png|icon-512\.png|icon\.svg|apple-icon\.png|favicon\.ico|manifest\.webmanifest)$/.test(url.pathname)) {
    event.respondWith(fresh(PICTURES, request));
  }
});

/**
 * THE FIRST VISIT. The page that started this keeper was loaded before it was
 * running, so neither the page nor the files it was drawn with passed through
 * it. The page hands over its address and the files it loaded
 * (`OfflineKeeper`), once, and they are kept now: the files mostly from the
 * browser's own cache, and the page with one more ask of the site, the only
 * one this keeper ever makes of its own accord.
 */
async function keepNow(page, files) {
  const pages = await caches.open(PAGES);
  if (typeof page === "string") {
    const url = new URL(page);
    // A puzzle's seed was drawn by its page, and is kept as the page it was drawn on: one that draws, or reads it from the address.
    url.searchParams.delete("seed");
    if (url.origin === self.location.origin && KEPT_PAGE.test(url.pathname) && !url.searchParams.has("race") && !(await pages.match(url.href))) {
      const response = await fetch(url.href, { credentials: "same-origin" }).catch(() => null);
      if (response && response.ok && !response.redirected) await pages.put(url.href, response);
    }
  }
  if (!Array.isArray(files)) return;
  const kept = await caches.open(FILES);
  for (const file of files) {
    if (typeof file !== "string") continue;
    const url = new URL(file);
    if (url.origin !== self.location.origin || !url.pathname.startsWith("/_next/static/") || (await kept.match(url.href))) continue;
    const response = await fetch(url.href).catch(() => null);
    if (response && response.ok) await kept.put(url.href, response);
  }
  await trim(PAGES);
  await trim(FILES);
}

/** A page: the network's answer, kept when it is one worth keeping; the kept copy when the network has none. */
async function page(request, url) {
  const keeps = KEPT_PAGE.test(url.pathname) && !url.searchParams.has("race");
  const network = fetch(request).then((response) => {
    // A redirect (to sign in, to today's puzzle) is an answer about now, and a failure is nobody's page.
    if (keeps && response.ok && response.type === "basic" && !response.redirected) {
      const copy = response.clone();
      void caches.open(PAGES).then((cache) => cache.put(request.url, copy).then(() => trim(PAGES)));
    }
    return response;
  });
  if (!keeps) return network.catch(() => offlinePage());
  // Offered only once the network has been waited on, and only when there is a copy to offer.
  const late = new Promise((resolve) => setTimeout(() => keptPage(url).then((found) => found && resolve(found)), PATIENCE_MS));
  try {
    return await Promise.race([network, late]);
  } catch {
    return (await keptPage(url)) ?? offlinePage();
  }
}

/** This address as kept; failing that, the same address with no seed; failing that, the same page with any query. */
async function keptPage(url) {
  const cache = await caches.open(PAGES);
  const exact = await cache.match(url.href);
  if (exact) return exact;
  if (url.searchParams.has("seed")) {
    const seedless = new URL(url.href);
    seedless.searchParams.delete("seed");
    const found = await cache.match(seedless.href);
    if (found) return found;
  }
  return (await cache.match(url.href, { ignoreSearch: true })) ?? null;
}

async function offlinePage() {
  const found = await caches.match(OFFLINE_PAGE);
  return found ?? new Response("You are offline.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

/** A file named by its contents: the kept copy if there is one, else the network's, kept. */
async function kept(name, request) {
  const cache = await caches.open(name);
  const found = await cache.match(request);
  if (found) return found;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    await cache.put(request, response.clone());
    void trim(name);
  }
  return response;
}

/** A picture or an icon: the network's when it answers, kept; the kept copy when it does not. */
async function fresh(name, request) {
  const cache = await caches.open(name);
  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      await cache.put(request, response.clone());
      void trim(name);
    }
    return response;
  } catch (error) {
    const found = await cache.match(request);
    if (found) return found;
    throw error;
  }
}

/** Oldest first, down to the most kept. The offline page is never dropped. */
async function trim(name) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  const over = keys.length - MOST[name];
  if (over <= 0) return;
  const drop = keys.filter((key) => new URL(key.url).pathname !== OFFLINE_PAGE).slice(0, over);
  await Promise.all(drop.map((key) => cache.delete(key)));
}
