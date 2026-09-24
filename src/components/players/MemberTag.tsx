import { MemberKindBadge } from "@/components/auth/MemberKindBadge";
import { RecencyMark } from "@/components/mine/Recency";
import type { MemberMarks } from "@/lib/players/memberMarks";
import type { Recency } from "@/lib/social/presence";

import { CountryMark } from "./CountryMark";
import { PlayerName } from "./PlayerName";

/**
 * A MEMBER NAMED IN A LIST: THE ONE WAY A ROW DRAWS WHO IT IS ABOUT.
 *
 * Two components name people on this site, and each has one job:
 *
 * - `PlayerName` is a name in running text — "Champion: Hanako M.", "Hanako
 *   M. vs Taro S.", a heading's "with Hanako M." Just the name, leading to
 *   them.
 * - `MemberTag` is a name as the subject of a row — the players list, the XP
 *   board, a ladder, your buddies. The name, and after it, always in this
 *   order and always drawn the same: whether they are here now, 新 for a
 *   person who joined in the last two weeks, their flag, what sort of member
 *   they are (BOT for a program), and "You" on the reader's own row.
 *
 * John, 2026-09-24: "We really need to be using components that show names in
 * the same way everywhere in the site... we can have several components but
 * right now it's no holds barred, every man for himself." The XP board drew a
 * program with no BOT badge, the ladders drew no flag, "My people" drew a name
 * that led nowhere — each list drew what its own query happened to have. The
 * marks now come from one read (`memberMarks`), and this is the only place
 * that draws them; `memberNames.coverage.test.ts` fails the build for a list
 * that draws a name or a mark any other way.
 *
 * No picture before the name, anywhere. John: "no point in showing the icon
 * before the name, as you don't do it anywhere else".
 */
export function MemberTag({
  name,
  memberId,
  marks = null,
  you = false,
  recency = null,
  fallback,
  whole = false,
  testId,
}: {
  name: string;
  memberId?: string | null;
  /**
   * What is drawn after the name, from `memberMarks`. Null for a name with
   * nobody behind it — a name typed at one screen, a kept record never
   * folded into a member — which has no flag or kind to show.
   */
  marks?: MemberMarks | null;
  /** The reader's own row. */
  you?: boolean;
  /** How lately they were here, on the lists that know. */
  recency?: Recency;
  /** What to print where there is no name yet. */
  fallback: string;
  /** The operator's own list only — see `PlayerName`. */
  whole?: boolean;
  /** The name link's test id, for the specs that have always looked for it by its list. */
  testId?: string;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2" data-testid="member-tag">
      <RecencyMark recency={recency} />
      <PlayerName name={name} memberId={memberId} fallback={fallback} whole={whole} testId={testId} />
      {marks?.isNew ? (
        <span
          className="text-[0.7rem] font-semibold text-moss"
          title="New here, joined in the last two weeks"
          aria-label="new member"
          data-testid="record-new"
        >
          新
        </span>
      ) : null}
      {marks ? <CountryMark country={marks.country} className="text-sm" /> : null}
      {marks ? <MemberKindBadge kind={marks.kind} /> : null}
      {you ? (
        <span className="text-[0.65rem] tracking-wide text-moss uppercase" data-testid="member-you">
          You
        </span>
      ) : null}
    </span>
  );
}
