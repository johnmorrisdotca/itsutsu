import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/prisma";

import { DEFAULT_SITE_SETTINGS } from "./site.constants";
import { siteSettingStates, siteSettingsFrom } from "./site";
import type {
  RegistrationMode,
  SiteSettingKey,
  SiteSettingState,
  SiteSettings,
} from "./site.types";

/**
 * The half that talks to Postgres. Everything it decides is decided in
 * `site.ts`, which is pure; this reads rows, writes rows, and hands them over.
 *
 * A ROW PER KEY, read and written one key at a time, because that is the shape
 * `settings/{key}` GET and PUT have in the shared settings service this is
 * meant to move to. When it does, this file is what changes and nothing that
 * imports it needs to know. UmaKuma's `SiteSetting` table is the same shape
 * already, which is the other reason not to invent a third one.
 *
 * EVERY READ FALLS BACK TO THE DEFAULT RATHER THAN THROWING, and for the one
 * setting that matters the default is the strict answer. A database that cannot
 * be read must not be able to open the door: `invite-only` is both the
 * registry's default and how the site behaved before this table existed, so a
 * failed read, a missing row and a fresh deployment are all the same behaviour.
 * That is deliberately the opposite direction from the maintenance shutter,
 * which fails OPEN — a shutter that cannot measure must not fire, or a
 * hiccup takes the site down; a door that cannot measure must stay shut, or a
 * hiccup lets strangers in. Same principle, opposite safe answer, because the
 * dangerous mistake is the opposite one.
 */

/** Every row. Two settings today, so one query with no `where` is the whole table. */
async function rows() {
  return prisma.siteSetting.findMany({
    select: { key: true, value: true, updatedAt: true, updatedBy: true },
  });
}

/**
 * How the site is set up, deduplicated per render.
 *
 * `cache` so that the door reading the mode and the door reading its own
 * notice are one query rather than two, the way `memberRowFor` does it.
 */
export const fetchSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    return siteSettingsFrom(await rows());
  } catch (error) {
    console.error(error);
    return { ...DEFAULT_SITE_SETTINGS };
  }
});

/**
 * The one question the door asks.
 *
 * Its own function rather than a field read off the object, because it is the
 * only setting with a decision hanging on it and it should be greppable: every
 * caller of this is a place where a stranger either does or does not become a
 * member.
 */
export async function registrationMode(): Promise<RegistrationMode> {
  return (await fetchSiteSettings()).registration;
}

/** Every setting with when it was written and by whom, for the panel. */
export async function fetchSiteSettingStates(): Promise<SiteSettingState[]> {
  try {
    return siteSettingStates(await rows());
  } catch (error) {
    console.error(error);
    return siteSettingStates([]);
  }
}

/**
 * Writes one setting, or forgets it.
 *
 * Null DELETES the row rather than storing the default, so that "nobody has
 * ever said" stays reachable — the state every deployment starts in, and the
 * one a stored default would be indistinguishable from. The board's nullable
 * grades are the same decision: a default written onto a row is a judgement
 * nobody made.
 */
export async function writeSiteSetting(
  key: SiteSettingKey,
  value: string | null,
  by: string,
): Promise<void> {
  if (value === null) {
    // Nothing to forget is not an error; the operator asked for a state the
    // row is already in.
    await prisma.siteSetting.deleteMany({ where: { key } });
    return;
  }
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value, updatedBy: by },
    update: { value, updatedBy: by },
  });
}
