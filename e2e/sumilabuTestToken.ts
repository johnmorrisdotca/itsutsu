import { test } from "@playwright/test";

/**
 * STEPS ASIDE WHEN SUMILABU REFUSES THE SUITE'S OWN TOKEN.
 *
 * John, 2026-10-30, at a site twenty-three days behind main with critical holes
 * in its framework: "I want to always have new versions deployed." The board's
 * specs need `itsutsu-dev` on Sumilabu, a service with its own settings. When
 * Sumilabu stopped taking that project's token, nine specs failed on a page
 * that was doing the right thing, saying the board could not be read, and every
 * deploy from 2026-10-26 was skipped. A credential of the suite's says nothing
 * about the site, so it does not get to hold a release back.
 *
 * Only a refusal counts, and it says so in the run's summary rather than
 * passing quietly. Anything else, Sumilabu down included, leaves the specs to
 * run and report what they find. The page's handling of an unreadable board is
 * `backlogStore.test.ts`, which needs no token.
 */
export function skipWhenSumilabuRefusesTheToken() {
  test.beforeAll(async () => {
    const base = process.env.SUMILABU_BOARD_URL;
    const token = process.env.SUMILABU_BOARD_DEV_TOKEN;
    if (!base || !token) return;
    const answer = await fetch(`${base}/api/v1/projects/itsutsu-dev/tickets?limit=1`, {
      headers: { authorization: `Bearer ${token}` },
    }).catch(() => null);
    const refused = answer?.status === 401 || answer?.status === 403;
    if (refused) console.log("::warning::Sumilabu refused SUMILABU_BOARD_DEV_TOKEN: the board's specs did not run. Replace the token.");
    test.skip(refused, "Sumilabu refused SUMILABU_BOARD_DEV_TOKEN, which says nothing about the site");
  });
}
