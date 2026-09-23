import { expect, test } from "@playwright/test";

/**
 * A live board's poll that finds nothing new is answered "nothing changed".
 *
 * Every fifteen seconds an open board asks for its game, and most asks come
 * back to a game where nobody has moved. The route used to rebuild the whole
 * game — every move, the last thirty remarks, both names — for each one. Now
 * it answers with a tag for the version it holds, and an ask that already has
 * that version is answered 304 with no body. The browser does that part
 * itself; this drives the tag by hand, because the request context here keeps
 * no cache and so shows exactly what the server answers.
 *
 * And the way back, which is the half that matters: a stone or a remark makes
 * the old tag stale, so the next ask gets the new game rather than a 304 over
 * a board that has moved.
 */
test("the game route answers 304 while nothing changes, and the game again once something does", async ({ request }) => {
  const made = await request.post("/api/games/live", { data: { size: 9 } });
  expect(made.status(), await made.text()).toBe(201);
  const game = (await made.json()) as { id: string; blackToken: string };

  const first = await request.get(`/api/games/${game.id}`);
  expect(first.status()).toBe(200);
  const tag = first.headers()["etag"];
  expect(tag).toMatch(/^"g.+"$/);
  expect(first.headers()["cache-control"]).toBe("private, no-cache");

  // Nothing has happened: the same version, answered with no body.
  const unchanged = await request.get(`/api/games/${game.id}`, { headers: { "If-None-Match": tag } });
  expect(unchanged.status()).toBe(304);
  expect(unchanged.headers()["etag"]).toBe(tag);

  // A stone: the old tag no longer matches, and the new game comes back whole.
  const played = await request.post(`/api/games/${game.id}/moves`, { data: { token: game.blackToken, row: 4, col: 4 } });
  expect(played.status(), await played.text()).toBe(201);
  const moved = await request.get(`/api/games/${game.id}`, { headers: { "If-None-Match": tag } });
  expect(moved.status()).toBe(200);
  expect(((await moved.json()) as { moves: unknown[] }).moves).toHaveLength(1);
  const afterMove = moved.headers()["etag"];
  expect(afterMove).not.toBe(tag);

  // A remark lives in its own table and never touches the game row: it must move the tag too.
  const said = await request.post(`/api/games/${game.id}/reactions`, {
    data: { token: game.blackToken, emoji: "👋", moveNumber: 1, text: "hello" },
  });
  expect(said.status(), await said.text()).toBeLessThan(300);
  const remarked = await request.get(`/api/games/${game.id}`, { headers: { "If-None-Match": afterMove } });
  expect(remarked.status()).toBe(200);
  expect(((await remarked.json()) as { reactions: { text: string | null }[] }).reactions.map((r) => r.text)).toContain("hello");
});
