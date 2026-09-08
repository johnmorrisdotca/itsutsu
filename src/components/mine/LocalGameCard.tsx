"use client";

import Link from "next/link";
import { useState } from "react";

import { loadSnapshot, type GameSnapshot } from "@/components/game/gameStorage";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { STONE_DISPLAY } from "@/lib/gomoku/gomoku.constants";
import { gamePath } from "@/lib/gomoku/slugs";
import { variantLabel } from "@/lib/gomoku/variants.constants";
import { MY_GAMES_COPY } from "./mine.constants";

/**
 * The game on this device — the hot-seat one, kept in the browser. It has
 * no seat on the server yet, so it is read from local storage, and only
 * shown when there are stones on it. Rendered on the client only (see
 * LocalGameCardClient), so the read happens once, in the initialiser.
 */
export function LocalGameCard() {
  const [snapshot] = useState<GameSnapshot | null>(() => loadSnapshot());
  if (snapshot === null || snapshot.moves.length === 0) return null;

  const toPlay = snapshot.moves.length % 2 === 0 ? snapshot.opener : otherThan(snapshot.opener);
  return (
    <div className={`${PANEL_CLASS} flex flex-wrap items-center gap-3`} data-testid="local-game">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
          {MY_GAMES_COPY.localGame.label}{" "}
          <span className="font-mincho text-[0.8rem] font-normal tracking-normal">{MY_GAMES_COPY.localGame.kanji}</span>
        </span>
        <span className="text-sm font-medium">
          {variantLabel(snapshot.settings.variant)} · {snapshot.settings.size}×{snapshot.settings.size} ·{" "}
          {snapshot.moves.length} moves · {STONE_DISPLAY[toPlay].label} to play
        </span>
      </div>
      <Link href={gamePath(snapshot.settings.variant)} className="text-sm font-semibold underline underline-offset-4">
        {MY_GAMES_COPY.continueGame} →
      </Link>
    </div>
  );
}

function otherThan(stone: "black" | "white"): "black" | "white" {
  return stone === "black" ? "white" : "black";
}
