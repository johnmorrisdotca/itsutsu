import { EmbedGame } from "@/components/game/EmbedGame";
import { readStoneSet, readTheme } from "@/components/game/embed";
import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { EmbedStats } from "@/components/embed/EmbedStats";
import {
  BOARD_SIZES,
  DEFAULT_BOARD_SIZE,
  OBSTACLE_LAYOUTS,
  OPENING_RULES,
  RULE_VARIANTS,
} from "@/lib/gomoku/gomoku.constants";
import type {
  ObstacleLayout,
  OpeningRule,
  RuleVariant,
} from "@/lib/gomoku/gomoku.types";

export const metadata = {
  title: "Gomoku",
  // An embedded board should never turn up as a search result of its own.
  robots: { index: false, follow: false },
};

function one(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function readSize(value: string | undefined): number {
  const size = Number(value);
  return (BOARD_SIZES as readonly number[]).includes(size)
    ? size
    : DEFAULT_BOARD_SIZE;
}

/**
 * The embeddable board.
 *
 * Configured entirely through the query string, so a host embeds it with a
 * plain `<iframe src="…/embed?size=9&theme=sumi">` and needs no build-time
 * integration at all. Unknown values fall back rather than erroring — a host
 * should not be able to break the board by mistyping a parameter.
 */
export default async function EmbedPage({ searchParams }: PageProps<"/embed">) {
  const params = await searchParams;

  const variant = one(params.variant);
  const opening = one(params.opening);
  const obstacles = one(params.obstacles);

  const token = one(params.token);
  // Opt-in, so an embed that only wants a board stays a board.
  const showStats = one(params.stats) === "1" && token !== undefined;

  return (
    <div className="flex flex-col gap-2 p-3">
      <EmbedGame
      options={{
        settings: {
          size: readSize(one(params.size)),
          variant:
            variant !== undefined && variant in RULE_VARIANTS
              ? (variant as RuleVariant)
              : RULE_VARIANTS.freestyle,
          // An opening the variant does not offer falls back to free in the engine.
          opening:
            opening !== undefined && opening in OPENING_RULES
              ? (opening as OpeningRule)
              : OPENING_RULES.free,
          obstacles:
            obstacles !== undefined && obstacles in OBSTACLE_LAYOUTS
              ? (obstacles as ObstacleLayout)
              : OBSTACLE_LAYOUTS.none,
        },
        boardTheme: readTheme(one(params.theme), DEFAULT_APPEARANCE.boardTheme),
        stoneSet: readStoneSet(one(params.stones), DEFAULT_APPEARANCE.stoneSet),
        showCoordinates: one(params.coords) !== "0",
      }}
    />
      {showStats ? (
        <EmbedStats token={token} player={one(params.player) ?? null} />
      ) : null}
    </div>
  );
}
