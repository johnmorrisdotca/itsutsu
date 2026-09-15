import type { ComponentProps } from "react";

import type { NamedMember } from "@/lib/auth/members";
import type { Reader } from "@/lib/auth/reader.types";
import type { fetchPlayerRecord } from "@/lib/history/playerRecord";
import type { legaciesForName } from "@/lib/legacy/legacyPlayers.data";
import type { LegacyTab } from "@/lib/legacy/legacyTabs";
import type { wholeRecord } from "@/lib/legacy/wholeRecord";
import type { Tab } from "@/lib/ui/tabs";

import type { ItsutsuRecord } from "./ItsutsuRecord";

/**
 * Everything below a player's header, as the page hands it over.
 *
 * Kept apart from `PlayerChapters.tsx` for AGENTS.md's types rule. The page
 * decides every one of these — who is reading, which tab is open, whether a
 * game may be asked for — and the component draws what it was told.
 */
export type PlayerChaptersProps = {
  /** The page's own address segment, which the tabs and the XP history link from. */
  slug: string;
  /** Every site's record added up, for the panel above the tabs. */
  whole: ReturnType<typeof wholeRecord>;
  /** Whether that panel draws its own figures — not when the header already counts every site. */
  showWholeFigures: boolean;
  /** The name the page is about, decided once in the page. */
  wholeName: string;
  member: NamedMember | null;
  tabs: Tab[];
  open: string;
  /** The tab of a record kept from another site, when that is the one open. */
  shown: LegacyTab | null;
  /** The member whose XP history the XP tab reads, or null where there is no member row. */
  earner: string | null;
  /** Who is reading — by member id, so the XP history can tell a player's own page. */
  reader: Reader;
  asked: Record<string, string | string[] | undefined>;
  record: Awaited<ReturnType<typeof fetchPlayerRecord>>;
  opponents: ComponentProps<typeof ItsutsuRecord>["opponents"];
  gifts: ComponentProps<typeof ItsutsuRecord>["gifts"];
  /** A record somebody is remembered by, when this page is one. */
  keptRecord: ReturnType<typeof legaciesForName>[number] | null;
  /** Whether there is anybody here to ask for a game, decided from the reader's account. */
  askable: boolean;
};
