import { existsSync } from "node:fs";

import { expect, test } from "@playwright/test";

import { deleteRemoteSetting, putRemoteSetting, readRemoteSetting, readRemoteSettings } from "../src/lib/site/siteSettingsWire";
import { SUMILABU_PROJECTS, sumilabuTarget } from "../src/lib/sumilabu/sumilabuProject";

/**
 * The one place the suite talks to Sumilabu's settings routes for real.
 *
 * The site's own settings are NOT read there during a run: the suite's server
 * keeps them in its memory (`src/lib/site/siteSettingsBackend.ts`), because
 * twelve shards sharing one `itsutsu-dev` store closed each other's door.
 * What that leaves untested by a browser is the round trip to the service, so
 * it is tested here, from the spec's own process, which is not a server and has
 * no cache.
 *
 * WHY THIS ONE CANNOT RACE. It writes a key of its own, named for this run,
 * which no registry declares and so no site setting, panel or door can ever
 * read (`storedFromRemote` drops a name it does not know), and it removes the
 * key in `finally`. Two shards running it at once write two different keys.
 * That is also why it is allowed to exist at all: the next spec that wants a
 * real `registration` row on Sumilabu will interleave with every other shard,
 * and belongs in the memory store like the rest.
 *
 * DEV PROJECT ONLY. It refuses to write anywhere else, whatever `.env` holds.
 */
test("Sumilabu's settings routes keep, list and forget a key, as the wire expects", async () => {
  if (process.env.SUMILABU_SETTINGS_DEV_TOKEN === undefined && existsSync(".env")) process.loadEnvFile(".env");
  const target = sumilabuTarget("settings");
  expect(target.projectKey, "this spec writes to the rehearsal project only").toBe(SUMILABU_PROJECTS.dev);

  const key = `e2e.roundtrip.${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const by = "operator@example.test";
  try {
    expect(await readRemoteSetting(target, key)).toBeNull();

    const written = await putRemoteSetting(target, key, "first", by);
    expect(written).toMatchObject({ key, value: "first", setBy: by });
    expect(await readRemoteSetting(target, key)).toMatchObject({ key, value: "first", setBy: by });
    expect((await readRemoteSettings(target)).find((one) => one.key === key)?.value).toBe("first");

    // Writing again replaces; it does not add a second row.
    await putRemoteSetting(target, key, "second", by);
    expect((await readRemoteSettings(target)).filter((one) => one.key === key).map((one) => one.value)).toEqual(["second"]);

    expect(await deleteRemoteSetting(target, key, by)).toBe(true);
    expect(await readRemoteSetting(target, key)).toBeNull();
    // Forgetting what is not there is not an error, and says nothing was.
    expect(await deleteRemoteSetting(target, key, by)).toBe(false);
  } finally {
    await deleteRemoteSetting(target, key, by).catch(() => undefined);
  }
});
