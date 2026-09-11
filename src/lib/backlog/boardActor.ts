import "server-only";

import { constantTimeEqual } from "@/lib/auth/constantTimeEqual";
import { currentAdmin } from "@/lib/auth/requireAdmin";

import { CLAIMED_BY_MAX } from "./backlog.constants";

/**
 * Who is writing to the board, and how they got in: the operator's own
 * browser session, or a terminal holding the board token and naming itself.
 *
 * This is the door ITS-02 builds. Before it, `POST`/`PATCH /api/backlog`
 * checked only `currentAdmin()`, which no agent can hold — an agent cannot
 * open a browser and sign in with Google. That is the reason roughly forty
 * rows were written straight to Postgres on 2026-09-11: not carelessness,
 * an absence. `BOARD_TOKEN` is deliberately its own secret rather than
 * `ADMIN_TOKEN` reused, so it can be rotated on its own and, unlike the
 * admin token, can never open a browser session — it only ever answers to
 * `boardActor`, and only for the two backlog routes.
 */
export type BoardActor = { name: string; via: "session" | "token" };

/**
 * Reads the caller's identity, session first.
 *
 * The session wins outright when present, the same operator the page has
 * always trusted. Otherwise the request needs `Authorization: Bearer
 * <BOARD_TOKEN>` and `X-Board-Actor: <name>` — both, or it is nobody, the
 * same way a wrong password and no password are both just "wrong". An
 * empty or missing `BOARD_TOKEN` shuts the token path entirely rather than
 * comparing against an empty string, which would accept a bearer of
 * nothing. Null reads exactly like a stranger to both routes: 404, never a
 * 401 or 403 that would confirm the board is there at all.
 */
export async function boardActor(request: Request): Promise<BoardActor | null> {
  const me = await currentAdmin();
  if (me !== null) return { name: me.name ?? me.email ?? "operator", via: "session" };

  const expected = process.env.BOARD_TOKEN?.trim() ?? "";
  if (expected.length === 0) return null;

  const auth = request.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  if (token.length === 0 || !constantTimeEqual(expected, token)) return null;

  const name = request.headers.get("X-Board-Actor")?.trim() ?? "";
  if (name.length === 0 || name.length > CLAIMED_BY_MAX) return null;

  return { name, via: "token" };
}
