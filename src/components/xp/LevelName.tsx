import Link from "next/link";

import { levelNameRow, levelPath, xpLevelKanji, xpLevelName } from "@/lib/xp/levelNames";

import type { LevelNameProps } from "./xp.types";

/**
 * SOMEBODY'S LEVEL, LEADING TO WHAT IT IS.
 *
 * The twin of `PlayerName` and `GameName`, and it exists for the same reason
 * they do: this site prints a level in a dozen places, and a rank called
 * "Kill Screen" with nothing behind it leaves a reader wondering whether it
 * means anything. It leads to `/xp/levels/42`, which says what the name is, what
 * it cost, who else is standing there and what the next rung is.
 *
 * **The kanji is a hover and never a second line.** A level's Japanese name is a
 * flourish on a badge that has to fit into a table cell beside a person's name,
 * their XP and a date, and `Paired` would put two scripts in that cell on the
 * English site. The ladder pages pair it properly, where there is room for it to
 * be read; here it is in the `title` and in the accessible label, so it is
 * available rather than absent.
 *
 * **Nothing is wired to it yet, deliberately.** The lists that will carry it —
 * `RecordTable`, the members directory, the ladder, a member's own XP panel —
 * are all in flight on other branches as this lands, and editing them here would
 * be the merge that re-creates a file somebody else has moved. The wiring is a
 * follow-up patch once they are all in; the leaderboard at `/xp` uses it today,
 * which is what proves it draws.
 */

/**
 * Everything the badge puts on screen, decided without React.
 *
 * Here as a function rather than inline in the component because the unit tests
 * on this site run in node with no DOM — `vitest.config.mts` collects `.test.ts`
 * files and nothing else — so what can be tested is what a component exports.
 * `playedScopeNote` in `PlayerRecord.tsx` is the same shape for the same reason,
 * and the decision worth pinning here is `href`.
 *
 * **`href` IS NULL FOR A LEVEL WITH NO PAGE, AND THAT IS THE POINT.** The ladder
 * has a hundred rungs, `/xp/levels/101` is a 404, and a badge that linked there
 * anyway would be the one thing AGENTS.md says is worse than printing a plain
 * number: a link that cannot keep its promise. A level past the top can still be
 * SHOWN — `xpLevelName` floors it to `Level 101`, which is honest — it just has
 * nowhere to go, and null is how that is said rather than an address that would
 * be wrong.
 */
export function levelBadge(
  level: number,
  compact = false,
): { shown: string; whole: string; label: string; href: string | null } {
  const name = xpLevelName(level);
  const kanji = xpLevelKanji(level);
  const whole = kanji === "" ? name : `${name} ${kanji}`;

  /*
   * The number is always shown and the NAME is what may be dropped, which is the
   * way round it has to be: the number is the fact that orders the ladder, and
   * the name is the fact that makes it worth reading. A compact badge that kept
   * the name and dropped the number would be a word with no place in a sequence.
   */
  return {
    shown: compact ? `${level}` : `${level} · ${name}`,
    whole,
    label: `Level ${level}, ${whole}`,
    href: levelNameRow(level) === null ? null : levelPath(level),
  };
}

export function LevelName({
  level,
  linkable = true,
  compact = false,
  className = "",
  testId = "level-name",
}: LevelNameProps) {
  const { shown, whole, label, href } = levelBadge(level, compact);

  const body = (
    <>
      <span aria-hidden className="text-muted">
        Lv
      </span>{" "}
      {shown}
    </>
  );

  const skin =
    `inline-flex items-baseline gap-1 whitespace-nowrap font-mono text-xs tabular-nums ${className}`.trim();

  if (!linkable || href === null) {
    return (
      <span className={skin} title={whole} data-testid={testId} data-level={level}>
        {body}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`${skin} underline-offset-2 hover:underline`}
      title={whole}
      /*
       * The name in words for a reader who gets no `title` and no hover. Not
       * "level 42" alone, which is the one thing the digits on screen already
       * say, and not the note either — a sentence about Pac-Man read out before
       * every row of a table is worse than no label at all.
       */
      aria-label={label}
      data-testid={testId}
      data-level={level}
    >
      {body}
    </Link>
  );
}
