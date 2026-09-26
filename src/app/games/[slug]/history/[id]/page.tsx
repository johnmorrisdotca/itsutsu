import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PuzzleSolvePage } from "@/components/puzzles/PuzzleSolvePage";
import { puzzleFor } from "@/lib/gomoku/slugs";
import { PUZZLE_DISPLAY } from "@/lib/puzzles/puzzles.constants";

// Who is reading, and whether they may see this solve, is read on every request.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/games/[slug]/history/[id]">): Promise<Metadata> {
  const puzzle = puzzleFor((await params).slug);
  return { title: puzzle === null ? "A solve" : `A solve of ${PUZZLE_DISPLAY[puzzle].label}`, robots: { index: false, follow: false } };
}

/**
 * One finished puzzle, anybody's, at /games/<slug>/history/<id>: the row of
 * the puzzle's record that a time on any board of solves opens. A game's one
 * match lives at /games/<slug>/match/<id>, so for a game this address is
 * nothing.
 */
export default async function SolveOfRecordPage({ params }: PageProps<"/games/[slug]/history/[id]">) {
  const { slug, id } = await params;
  const puzzle = puzzleFor(slug);
  if (puzzle === null) notFound();
  return <PuzzleSolvePage kind={puzzle} solveId={id} whose="anyone" />;
}
