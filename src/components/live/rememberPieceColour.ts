"use client";

import type { PieceColour } from "@/lib/pieces/pieceColours";

/**
 * Keeps the colour a member just chose as their usual (`pieceColour` in the
 * preferences registry), so the next set-up offers it first. Not awaited and
 * never an error: the colour is already on the game, and forgetting it as the
 * usual costs a click next time, nothing now.
 */
export function rememberPieceColour(colour: PieceColour | null): void {
  void fetch("/api/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ preferences: { pieceColour: colour ?? "none" } }),
  }).catch(() => {});
}
