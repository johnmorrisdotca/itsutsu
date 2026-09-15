import type { BacklogItem, BacklogKind, BacklogSort, BoardRead, BoardScope, StatusFilter } from "@/lib/backlog/backlog.types";

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
  /** Every row of `scope`, and no others. */
  items: BacklogItem[];
  /** Which rows were read for this view, so a count is drawn only where its rows are in hand. */
  scope: BoardScope;
  /** The filter the address named, pressed when the board opens. */
  initial: StatusFilter;
  /** The page the board is drawn on, as an address — its chips' links keep anything else it carries. */
  base: string;
  /** The name to fill the "asked by" field with: whoever is reading the page. */
  who: string;
};

export type FilterChipProps = {
  label: string;
  kanji?: string;
  /** How many rows stand here, or null where this view did not read them. */
  count: number | null;
  current: boolean;
  /** Narrows in place, for a filter whose rows this view holds. */
  onPick: () => void;
  /** The view that reads this filter's rows, or null where they are already here. */
  href: string | null;
  testId: string;
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
