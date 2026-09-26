import { Paired } from "@/components/i18n/Paired";
import { ViewTabs } from "@/components/ui/ViewTabs";
import { DIRECTORY_WHO, DIRECTORY_WHO_LIST, type DirectoryWho } from "@/lib/rating/directoryFilter";

/**
 * Everyone 全員 · People 人 · Computers 機械: the one set of tabs for the one
 * three-way question the site asks about players — on the members list, on
 * the XP board and on the level pages. The tabs are LINKS, so a choice is an
 * address a reader can share and the page renders it on the server; which
 * address each leads to is the page's own decision (`hrefFor`), since the
 * members list carries two other switches beside these and the board carries
 * a sort. Test ids `who-<who>` on every page, so a spec drives them one way.
 */
export const WHO_DISPLAY: Record<DirectoryWho, { label: string; kanji: string }> = {
  [DIRECTORY_WHO.people]: { label: "People", kanji: "人" },
  [DIRECTORY_WHO.computers]: { label: "Computers", kanji: "機械" },
  [DIRECTORY_WHO.everyone]: { label: "Everyone", kanji: "全員" },
};

export const FILTER_CHIP =
  "rounded-md border px-2.5 py-1 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-moss";
export const FILTER_CHIP_OFF = "border-rule bg-ivory/70 hover:border-rule-strong";

export function WhoFilter({
  who,
  hrefFor,
  label = "Which players to list",
}: {
  who: DirectoryWho;
  hrefFor: (who: DirectoryWho) => string;
  label?: string;
}) {
  // Tabs, as every choice of what a page lists is (`ViewTabs`).
  return (
    <ViewTabs
      label={label}
      testId="who-filter"
      items={DIRECTORY_WHO_LIST.map((one) => ({
        key: one,
        href: hrefFor(one),
        current: who === one,
        testId: `who-${one}`,
        label: <Paired en={WHO_DISPLAY[one].label} kanji={WHO_DISPLAY[one].kanji} kanjiClassName="opacity-70" />,
      }))}
    />
  );
}
