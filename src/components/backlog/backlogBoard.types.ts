import type { BacklogItem, BacklogKind, BacklogSort, BoardRead, StatusFilter } from "@/lib/backlog/backlog.types";

export type AdminBoardCardProps = {
  /** The board as the Admin page read it once, so the card and the board below it are one call. */
  board: BoardRead;
};

export type BoardUnreadableProps = {
  /** Why Sumilabu could not be read, in the client's words; never a token. */
  problem: string;
};

/** What the board's controls are set to. One object, so a change is one setState. */
export type BoardView = {
  status: StatusFilter;
  kind: BacklogKind | "all";
  text: string;
  sort: BacklogSort;
};

export type BacklogBoardProps = {
  items: BacklogItem[];
  /** The name to fill the "asked by" field with: whoever is reading the page. */
  who: string;
};

export type BacklogRowProps = {
  item: BacklogItem;
  /** Called once the server has accepted a move, so the page can be re-read. */
  onMoved: () => void;
};

export type AddBacklogItemProps = {
  who: string;
  onAdded: () => void;
};
