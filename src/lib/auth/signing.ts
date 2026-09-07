/**
 * HMAC signing, shared by session cookies and embed tokens.
 *
 * Web Crypto rather than node:crypto, because `proxy.ts` verifies both of
 * these on the Edge runtime where node:crypto does not exist.
 *
 * Everything signed here carries a `kind`, and every caller checks it. Without
 * that check a signed player session would verify as a valid embed token and
 * the other way round, since both are signed with the same key — the signature
 * proves only that we wrote it, never what we meant by it.
 */

export type Signed = {
  kind: string;
  /** Expiry, in seconds since the epoch. */
  exp: number;
  /** Issued at, in seconds since the epoch. */
  iat?: number;
};

/**
 * Returned as a plain ArrayBuffer rather than a Uint8Array: Web Crypto wants a
 * BufferSource, and a typed array whose backing store might be shared does not
 * satisfy that type.
 */
function encode(value: string): ArrayBuffer {
  const bytes = new TextEncoder().encode(value);
  return bytes.buffer.slice(0) as ArrayBuffer;
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
  return bytes.buffer.slice(0) as ArrayBuffer;
}

/**
 * The signing key. No AUTH_SECRET means nothing can be signed or verified,
 * which fails closed: nobody is signed in and no embed token is accepted,
 * rather than everybody sharing a predictable default.
 */
async function signingKey(): Promise<CryptoKey | null> {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret || secret.length < 16) return null;

  return crypto.subtle.importKey(
    "raw",
    encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signPayload<T extends Signed>(payload: T): Promise<string | null> {
  const key = await signingKey();
  if (key === null) return null;

  const body = toBase64Url(new Uint8Array(encode(JSON.stringify(payload))));
  const signature = await crypto.subtle.sign("HMAC", key, encode(body));
  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

/**
 * The payload a token carries, or null for anything missing, altered, signed
 * with a different secret, of the wrong kind, or past its expiry. Every
 * failure returns null, and none of them say which failure it was.
 */
export async function verifyPayload<T extends Signed>(
  token: string | undefined,
  kind: T["kind"],
): Promise<T | null> {
  if (!token) return null;

  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const key = await signingKey();
  if (key === null) return null;

  try {
    // subtle.verify compares in constant time.
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(signature),
      encode(body),
    );
    if (!valid) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(body)),
    ) as T;

    if (payload.kind !== kind) return null;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/** Seconds since the epoch, `days` from now. */
export function expiryInDays(days: number): number {
  return Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;
}

export function nowInSeconds(): number {
  return Math.floor(Date.now() / 1000);
}
