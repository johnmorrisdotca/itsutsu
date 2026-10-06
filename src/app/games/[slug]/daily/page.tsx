import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DailyArchivePage } from "@/components/puzzles/DailyArchivePage";
import { puzzleFor } from "@/lib/gomoku/slugs";
import { puzzleForAddress } from "@/lib/catalogue/settingAddress";
import { dailyLanguageOf } from "@/lib/puzzles/dailyWords/dailyPools";
import { gameCopyOf } from "@/lib/catalogue/gameKeys";
import { titleWithKanji } from "@/components/games/pageTitles";
import { currentSpeaker } from "@/lib/i18n/currentLocale";

// Which days have passed is a question for the moment of asking, never the build.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/games/[slug]/daily">): Promise<Metadata> {
  const { slug } = await params;
  const kind = puzzleFor(slug);
  const say = await currentSpeaker();
  if (kind === null || dailyLanguageOf(kind) === null) return { title: say.say("gamepages.titleDailyWords") };
  return { title: `${gameCopyOf(kind, say.locale)?.label ?? ""} ${titleWithKanji(say, "gamepages.titleDailyWords", "毎日の言葉")}` };
}

/**
 * /games/<slug>/daily — the past days' words of a word puzzle (`DailyArchivePage`).
 * Only the Gomojis have daily words; every other game and puzzle answers 404.
 */
export default async function DailyWordsPage({ params, searchParams }: PageProps<"/games/[slug]/daily">) {
  const [{ slug }, asked] = await Promise.all([params, searchParams]);
  const kind = puzzleForAddress(slug, asked);
  if (kind === null || dailyLanguageOf(kind) === null) notFound();
  const month = Array.isArray(asked.month) ? asked.month[0] : asked.month;
  return <DailyArchivePage kind={kind} monthAsked={month} />;
}
