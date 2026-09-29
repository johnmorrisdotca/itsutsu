import type { ComponentType } from "react";

import type { Appearance } from "@/components/board/board.types";
import type { OnlineOffer, OnlineTableView } from "@/lib/party/online/online.types";
import type { LiveBoardIntervals } from "@/lib/site/site.types";
import type { NameTag } from "@/lib/xp/nameTag.types";

export type { OnlineOffer };

/**
 * What one game's board at a table on several devices is handed: the game as
 * its rules make it (names written in), whether this page may move now, and
 * the hand that sends a move. The seats, the links, the polling and the
 * sending are the table's (`OnlineTable`); this draws the game and asks its
 * rules where a tap may go.
 */
export type OnlineBoardProps<S, M> = {
  game: S;
  appearance: Appearance;
  /** Whether the reader's seat is the one to play, and no move of theirs is on its way. */
  canMove: boolean;
  onMove: (move: M) => void;
};

/**
 * ONE GAME'S BOARD AT A TABLE: the component that draws it and the line each
 * seat's row says about how it stands (boxes held, pieces home). A row per
 * `OnlineGameKey` in `ONLINE_VIEWS`.
 */
export type OnlineView<S, M> = {
  Board: ComponentType<OnlineBoardProps<S, M>>;
  /** How a seat stands in this game, for its row in the seat list: "3 boxes", "4 of 10 home". */
  standing: (game: S, seat: number) => string;
  /** The test id a spec reaches the board by, as the table on one device names it. */
  testId: string;
};

/** What the table page hands its client. */
export type OnlineTableProps = {
  initial: OnlineTableView;
  appearance: Appearance;
  /** The operator's two poll intervals, read where the page rendered (`liveBoardIntervals`). */
  intervals: LiveBoardIntervals;
  /** The game's front door. */
  gameHref: string;
  /** The game's name, for the text message an open seat's link is sent in. */
  gameLabel: string;
  /** Each seated member's flag and badge (`nameTagsOf`), by member id. */
  tags: Readonly<Record<string, NameTag>>;
};

/** A seat as the set-up's picker holds it: the reader's own, a link, a computer, or a buddy by id. */
export type SeatChoice = "me" | "link" | "computer" | `buddy:${string}`;
