import { LevelName } from "./LevelName";
import { levelShown } from "@/lib/xp/levelShown";

import type { MemberLevelProps } from "./xp.types";

/**
 * SOMEBODY'S STANDING, WHERE A STRANGER MEETS THEM.
 *
 * The level and the total together, for a page ABOUT a person rather than a
 * list of them. John's words for the whole system were "you will show XP in a
 * person's profile", and a public player page is the profile a stranger reads —
 * so it says both, where the tables say only the rung.
 *
 * A component and not four lines on the page, for two reasons and the second is
 * the one that decided it. `src/app/players/[slug]/page.tsx` is 492 lines
 * against a 500-line gate, so the page can afford an import and a tag and
 * nothing more. And this is now the third surface that draws a level from a
 * total — the members list, a member's own panel, and here — which is one more
 * than a rule should be written out.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THREE ANSWERS, AND TWO OF THEM DRAW NOTHING FOR DIFFERENT REASONS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `xp` is OPTIONAL, and the absence is not the same fact as a nought:
 *
 *  - **`undefined` — nobody asked.** `findMembersByNames` selects a narrow set
 *    of columns and XP is not among them, so a row from it does not know. A
 *    page handed one must not print a standing, and must not print nought
 *    either: that would be a claim about somebody made out of a missing read.
 *  - **`0` — asked, and there is nothing.** `levelShown` answers null, for
 *    `xpBoard.ts`'s reason: "Level 1 · Insert Coin · 0" on the page of somebody
 *    who has never played is a badge about a default. A stranger reading it
 *    would think it meant something.
 *  - **Anything else — a standing, shown.**
 *
 * Both absences render nothing, which is why the distinction has to live in the
 * TYPE rather than in what a reader sees. `?? 0` at the call site would collapse
 * them and the day XP arrives on a lookup that never selected it, the page would
 * have been quietly wrong about everybody it drew from that one.
 *
 * The badge is `LevelName`'s full form — the number AND the name — because this
 * is a heading with room in it, not a table cell competing with nine figures.
 * The compact form exists for the lists; here the name is the half worth reading
 * and there is space to read it.
 */
export function MemberLevel({ xp, testId = "member-level" }: MemberLevelProps) {
  if (xp === undefined) return null;
  const level = levelShown(xp);
  if (level === null) return null;
  return (
    <span className="flex items-baseline gap-2 text-sm font-normal" data-testid={testId}>
      <LevelName level={level} />
      <span className="font-mono tabular-nums text-muted" data-testid={`${testId}-total`}>
        {xp.toLocaleString("en-US")} XP
      </span>
    </span>
  );
}
