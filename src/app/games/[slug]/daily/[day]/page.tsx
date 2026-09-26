import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DailyDayPage } from "@/components/puzzles/DailyDayPage";
import { puzzleFor } from "@/lib/gomoku/slugs";
import { DAILY_WORDS_EPOCH, dayKeyOf, isDayKey } from "@/lib/puzzles/dailyWords/dailyDay";
import { dailyLanguageOf, loadDailyPools } from "@/lib/puzzles/dailyWords/dailyPools";
import { PUZZLE_DISPLAY } from "@/lib/puzzles/puzzles.constants";

// Which day is today is a question for the moment of asking, and the times are read then too.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/games/[slug]/daily/[day]">): Promise<Metadata> {
  const { slug, day } = await params;
  const kind = puzzleFor(slug);
  if (kind === null || dailyLanguageOf(kind) === null) return { title: "Daily words" };
  return { title: `${PUZZLE_DISPLAY[kind].label}, ${day}` };
}

/**
 * /games/<slug>/daily/<day> — one day's words and the fastest at each
 * (`DailyDayPage`). A day before the first daily word, a day to come, or
 * something that is not a date answers 404: a day to come has no page, so no
 * address can be tried to see whether tomorrow's word is out.
 */
export default async function DailyDayRoute({ params }: PageProps<"/games/[slug]/daily/[day]">) {
  const { slug, day } = await params;
  const kind = puzzleFor(slug);
  if (kind === null || dailyLanguageOf(kind) === null) notFound();
  const today = dayKeyOf(new Date());
  if (!isDayKey(day) || day < DAILY_WORDS_EPOCH || day > today) notFound();
  await loadDailyPools(kind);
  return <DailyDayPage kind={kind} day={day} today={today} />;
}
