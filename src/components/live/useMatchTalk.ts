"use client";

import { otherStone } from "@/lib/gomoku/engine";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import type { GameDetail, GameReaction } from "@/lib/history/gameHistory.types";
import type { ReactionEmoji } from "@/lib/history/reactions.constants";

/**
 * What is said in a match, and who hears it.
 *
 * A different job from playing the board and from watching the clock: sending
 * a word, and deciding whose words this reader sees at all.
 *
 * The filtering is the part worth keeping together with the sending. Ignoring
 * somebody has to mean ignoring them everywhere or it means nothing — it used
 * to be worked out only for somebody holding a seat, so a member who had
 * ignored a player and then opened that player's game as a SPECTATOR saw
 * everything they said.
 */
export function useMatchTalk({
  detail,
  seat,
  token,
  ignoring,
  quiet,
  mutate,
}: {
  detail: GameDetail;
  seat: Stone | null;
  token: string | null;
  /** Colours whose player this reader has ignored, decided on the server. */
  ignoring: readonly string[];
  /** Whether this one game is muted, which is a thing a watcher cannot do. */
  quiet: boolean;
  mutate: (next?: GameDetail, options?: { revalidate: boolean }) => Promise<unknown>;
}): {
  shown: GameReaction[];
  say: (emoji: ReactionEmoji, moveNumber: number | null, text: string | null) => Promise<void>;
} {
  const silenced = new Set<string>(ignoring);
  if (quiet && seat !== null) silenced.add(otherStone(seat));

  return {
    shown: (detail.reactions ?? []).filter((reaction) => !silenced.has(reaction.stone)),
    say: async (emoji, moveNumber, text) => {
      if (token === null) return;
      const response = await fetch(`/api/games/${detail.id}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, emoji, moveNumber, text }),
      });
      // A word that did not arrive is not worth interrupting a game over; the
      // next poll brings the truth either way.
      if (response.ok) {
        await mutate((await response.json()) as GameDetail, { revalidate: false });
      }
    },
  };
}
