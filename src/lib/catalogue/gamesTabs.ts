import { CATALOGUE_VIEW_DISPLAY, CATALOGUE_VIEW_LIST } from "@/lib/gomoku/catalogueView";
import type { Tab } from "@/lib/ui/tabs";

/**
 * THE GAMES PAGE'S TABS: the three ways of laying out the catalogue, then the
 * learning shelf and the famous games, each a page of its own drawn as a tab.
 *
 * John, 2026-09-25: "My Games and Players pages correctly use Tabs… but Games
 * page uses BUTTONS for Families, Cards and Plain List… they should be Tabs
 * too! Use consistent and simple patterns. Then move the Learning Shelf button
 * to another Tab. And Famous Games." The three views keep `?view=`, which is
 * the key every tab strip reads, so no address changes; /learn and /famous
 * draw this same strip with themselves open.
 */
/*
 * ONE WORD EACH. John, 2026-09-26: "Rename the two word ones to List,
 * Learning and Famous." The pages keep their fuller names in their own
 * headings; a tab is a place to press, and five fit on a phone's line.
 */
export const GAMES_TABS: readonly Tab[] = [
  ...CATALOGUE_VIEW_LIST.map((view) => ({ key: view, label: CATALOGUE_VIEW_DISPLAY[view].label, kanji: CATALOGUE_VIEW_DISPLAY[view].kanji })),
  { key: "learn", label: "Learning", kanji: "学び", href: "/learn" },
  { key: "famous", label: "Famous", kanji: "名局", href: "/famous" },
];
