import { siteKey, type Tab } from "@/lib/ui/tabs";
import type { LegacyPlayer, LegacySource } from "./legacyPlayers.types";

/**
 * One tab per site somebody played on.
 *
 * A person is one row and one page however many sites they played on, and
 * each site is a chapter of them — different handle, different years,
 * different games. Chapters are what tabs are for.
 */
export type LegacyTab = Tab & { legacy: LegacyPlayer; source: LegacySource };

/**
 * This site's own tab, which every player has.
 *
 * Somebody who has never played here still has one, showing what it says:
 * nothing yet. A page whose tabs depend on whether a count is zero is a page
 * that looks like a different kind of page to somebody with no games, and
 * the record of what has happened here is the one section that is always
 * relevant.
 */
export const ITSUTSU_TAB: Tab = { key: "itsutsu", label: "Itsutsu", kanji: "\u4e94" };

/**
 * The tabs for one or more kept records, in the order the sites are listed —
 * oldest chapter first, the way the records themselves are written.
 *
 * Keys are made unique across the whole set, because a live member's page can
 * carry more than one kept record and two of them could name the same site.
 * The first use of a site's name keeps the plain key, so the ordinary address
 * of the ordinary case stays short.
 */
export function legacyTabs(legacies: readonly LegacyPlayer[]): LegacyTab[] {
  const taken = new Set<string>();
  const tabs: LegacyTab[] = [];
  for (const legacy of legacies) {
    for (const source of legacy.sources) {
      const plain = siteKey(source.site);
      let key = plain;
      if (taken.has(key)) key = `${legacy.slug}-${plain}`;
      // Two records of the same person on the same site would be a mistake in
      // the data, not a case to design for, but a duplicate key would silently
      // hide one tab behind the other, so it is counted out rather than left.
      let nth = 2;
      while (taken.has(key)) {
        key = `${legacy.slug}-${plain}-${nth}`;
        nth += 1;
      }
      taken.add(key);
      tabs.push({ key, label: source.site, legacy, source });
    }
  }
  return tabs;
}

/** The tab an address names, or the first one. */
export function tabFor(tabs: readonly LegacyTab[], key: string): LegacyTab | null {
  return tabs.find((tab) => tab.key === key) ?? tabs[0] ?? null;
}
