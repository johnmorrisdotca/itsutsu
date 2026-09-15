import { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { isLocalDatabase } from "@/lib/db/localDatabase";
import { SUMILABU_PROJECTS, liveOptIn, sumilabuTarget, targetLine } from "@/lib/sumilabu/sumilabuProject";

import type { StoredSetting } from "./site";
import { copyLines, copyPlan } from "./siteSettingsCopy";
import { readRemoteSettings } from "./siteSettingsWire";

/**
 * What the cut-over copy of `SiteSetting` onto Sumilabu would PUT. REPORT
 * ONLY: it reads both ends and writes to neither.
 *
 *   pnpm site-settings:copy                                     this machine's rows against itsutsu-dev
 *   SUMILABU_PROJECT_KEY=itsutsu pnpm site-settings:copy:prod   production's rows against the live project
 *
 * The copy itself is made once, at the cut-over, by whoever is running it, with
 * this report read first. A runner that could make it would be one more door
 * onto the live project's settings, which decide who may sign up, so this one
 * has no way to write.
 *
 * The rows are read inside a READ ONLY transaction, so the database refuses a
 * write whatever this file becomes. A source that is not this machine is
 * refused unless `site-settings:copy:prod` handed it over, and the live
 * project is compared with production's rows and nothing else.
 *
 * Under vitest because `site.ts` imports without file extensions, which a
 * plain node script cannot resolve. Skipped in `pnpm test:unit` unless
 * SITE_SETTINGS_COPY=1.
 */

const RUN = process.env.SITE_SETTINGS_COPY === "1";

function serverOf(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname}`;
  } catch {
    return "an address this runner could not read";
  }
}

describe.skipIf(!RUN)("the cut-over copy of SiteSetting onto Sumilabu, as a report", () => {
  it("reads both ends and prints what it would PUT, writing nothing", async () => {
    try {
      process.loadEnvFile();
    } catch {
      /* The settings may be in the environment already. */
    }
    const production = process.env.SITE_SETTINGS_SOURCE === "production";
    const url = process.env.DATABASE_URL ?? "";
    if (production && isLocalDatabase(url)) throw new Error(`site-settings:copy:prod was handed ${serverOf(url)}, which is this machine.`);
    if (!production && !isLocalDatabase(url)) {
      throw new Error(`DATABASE_URL names ${serverOf(url)}, which is not this machine. Production is read by pnpm site-settings:copy:prod and nothing else.`);
    }
    const target = sumilabuTarget("settings");
    const live = target.projectKey === SUMILABU_PROJECTS.live;
    if (live && !production) throw new Error("The live project's settings are compared with production's rows and nothing else.");
    console.log(`source: ${production ? "PRODUCTION" : "local"} ${serverOf(url)}, read only`);
    console.log(`target: ${targetLine(target)}${live ? ` — the LIVE project, opted in by ${liveOptIn()}` : ""}\n`);

    const prisma = new PrismaClient({ datasourceUrl: url, log: ["error"] });
    let rows: StoredSetting[];
    try {
      const [, found] = await prisma.$transaction([
        prisma.$executeRaw`SET TRANSACTION READ ONLY`,
        prisma.siteSetting.findMany({ select: { key: true, value: true, updatedAt: true, updatedBy: true } }),
      ]);
      rows = found;
    } finally {
      await prisma.$disconnect();
    }

    const plan = copyPlan(rows, await readRemoteSettings(target));
    console.log(`${rows.length} SiteSetting rows here. The copy would do:`);
    for (const line of copyLines(plan)) console.log(`  ${line}`);
    console.log(`\nReport only: nothing was written to ${targetLine(target)} or to ${serverOf(url)}.`);
    expect(plan.steps.length).toBeGreaterThan(0);
  }, 60_000);
});
