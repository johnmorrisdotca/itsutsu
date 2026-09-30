import { TableRow } from "@/components/party/online/MyTables";
import type { CompletedRow } from "@/lib/history/completed";
import type { NameTag } from "@/lib/xp/nameTag.types";

import { HistoryRow } from "./MyHistory";
import { Row } from "./MyGameRow";
import { PuzzleSolveRow } from "./MyPuzzleSolves";

/**
 * One row of the Completed tab's one list (`completed.ts`), drawn by the row
 * its own kind has always been drawn with: a game with its star and what it
 * earned, a table with how it went, a game round one screen as the History tab
 * draws it, a puzzle with its score.
 */
export function CompletedRowView({
  row,
  now,
  tags,
  tableTags,
  earned,
  starred,
}: {
  row: CompletedRow;
  now: Date;
  tags: ReadonlyMap<string, NameTag>;
  /** The tags beside the names at the tables, read with them (`myTables`). */
  tableTags: ReadonlyMap<string, NameTag>;
  earned: ReadonlyMap<string, number>;
  /** The reader's starred games among the page's; null where no star is offered. */
  starred: ReadonlySet<string> | null;
}) {
  switch (row.kind) {
    case "game":
      return <Row item={row.item} now={now} tags={tags} earned={earned.get(row.item.game.id)} starred={starred === null ? null : starred.has(row.item.game.id)} />;
    case "table":
      return <TableRow table={row.table} finished tags={tableTags} />;
    case "device":
      return <HistoryRow entry={row.entry} now={now} tags={tags} />;
    case "solve":
      return <PuzzleSolveRow solve={row.solve} now={now} />;
  }
}
