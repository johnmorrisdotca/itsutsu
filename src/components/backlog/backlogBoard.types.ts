import type { BacklogItem, BacklogKind, BacklogSort, StatusFilter } from "@/lib/backlog/backlog.types";

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
