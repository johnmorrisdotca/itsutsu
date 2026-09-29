import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PuzzleSolvePage } from "@/components/puzzles/PuzzleSolvePage";
import { puzzleFor } from "@/lib/gomoku/slugs";
import { puzzleForAddress } from "@/lib/catalogue/settingAddress";
import { PUZZLE_DISPLAY } from "@/lib/puzzles/puzzles.constants";

// Whose solve this is is read from the session on every request.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/games/[slug]/me/[solveId]">): Promise<Metadata> {
  const puzzle = puzzleFor((await params).slug);
  return { title: puzzle === null ? "Your puzzle" : `Your ${PUZZLE_DISPLAY[puzzle].label}`, robots: { index: false, follow: false } };
}

/** One of the reader's own finished puzzles, at /games/<slug>/me/<id>: see `PuzzleSolvePage`. */
export default async function MySolvePage({ params, searchParams }: PageProps<"/games/[slug]/me/[solveId]">) {
  const { slug, solveId } = await params;
  const puzzle = puzzleForAddress(slug, await searchParams);
  if (puzzle === null) notFound();
  return <PuzzleSolvePage kind={puzzle} solveId={solveId} whose="mine" />;
}
