import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { PANEL_CLASS } from "@/components/ui/ui.constants";

import {
  CATALOGUE_LINK_CLASS,
  GAME_CARD_CLASS,
  LIST_ROW_CLASS,
  NAME_KANJI_CLASS,
  STAT_CHIP,
  STAT_LINK,
  STAT_STRIP,
  THUMB_FRAME_CLASS,
} from "./games.constants";

/**
 * THE GAMES PAGES' LONG CLASS LISTS ARE NAMED ONCE, AND THE NAMES ARE REAL.
 *
 * The List and Cards tabs draw a row or a card for every game, and spelling
 * the same forty classes out on each was most of what made them 570 KB and
 * 330 KB (2026-11-02). The constants in `games.constants.ts` now name a
 * utility in globals.css, and a constant whose utility is missing draws
 * nothing: no error, no warning, an unstyled page. So each is held to a
 * definition, and the one utility that repeats `PANEL_CLASS` is held to it.
 */

const CSS = readFileSync("src/app/globals.css", "utf8");

function utilityBody(name: string): string {
  const start = CSS.indexOf(`@utility ${name} {`);
  expect(start, `globals.css has no @utility ${name}`).toBeGreaterThan(-1);
  return CSS.slice(start, CSS.indexOf("}", start));
}

describe("the games pages' named class lists", () => {
  it("each constant is a utility globals.css defines", () => {
    const named = [CATALOGUE_LINK_CLASS, GAME_CARD_CLASS.replace("group/card ", ""), LIST_ROW_CLASS, NAME_KANJI_CLASS, STAT_CHIP, STAT_LINK, STAT_STRIP, THUMB_FRAME_CLASS];
    for (const name of named) expect(utilityBody(name)).toContain("@apply");
  });

  it("the card keeps the group/card class the card-hover variants look for, beside its utility", () => {
    expect(GAME_CARD_CLASS).toBe("group/card game-card");
  });

  it("the card utility repeats the panel's classes, so the two come apart in no one's sight", () => {
    const body = utilityBody("game-card");
    for (const cls of PANEL_CLASS.split(" ")) expect(body).toContain(cls);
  });
});
