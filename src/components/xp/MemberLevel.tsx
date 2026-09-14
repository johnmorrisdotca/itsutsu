import { LevelName } from "./LevelName";
import { levelShown } from "@/lib/xp/levelShown";

import type { MemberLevelProps } from "./xp.types";

/**
 * SOMEBODY'S STANDING, WHERE A STRANGER MEETS THEM.
 *
 * The level and the total together, for a page ABOUT a person rather than a
 * list of them. John's words for the whole system were "you will show XP in a
 * person's profile", and a public player page is the profile a stranger reads —
 * so it says both, where the tables say the rung and the total in two columns.
 *
 * A component and not four lines on the page, for two reasons and the second is
 * the one that decided it. `src/app/players/[slug]/page.tsx` is 492 lines
 * against a 500-line gate, so the page can afford an import and a tag and
 * nothing more. And this is now the third surface that draws a level from a
 * total — the members list, a member's own panel, and here — which is one more
 * than a rule should be written out.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THREE ANSWERS, AND ONLY ONE OF THEM IS SILENT NOW
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `xp` is OPTIONAL, and the absence is not the same fact as a nought:
 *
 *  - **`undefined` — nobody asked.** `findMembersByNames` selects a narrow set
 *    of columns and XP is not among them, so a row from it does not know. A
 *    page handed one must not print a standing, and must not print nought
 *    either: that would be a claim about somebody made out of a missing read.
 *  - **`0` — asked, and there is nothing earned.** `levelShown` answers **1**,
 *    and this draws "Level 1 · Insert Coin · 0 XP". It answered null until John
 *    settled it — "Everyone is level 1 if 0xp." — and he is right: level 1 is
 *    named Insert Coin because it is where a person starts, so hiding it tells
 *    somebody who has just arrived that the ladder does not include them.
 *  - **Anything else — a standing, shown.**
 *
 * That reversal is exactly why the TYPE still has to keep `undefined` apart from
 * `0`. While nought was silent the two absences looked the same on screen and
 * the distinction was almost decorative; now one of them draws a real badge, so
 * `?? 0` at the call site would print "Level 1" for a person whose XP was never
 * read — a claim invented out of a narrow `select`. `levelShown` is asked here
 * rather than the raw curve for the other half of the same care: a program is
 * not on this ladder, so a bot's page draws nothing, and `botTier` is passed
 * through to say so.
 *
 * The badge is `LevelName`'s full form — the number AND the name — because this
 * is a heading with room in it, not a table cell competing with nine figures.
 * The compact form exists for the lists; here the name is the half worth reading
 * and there is space to read it.
 */
export function MemberLevel({ xp, botTier, testId = "member-level" }: MemberLevelProps) {
  if (xp === undefined) return null;
  const level = levelShown({ xp, botTier });
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
