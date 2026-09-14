import type { ReactNode } from "react";

import type { Promotion } from "@/lib/xp/promotions.types";

/** The recent promotions table, drawn by `PromotionsTable`. */
export type PromotionsTableProps = {
  /** The page of promotions, newest first, already narrowed. */
  items: readonly Promotion[];
  /** The reader's own member id, so their lines are marked. Null for a reader with no member row. */
  viewerId: string | null;
  /** The reader's zone, so a day reads in their own terms. Empty is UTC. */
  viewerZone: string;
  /** What the empty table says and offers, worded by the page for whoever is reading. */
  empty: ReactNode;
};
