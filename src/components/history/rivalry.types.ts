import type { ReactNode } from "react";

import type { GamePair } from "@/lib/history/gameHistory.types";
import type { RivalryMoment, RivalrySeat, RivalrySide, RivalryView } from "@/lib/record/rivalry.types";

/**
 * Who a scoreboard is between, in the two forms a page knows it:
 *
 * - `seats` — a match's two seats. Either may be empty or a typed name, and
 *   then there is no rivalry and nothing is drawn.
 * - `record` — what a record page was narrowed to: a pair, or one member who
 *   is then set against the signed-in reader.
 */
export type RivalryOf =
  | { seats: { black: string | null; white: string | null } }
  | { record: { between: GamePair | null; member: string | null } };

export type RivalryPanelProps = {
  of: RivalryOf;
  /** The game the page is about, for "this game's" score beside the all-time one. */
  variant?: string | null;
  moment: RivalryMoment;
  /** The game just filed, on a finished match. */
  thisGameId?: string;
  testId?: string;
};

export type RivalryBoardProps = RivalryView & { testId?: string };

/** One corner of the board: a player, their colour, their level. */
export type RivalryCornerProps = {
  seat: RivalrySeat;
  side: RivalrySide;
  /** What to print for a member with no name at all. */
  fallback: string;
  testId: string;
};

/** One figure under the score, with its label. */
export type RivalryStatProps = { label: string; children: ReactNode };
