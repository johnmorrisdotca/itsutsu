/**
 * THE BROWSER SUITE'S OWN SERVER, AND NEVER THE LIVE SITE.
 *
 * The suite drives the whole site from one address, so three limits meant for
 * one household are relieved for it: the rate limits that bound a cost
 * (`rateLimit.ts`), a live board's poll (`pollCadence.ts`), and the twenty-game
 * cap for the suite's own operator (`activeGames.ts`). Each used to be refused
 * outright whenever NODE_ENV was production — and `next start` is production,
 * so the suite could only ever run against the dev server, which compiles
 * every page on its first request and renders in React's slower dev mode.
 * Next.js recommends testing the production build; this is what lets it.
 *
 * Relief is allowed outside production, as before, and in production ONLY on
 * a server started with `ITSUTSU_SUITE_SERVER=1` — which `e2e.yml` sets for
 * its throwaway server and nothing else does — and NEVER on Vercel, whatever
 * is set: `VERCEL` is present on every Vercel build and function, so a marker
 * that somehow escaped into the deployment still does nothing there.
 * `suiteServer.test.ts` holds both refusals and fails if `vercel-deploy.yml`
 * ever names the marker.
 */
export const SUITE_SERVER_ENV = "ITSUTSU_SUITE_SERVER";

type Env = Readonly<Record<string, string | undefined>>;

/** Whether this server may relieve a limit for the suite. */
export function reliefAllowed(env: Env = process.env): boolean {
  if (env.NODE_ENV !== "production") return true;
  if (env.VERCEL !== undefined || env.VERCEL_ENV !== undefined) return false;
  return env[SUITE_SERVER_ENV] === "1";
}
