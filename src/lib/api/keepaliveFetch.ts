/**
 * A WRITE THAT OUTLIVES THE PAGE THAT MADE IT.
 *
 * The practice board draws "wins in 9 moves" in the browser and posts the winning
 * stone to the server behind it. A player who left in that moment — typed another
 * address, closed the tab — took the request with them: a browser cancels a page's
 * fetches when the page goes, the server never heard the stone, and the game was
 * never filed. Following a link on the page was safe all along, because the page's
 * code keeps running through an in-app navigation; the loss was the page itself
 * going away.
 *
 * `keepalive` hands the request to the browser rather than the page, so one
 * already under way finishes after the page has gone. It is otherwise the same
 * request — same origin, same cookies, so the seat cookie that authorises a move
 * still travels — and it needs no retry, no timer and nothing polled.
 *
 * THE LIMIT. A browser caps what it will carry for pages that have gone at 64KB
 * of bodies queued at once (the Fetch standard's figure, which Chromium, Firefox
 * and Safari all hold to), and a keepalive request over it is refused outright.
 * A move is a few bytes; a whole game filed in one post is a list of every move,
 * and a long one can outgrow the cap. So a body is sent keepalive only while it
 * fits under `KEEPALIVE_MAX_BYTES`, with room left for another write in flight;
 * a larger one goes as an ordinary request, exactly as before, rather than not at
 * all.
 */

/** Under the 64KB the browser allows for all keepalive bodies together, with room for one more in flight. */
export const KEEPALIVE_MAX_BYTES = 48_000;

/** Whether a body this size may be sent keepalive. */
export function fitsKeepalive(body: string): boolean {
  return new TextEncoder().encode(body).byteLength <= KEEPALIVE_MAX_BYTES;
}

/** A JSON write to this site that finishes even if the page goes while it is under way. */
export function keepaliveFetch(url: string, method: string, payload: unknown): Promise<Response> {
  const body = JSON.stringify(payload);
  return fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: fitsKeepalive(body),
  });
}
