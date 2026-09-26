import { connection } from "next/server";

import { currentMemberId } from "@/lib/auth/currentSession";
import {
  dailyDayPath,
  dailyFutagoPlayPath,
  dailyPlayPath,
  dailyYotsugoPlayPath,
  todayFutagoPlayPath,
  todayPlayPath,
  todayYotsugoPlayPath,
} from "@/lib/puzzles/dailyWords/dailyAddress";
import { dayKeyOf } from "@/lib/puzzles/dailyWords/dailyDay";
import { dailyFutagoWordsOf, dailyLengths, dailyWordOf, dailyYotsugoWordsOf, loadDailyPools } from "@/lib/puzzles/dailyWords/dailyPools";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";
import { dailyStatusesOf } from "@/lib/puzzles/server/dailyPlays";

import { DailyWordButtons } from "./DailyWordButtons";

/**
 * Today's buttons as the reader sees them, read at request time: each links
 * straight to today's seed, and a member sees beside each whether they have
 * played it today. Two indexed reads for a member whatever the lengths, none
 * for a stranger. In its own Suspense wherever it is drawn, with
 * `DailyWordButtonsShell` as the fallback, so a prerendered page stays so.
 */
export async function DailyWordButtonsLive({ kind, framed }: { kind: PuzzleKind; framed: boolean }) {
  await connection();
  const today = dayKeyOf(new Date());
  await loadDailyPools(kind);
  const sizes = dailyLengths(kind);
  const words = new Map(sizes.flatMap((size) => {
    const word = dailyWordOf(kind, size, today)?.word;
    return word === undefined ? [] : [[size, word] as const];
  }));
  // Today's Futago at each length, two words from the same pool (`dailyFutagoWordsOf`).
  const pairs = new Map(sizes.flatMap((size) => {
    const pair = dailyFutagoWordsOf(kind, size, today);
    return pair === null ? [] : [[size, pair] as const];
  }));
  // And today's Yotsugo, four words from the same pool (`dailyYotsugoWordsOf`).
  const fours = new Map(sizes.flatMap((size) => {
    const four = dailyYotsugoWordsOf(kind, size, today);
    return four === null ? [] : [[size, four] as const];
  }));
  const memberId = await currentMemberId();
  const statuses = memberId === null ? null : await dailyStatusesOf(memberId, kind, today, words, pairs, fours);
  const notYet = { state: "notYet" as const };
  const rows = sizes.map((size) => ({
    size,
    // Before the first day of the daily words, a length has no word yet and its button asks for today's as it always did.
    href: words.has(size) ? dailyPlayPath(kind, size, today) : todayPlayPath(kind, size),
    status: statuses === null ? null : (statuses.one.get(size) ?? notYet),
    futago: {
      href: pairs.has(size) ? dailyFutagoPlayPath(kind, size, today) : todayFutagoPlayPath(kind, size),
      status: statuses === null ? null : (statuses.two.get(size) ?? notYet),
    },
    yotsugo: {
      href: fours.has(size) ? dailyYotsugoPlayPath(kind, size, today) : todayYotsugoPlayPath(kind, size),
      status: statuses === null ? null : (statuses.four.get(size) ?? notYet),
    },
  }));
  return <DailyWordButtons kind={kind} rows={rows} todayHref={memberId === null ? null : dailyDayPath(kind, today)} framed={framed} />;
}

/** The same buttons with nothing read: the prerendered shell, each asking for today's word when followed. */
export function DailyWordButtonsShell({ kind, framed }: { kind: PuzzleKind; framed: boolean }) {
  const rows = dailyLengths(kind).map((size) => ({
    size,
    href: todayPlayPath(kind, size),
    status: null,
    futago: { href: todayFutagoPlayPath(kind, size), status: null },
    yotsugo: { href: todayYotsugoPlayPath(kind, size), status: null },
  }));
  return <DailyWordButtons kind={kind} rows={rows} todayHref={null} framed={framed} />;
}
