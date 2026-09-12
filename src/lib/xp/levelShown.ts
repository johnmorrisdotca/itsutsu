import { xpLevelFor } from "./xpCurve";

/**
 * THE LEVEL WORTH PRINTING BESIDE A NAME, OR NULL.
 *
 * The twin of `ratingShown` in `src/lib/rating/shownRecord.ts`, and it exists
 * for that function's reason word for word: a figure nobody has earned is not a
 * small version of one, it is silence, and a list is better for saying nothing
 * than for saying a default. `ratingShown` returns null rather than 1600 for
 * somebody with no settled rating; this returns null rather than 1 for somebody
 * with no XP.
 *
 * A RULE AND NOT A COMPONENT'S BUSINESS, which is why it is a pure module with
 * its own test rather than a ternary inside `RecordTable`. The same judgement is
 * made on three tables — the members directory, the computers tab and the
 * operator's bots tab — and a rule written three times is a rule that will read
 * three ways within a fortnight.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY NOUGHT IS SILENCE AND NOT LEVEL ONE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * A member with no XP genuinely IS on level 1, so printing it would not be
 * false — it would be useless, and `xpBoard.ts` has already had this argument
 * and settled it. The leaderboard is `botTier: null, xp: { gt: 0 }`, and its own
 * comment says why: *"two hundred rows of 'Lv 1 · Insert Coin · 0' would be a
 * table about a default rather than about anybody's play."* A column of
 * identical badges down the members list is that table, sideways. Nobody's XP is
 * backfilled on any database today, so without this rule the mark would land on
 * every row on the site and mean nothing on any of them.
 *
 * It is a statement about the DATA and not about a kind of member, which is what
 * makes it right rather than convenient: the day the backfill runs, the mark
 * appears for everybody it has something to say about, and on nobody else.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * AND IT IS WHY THE PROGRAMS NEED NO SPECIAL CASE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `awardXp` refuses a program by name — `if (member.botTier !== null) return
 * refused(awards, XP_SKIP_REASONS.notAPerson, member.xp)` — and the backfill
 * skips them the same way, so every bot row on every database carries exactly
 * nought. The rule above therefore omits the mark beside Meijin and Kyu without
 * knowing that a program is a program, and a level-1 badge beside a grade that
 * has played two hundred games never appears.
 *
 * That is deliberately not a `botTier` check. The bots are excluded because they
 * have earned nothing, which is true and is the reason; excluding them because
 * they are bots would be a second rule saying the same thing in a way that could
 * disagree with the first. If a program ever did earn a point, the mark would
 * appear and would be correct.
 */
export function levelShown(xp: number): number | null {
  if (!Number.isFinite(xp) || xp <= 0) return null;
  return xpLevelFor(xp);
}
