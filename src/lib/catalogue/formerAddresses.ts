// Relative, not `@/`: `next.config.ts` imports this, and it is read before any alias exists.
import { PUZZLE_SLUGS } from "../gomoku/slugs";
import type { PuzzleKind } from "../puzzles/puzzles.types";
import { GAME_SETTINGS, isSettingKind, settingQuery } from "./gameSettings";

/**
 * THE FOUR GOMOJI ADDRESSES THAT WERE, AND WHERE THEY LEAD NOW.
 *
 * Until 2026-09-28 each Gomoji language and Pop culture had a front door of
 * its own — /games/gomoji-mot, /games/gomoji-wort, /games/gomoji-kana and
 * /games/pop-gomoji — and everything under it. They are one Gomoji now, its
 * language and list in the query (`gameSettings.ts`). This site's rule is no
 * addresses kept for old times' sake; these four are the exception, and the
 * reason is that they were handed to people: a day's word is a link friends
 * send each other to play the same word, and those links were sent in the
 * three days these addresses were live. So each old address leads, for good
 * (308), to the same page under /games/gomoji with its setting added and its
 * own query kept. Nothing on the site links to them (`formerAddresses.test.ts`
 * greps for them), so they are only for what was sent before.
 *
 * Answered by the router before anything renders: no function runs for them.
 */
export type FormerAddress = { source: string; destination: string; permanent: true };

export function formerSettingAddresses(): FormerAddress[] {
  return (Object.keys(GAME_SETTINGS) as PuzzleKind[])
    .filter((kind) => isSettingKind(kind))
    .flatMap((kind) => {
      const from = `/games/${PUZZLE_SLUGS[kind]}`;
      const to = `/games/${PUZZLE_SLUGS[GAME_SETTINGS[kind]!.game]}`;
      const query = settingQuery(kind);
      return [
        { source: from, destination: `${to}?${query}`, permanent: true as const },
        { source: `${from}/:rest*`, destination: `${to}/:rest*?${query}`, permanent: true as const },
      ];
    });
}
