import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PuzzleSolvePage } from "@/components/puzzles/PuzzleSolvePage";
import { puzzleFor } from "@/lib/gomoku/slugs";
import { puzzleForAddress } from "@/lib/catalogue/settingAddress";
import { gameCopyOf } from "@/lib/catalogue/gameKeys";
import { currentSpeaker } from "@/lib/i18n/currentLocale";

// Whose solve this is is read from the session on every request.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/games/[slug]/me/[solveId]">): Promise<Metadata> {
  const puzzle = puzzleFor((await params).slug);
  const say = await currentSpeaker();
  return { title: puzzle === null ? say.say("gamepages.titleYourPuzzle") : say.say("gamepages.titleYourPuzzleOf", { game: gameCopyOf(puzzle, say.locale)?.label ?? "" }), robots: { index: false, follow: false } };
}

/** One of the reader's own finished puzzles, at /games/<slug>/me/<id>: see `PuzzleSolvePage`. */
export default async function MySolvePage({ params, searchParams }: PageProps<"/games/[slug]/me/[solveId]">) {
  const { slug, solveId } = await params;
  const puzzle = puzzleForAddress(slug, await searchParams);
  if (puzzle === null) notFound();
  return <PuzzleSolvePage kind={puzzle} solveId={solveId} whose="mine" />;
}
