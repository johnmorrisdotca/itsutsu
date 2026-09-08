/**
 * Signed session cookies.
 *
 * A session is not a lookup into a users table — it is a small signed
 * statement the server made about this browser: "this one redeemed an
 * invite", "this one is the member with this address", or "this one is the
 * operator". Signing is what makes it unforgeable; nothing secret is stored
 * inside it.
 *
 * Web Crypto rather than node:crypto, because the middleware that reads these
 * runs on the Edge runtime where node:crypto does not exist.
 */

export type SessionKind = "admin" | "player";

export type Session = {
  kind: SessionKind;
  /**
   * The signed-in address. Set for an operator (matched against the
   * ADMIN_EMAILS allowlist) and for a member who came in through Google;
   * absent for a browser that only redeemed an invite code.
   */
  email?: string;
  /** What Google calls them, for the header and for a seat's default name. */
  name?: string;
  picture?: string;
  /** The invite that let this browser in, so a revoked code can be traced. */
  code?: string;
  /** Expiry, in seconds since the epoch. */
  exp: number;
};

export const SESSION_COOKIE = "gomoku_session";

/** A player's pass lasts a month; the operator's a day. */
export const PLAYER_SESSION_DAYS = 30;
export const ADMIN_SESSION_DAYS = 1;

function encoder(): TextEncoder {
  return new TextEncoder();
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): ArrayBuffer {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  // Returned as a plain ArrayBuffer: Web Crypto wants a BufferSource, and a
  // typed array over a SharedArrayBuffer does not satisfy that type.
  return bytes.buffer.slice(0) as ArrayBuffer;
}

/**
 * The signing key. A deployment with no AUTH_SECRET cannot mint or verify a
 * session at all, which fails closed: no secret means nobody is signed in,
 * rather than everybody sharing a predictable default.
 */
async function signingKey(): Promise<CryptoKey | null> {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret || secret.length < 16) return null;

  return crypto.subtle.importKey(
    "raw",
    encoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signSession(session: Session): Promise<string | null> {
  const key = await signingKey();
  if (key === null) return null;

  const payload = toBase64Url(encoder().encode(JSON.stringify(session)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder().encode(payload),
  );
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

/**
 * The session a cookie carries, or null for anything that is missing, altered,
 * signed with a different secret, or past its expiry. Every failure returns
 * null rather than throwing, and none of them say which failure it was.
 */
export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const key = await signingKey();
  if (key === null) return null;

  let valid: boolean;
  try {
    // subtle.verify compares in constant time.
    valid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(signature),
      encoder().encode(payload),
    );
  } catch {
    return null;
  }
  if (!valid) return null;

  try {
    const session = JSON.parse(
      new TextDecoder().decode(fromBase64Url(payload)),
    ) as Session;
    if (typeof session.exp !== "number" || session.exp * 1000 < Date.now()) {
      return null;
    }
    if (session.kind !== "admin" && session.kind !== "player") return null;
    return session;
  } catch {
    return null;
  }
}

/** Seconds since the epoch, `days` from now. */
export function expiryInDays(days: number): number {
  return Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;
}

/** The cookie options every session cookie uses. */
export function sessionCookieOptions(days: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: days * 24 * 60 * 60,
  };
}
