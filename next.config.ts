import type { NextConfig } from "next";

import { readLadderFingerprint } from "./src/lib/gomoku/ladderFingerprint";

/**
 * Who may embed the board.
 *
 * Everything but `/embed` refuses framing outright. `/embed` is framable, but
 * only by the origins named in `EMBED_ALLOWED_ORIGINS` (space-separated). An
 * unset variable means "nobody", so a deployment has to opt a host in rather
 * than accidentally shipping a board anyone can wrap in their own page.
 */
const embedAllowList = process.env.EMBED_ALLOWED_ORIGINS?.trim();
const frameAncestors = embedAllowList ? `'self' ${embedAllowList}` : "'self'";

const nextConfig: NextConfig = {
  /*
   * THE SUITE'S RELIEF, HANDED TO THE BROWSER.
   *
   * A live board decides its own cadence in the browser (`pollEvery` in
   * src/components/live/pollCadence.ts), and the browser cannot read the
   * server's environment. So the one knob the end-to-end suite already sets,
   * RATE_LIMIT_RELIEF, is written into the bundle here under a name of its
   * own, and no `.env` needs a new line. It changes nothing in production:
   * `pollEvery` refuses any relief when NODE_ENV is production before it reads
   * this, and its unit test fails if that refusal goes.
   */
  /*
   * THE LADDER'S FINGERPRINT, HASHED ONCE HERE RATHER THAN ON EVERY RENDER.
   *
   * `ladderStrength.data.ts` holds measured round robins between the computer
   * grades, and each row carries a hash of the ten files that decide how a
   * grade plays. A row whose hash is not the running code's says nothing,
   * because a stale strength table is confidently wrong. Working that out
   * means hashing those ten files — which is a fact about the DEPLOYMENT, not
   * about the request, so it is settled here and written into the bundle.
   * Doing it per render would be ten file reads and a SHA-256 for every page
   * view, and Active CPU is billed.
   */
  env: {
    LIVE_POLL_RELIEF: process.env.RATE_LIMIT_RELIEF ?? "",
    LADDER_FINGERPRINT: readLadderFingerprint() ?? "",
  },
  /*
   * The backlog page and the Admin card read CHANGELOG.md at request time, so
   * the release history is whatever the deployed commit actually says. Next
   * only ships the files it can see being imported, and a path read at runtime
   * is not one of those — without this the file is missing in production and
   * the history renders empty.
   */
  /*
   * Every page that reads the changelog at request time has to name it here
   * or it is simply missing from the deployed bundle — the page renders, the
   * read fails, and the history reads as empty in production and nowhere
   * else. See AGENTS.md, Board Gate.
   */
  outputFileTracingIncludes: {
    "/releases": ["./CHANGELOG.md"],
    "/backlog": ["./CHANGELOG.md"],
    "/admin": ["./CHANGELOG.md"],
    /*
     * Keys are picomatch route globs, so a dynamic segment's brackets are
     * escaped, as Next's own docs show for `/api/login/\[\[...slug\]\]`.
     * `changelogTracing.coverage.test.ts` holds every route that can reach
     * the reader to an entry here.
     */
    /*
     * Prisma's query engine is a native binary loaded by a runtime path
     * lookup, not a static import, so Next's tracing misses it and a
     * deployed function silently has no database engine at all.
     */
    "/*": ["./node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**/*"],
  },
  async headers() {
    return [
      {
        source: "/embed",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors ${frameAncestors}`,
          },
        ],
      },
      {
        source: "/((?!embed).*)",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
