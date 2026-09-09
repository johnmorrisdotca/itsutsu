import type { NextConfig } from "next";

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
   * The backlog page and the Admin card read CHANGELOG.md at request time, so
   * the release history is whatever the deployed commit actually says. Next
   * only ships the files it can see being imported, and a path read at runtime
   * is not one of those — without this the file is missing in production and
   * the history renders empty.
   */
  outputFileTracingIncludes: {
    "/backlog": ["./CHANGELOG.md"],
    "/admin": ["./CHANGELOG.md"],
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
