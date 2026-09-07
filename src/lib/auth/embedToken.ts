import {
  expiryInDays,
  nowInSeconds,
  signPayload,
  verifyPayload,
  type Signed,
  // Explicit .ts because scripts/mint-embed-token.ts imports this chain and
  // Node resolves it by stripping types, which needs the real filename.
} from "./signing.ts";

/**
 * Tokens that let another site embed the board.
 *
 * Three facts decide the shape of this.
 *
 * A cross-site iframe cannot rely on cookies — browsers block third-party
 * cookies by default — so the token travels in the iframe URL and is checked
 * on every request rather than exchanged for a session.
 *
 * `proxy.ts` verifies it on the Edge runtime, where Prisma cannot run, so the
 * token has to carry its own proof rather than being looked up in a table.
 * That means revocation is by expiry and by epoch, not by deleting a row.
 *
 * And the embed makes no API calls at all — it is a local game — so a leaked
 * token exposes a gomoku board and nothing else. That is what lets this be a
 * URL parameter with a clear conscience.
 */
export type EmbedToken = Signed & {
  kind: "embed";
  /** A note for whoever has to remember what this was issued for. */
  label: string;
};

export const EMBED_TOKEN_KIND = "embed";

/** The query parameter the host puts in the iframe URL. */
export const EMBED_TOKEN_PARAM = "token";

export const DEFAULT_EMBED_TOKEN_DAYS = 365;

export async function signEmbedToken(
  label: string,
  days = DEFAULT_EMBED_TOKEN_DAYS,
): Promise<string | null> {
  return signPayload({
    kind: EMBED_TOKEN_KIND,
    label: label.slice(0, 120),
    exp: expiryInDays(days),
    iat: nowInSeconds(),
  } satisfies EmbedToken);
}

/**
 * The big red button.
 *
 * There is no table to delete from, so EMBED_TOKEN_EPOCH invalidates every
 * token issued before it at once: set it to the current time and every
 * outstanding embed stops working. Individual expiry handles the ordinary
 * case; this handles "that token got out".
 */
function issuedBeforeEpoch(payload: EmbedToken): boolean {
  const epoch = Number(process.env.EMBED_TOKEN_EPOCH ?? 0);
  if (!Number.isFinite(epoch) || epoch <= 0) return false;
  return (payload.iat ?? 0) < epoch;
}

export async function verifyEmbedToken(
  token: string | undefined,
): Promise<EmbedToken | null> {
  const payload = await verifyPayload<EmbedToken>(token, EMBED_TOKEN_KIND);
  if (payload === null) return null;
  if (issuedBeforeEpoch(payload)) return null;
  return payload;
}
