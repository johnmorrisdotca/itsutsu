/**
 * Hashing a four-word phrase, because it is a password.
 *
 * The phrase proves who somebody is on a device where somebody else is signed
 * in, so it gets what a password gets: a slow, memory-hard hash with a salt of
 * its own, and nothing recoverable at rest. The words are never stored, never
 * logged, and never returned by any endpoint.
 *
 * SCRYPT, from node:crypto, and the reason is worth writing down because the
 * ticket said "argon2 or bcrypt". Both of those are native modules, and this
 * deploys to serverless functions where a native build is a thing that can
 * break a deploy for reasons unrelated to anything anybody changed. scrypt is
 * RFC 7914, is memory-hard in the way bcrypt is not, and is in Node already —
 * no dependency, no build step, nothing to go stale. If argon2id ever arrives
 * in node:crypto it is a better default and the stored format below says which
 * algorithm made each hash, so both can be read at once and a rehash-on-verify
 * can be added without a migration.
 *
 * NOT on the Edge runtime. `node:crypto` does not exist there, which is why
 * `proxy.ts` — which runs on Edge — knows nothing about any of this. That is
 * also the right answer for a second reason: the gate's decisions are not this
 * feature's to touch.
 */
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/**
 * The three scrypt parameters, as a stored hash carries them.
 *
 * Numbers rather than the literals `COST` happens to hold, because a hash
 * written under an older cost is read back through this same type and must
 * verify against the numbers IT was made with, not today's.
 */
type Cost = { n: number; r: number; p: number };

/**
 * The cost, stamped into every hash so an old one stays readable when these
 * change.
 *
 * N = 2^14 with r = 8 is 16MB of memory per hash and tens of milliseconds of
 * CPU, which is under Node's 32MB default `maxmem` and comfortable inside a
 * serverless invocation. The entry path is rate limited to five attempts a
 * minute, which is what actually stops guessing online; this is what makes a
 * stolen database expensive to grind through offline.
 */
const COST: Cost = { n: 16384, r: 8, p: 1 };
const KEY_BYTES = 32;
const SALT_BYTES = 16;
const ALGORITHM = "scrypt";

/** How many fields a stored hash has: algorithm, N, r, p, salt, key. */
const FIELDS = 6;

function derive(phrase: string, salt: Buffer, cost: Cost): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      phrase,
      salt,
      KEY_BYTES,
      // maxmem named rather than left to the default, so a cost change that
      // needs more memory fails loudly here instead of at the first sign-in.
      { N: cost.n, r: cost.r, p: cost.p, maxmem: 256 * 1024 * 1024 },
      (error, key) => (error === null ? resolve(key) : reject(error)),
    );
  });
}

/**
 * The stored form of a phrase.
 *
 * Takes the CANONICAL phrase — the sorted, folded, space-joined string that
 * `canonicalPhrase` returns — and never a raw list of words. Both this and
 * `phraseMatches` are given the output of that one function, which is what
 * keeps setting and checking from ever disagreeing about what the same four
 * words mean.
 */
export async function hashPhrase(canonical: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await derive(canonical, salt, COST);
  return [
    ALGORITHM,
    COST.n,
    COST.r,
    COST.p,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

/**
 * Whether this canonical phrase is the one behind a stored hash.
 *
 * False for every failure and never a throw, and — this is the part that is
 * easy to leave out — it does the SAME WORK whether or not there is anything to
 * check against. A member who has never set a phrase would otherwise answer
 * instantly where a member who has takes fifty milliseconds, and that
 * difference tells an attacker which accounts have a phrase set and are worth
 * attacking. So a missing or unreadable hash still derives a key and still
 * compares it, then returns false.
 *
 * An empty attempt is refused outright, and that is not a timing leak: nobody
 * has to guess whether a blank phrase works.
 */
export async function phraseMatches(
  canonical: string,
  stored: string | null | undefined,
): Promise<boolean> {
  if (canonical === "") return false;

  const parsed = readStored(stored);
  const salt = parsed?.salt ?? randomBytes(SALT_BYTES);
  const cost = parsed?.cost ?? COST;
  let key: Buffer;
  try {
    key = await derive(canonical, salt, cost);
  } catch {
    return false;
  }
  if (parsed === null) return false;
  /*
   * Lengths are compared first because timingSafeEqual throws on a mismatch.
   * A different length is a stored hash from a different key size, which is a
   * fact about the row rather than about the guess.
   */
  if (key.length !== parsed.key.length) return false;
  return timingSafeEqual(key, parsed.key);
}

type Stored = { cost: Cost; salt: Buffer; key: Buffer };

/** A stored hash pulled apart, or null when it is not one this can read. */
function readStored(stored: string | null | undefined): Stored | null {
  if (typeof stored !== "string" || stored === "") return null;
  const parts = stored.split("$");
  if (parts.length !== FIELDS || parts[0] !== ALGORITHM) return null;

  const [n, r, p] = [parts[1], parts[2], parts[3]].map((value) => Number(value));
  if (![n, r, p].every((value) => Number.isInteger(value) && value > 0)) return null;

  try {
    const salt = Buffer.from(parts[4], "base64url");
    const key = Buffer.from(parts[5], "base64url");
    if (salt.length === 0 || key.length === 0) return null;
    return { cost: { n, r, p }, salt, key };
  } catch {
    return null;
  }
}
