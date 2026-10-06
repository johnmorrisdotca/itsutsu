import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { puzzleFor, variantFor } from "@/lib/gomoku/slugs";
import { puzzleForAddress } from "@/lib/catalogue/settingAddress";
import { gameCopyOf } from "@/lib/catalogue/gameKeys";
import { titleWithKanji } from "@/components/games/pageTitles";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { RecordPage } from "@/components/history/RecordPage";
import { PuzzleRecordPage } from "@/components/puzzles/PuzzleRecordPage";

export async function generateMetadata({ params }: PageProps<"/games/[slug]/history">): Promise<Metadata> {
  const { slug } = await params;
  const puzzle = puzzleFor(slug);
  const say = await currentSpeaker();
  if (puzzle !== null) return { title: `${gameCopyOf(puzzle, say.locale)?.label ?? ""} · ${titleWithKanji(say, "gamepages.titleAllSolves", "棋譜")}` };
  const variant = variantFor(slug);
  const history = titleWithKanji(say, "gamepages.gameHistory", "棋譜");
  return {
    title: variant === null ? history : `${gameCopyOf(variant, say.locale)?.label ?? ""} · ${history}`,
  };
}

/**
 * One game's record, at /games/<slug>/history: every finished game of that
 * kind, by anybody. For a puzzle, every solve of it by anybody — the same
 * facet of the same address, answered by `PuzzleRecordPage`.
 */
export default async function GameRecordPage({ params, searchParams }: PageProps<"/games/[slug]/history">) {
  const { slug } = await params;
  const query = await searchParams;
  const puzzle = puzzleForAddress(slug, query);
  if (puzzle !== null) return <PuzzleRecordPage kind={puzzle} query={query} />;
  const variant = variantFor(slug);
  if (variant === null) notFound();
  return <RecordPage variant={variant} params={await searchParams} />;
}
