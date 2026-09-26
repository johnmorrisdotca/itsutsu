import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { puzzleFor, variantFor } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { PUZZLE_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import { RecordPage } from "@/components/history/RecordPage";
import { PuzzleRecordPage } from "@/components/puzzles/PuzzleRecordPage";

export async function generateMetadata({ params }: PageProps<"/games/[slug]/history">): Promise<Metadata> {
  const { slug } = await params;
  const puzzle = puzzleFor(slug);
  if (puzzle !== null) return { title: `${PUZZLE_DISPLAY[puzzle].label} · Record 棋譜` };
  const variant = variantFor(slug);
  return {
    title: variant === null ? "Record 棋譜" : `${RULE_VARIANT_DISPLAY[variant].label} · Record 棋譜`,
  };
}

/**
 * One game's record, at /games/<slug>/history: every finished game of that
 * kind, by anybody. For a puzzle, every solve of it by anybody — the same
 * facet of the same address, answered by `PuzzleRecordPage`.
 */
export default async function GameRecordPage({ params, searchParams }: PageProps<"/games/[slug]/history">) {
  const { slug } = await params;
  const puzzle = puzzleFor(slug);
  if (puzzle !== null) return <PuzzleRecordPage kind={puzzle} query={await searchParams} />;
  const variant = variantFor(slug);
  if (variant === null) notFound();
  return <RecordPage variant={variant} params={await searchParams} />;
}
