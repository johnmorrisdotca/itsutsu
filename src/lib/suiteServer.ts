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

/**
 * Whether this server keeps the site's settings in its own memory instead of on
 * Sumilabu: only the suite's server, and never anything else.
 *
 * THE SUITE'S SETTINGS ARE ITS OWN. Twelve CI shards, and any developer running
 * the suite, all reached ONE `itsutsu-dev` project on Sumilabu, so one shard's
 * `site-settings.spec.ts` closing the door (or a developer's, on a laptop) was
 * seen by every other server that read the store before it was put back:
 * `control-names.spec.ts` found "not taking new members" where it wanted the
 * invite-code box (0.484.2's deploy, run 36929045514, shard 2). A setting is
 * the one thing the suite changes that every other spec reads, so the store
 * cannot be shared between servers (`siteSettingsBackend.ts` has the design).
 *
 * It takes TWO things, both of them asked for out loud: the suite marker, which
 * `e2e.yml` and `playwright.config.ts` set for the server they start and
 * nothing else does, AND `reliefAllowed`, so a production server that is not
 * the suite's, and anything on Vercel, is refused by the same guard as every
 * other relief. Vercel is named again here because `reliefAllowed` lets any
 * non-production process through, and `vercel dev` is one of those.
 * `pnpm dev` and `pnpm start` without the marker keep reading Sumilabu, as
 * they always did.
 */
export function suiteServerOwnsSettings(env: Env = process.env): boolean {
  if (env.VERCEL !== undefined || env.VERCEL_ENV !== undefined) return false;
  return env[SUITE_SERVER_ENV] === "1" && reliefAllowed(env);
}
