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
    // The suite's own production build says so to the browser too (`suiteServer.ts`); never on a Vercel build.
    SUITE_SERVER: process.env.VERCEL === undefined ? (process.env.ITSUTSU_SUITE_SERVER ?? "") : "",
    LADDER_FINGERPRINT: readLadderFingerprint() ?? "",
  },
  /*
   * CHANGELOG.md is NOT named here. /releases and the Admin card read it at
   * request time, and the build's tracer carries it by itself, because
   * `releasesFile.ts` names it in a string the tracer can follow. An include
   * naming it is matched against every folder, not only the root: it packed
   * all 808 CHANGELOG.md files under node_modules (13.9 MB) into both
   * functions, and an exclude cannot take an include back out.
   * `changelogTracing.coverage.test.ts` holds both halves of that.
   */
  outputFileTracingIncludes: {
    /*
     * Prisma's query engine is a native binary loaded by a runtime path
     * lookup, not a static import, so Next's tracing misses it and a
     * deployed function silently has no database engine at all.
     *
     * The ONE engine Vercel runs, and not the folder: the whole folder took every
     * engine in it, the build machine's own among them, and an include wins
     * over `outputFileTracingExcludes` below, so the excludes could not take
     * them back out.
     */
    "/*": [
      "./node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node",
      "./node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/schema.prisma",
    ],
  },
  /*
   * ONLY THE ENGINE THE SITE RUNS ON. The site is Postgres through Prisma's
   * native library engine (`library.js` loading `libquery_engine-*.so.node`),
   * and on Vercel that engine is `rhel-openssl-3.0.x`. The include above took
   * the whole client folder, and the tracer took the runtime folder too: the
   * WebAssembly engines and compilers for five databases, twice over in two
   * module formats, plus the engine for whichever machine did the build
   * (darwin on a Mac, debian on the CI runner). That was 101 MB of every
   * function, all 104 to 127 MB of them, against Vercel's 250 MB limit and the
   * account-wide Functions Storage every project shares. John's rule for every
   * site on the account: include only the runtime's engine. The patterns are
   * UmaKuma's, which made the same cut in 1.547.0.
   *
   * `rhel-openssl-3.0.x` is never excluded: without it every database route
   * answers 500 with an empty body (see `binaryTargets` in schema.prisma).
   * `scripts/check-function-sizes.mjs` in the deploy job holds the result.
   */
  outputFileTracingExcludes: {
    "/**": [
      "node_modules/.pnpm/**/@prisma/client/runtime/*.wasm-base64.*",
      "node_modules/.pnpm/**/@prisma/client/runtime/query_{engine,compiler}_bg.*",
      "node_modules/.pnpm/**/@prisma/client/runtime/{wasm,edge,react-native,index-browser,binary,client}*",
      "node_modules/.pnpm/**/@prisma/client/runtime/*.{map,d.ts,d.mts}",
      "node_modules/.pnpm/**/.prisma/client/libquery_engine-{darwin,debian,linux-musl,windows}*",
      "node_modules/.pnpm/**/.prisma/client/{query_engine_bg.wasm,wasm*,edge.js,index-browser.js,*.d.ts}",
    ],
  },
  /*
   * A Server Function takes up to 2 MB, not the default 1. "Report a problem"
   * sends a screenshot of up to 1 MiB as base64, which is about 1.4 MB, and a
   * reader with no invite can only reach it as a Server Function, because
   * /api is behind the gate. Every Server Function still checks its own input:
   * `submitReport` refuses a picture over 1 MiB before anything is sent on.
   */
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
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
