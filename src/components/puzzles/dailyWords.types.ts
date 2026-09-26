import type { ArchiveWeek, DailyStatus } from "@/lib/puzzles/dailyWords/dailyWords.types";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

/** One length's button: where it plays, and where the reader stands with it — null where nobody is signed in to say. */
export type DailyButtonRow = {
  size: number;
  href: string;
  status: DailyStatus | null;
  /** The same length's Sakasa today, played backwards (`backwards.ts`): its button and the reader's standing with it. */
  backwards: { href: string; status: DailyStatus | null };
};

export type DailyWordButtonsProps = {
  kind: PuzzleKind;
  rows: readonly DailyButtonRow[];
  /** The day's page, for the fastest today: only for a member, since it names members. */
  todayHref: string | null;
  /** In a panel with a heading of its own (the set-up), or a caption under the Play button (the front door). */
  framed: boolean;
};

export type DailyArchiveTableProps = {
  sizes: readonly number[];
  weeks: readonly ArchiveWeek[];
  /** The months there are words for, newest first, `YYYY-MM`, and the one shown ("all" for every one). */
  months: readonly string[];
  month: string;
  /** Whether a size is letters or kana, for the column headings. */
  unit: "letters" | "kana";
};
