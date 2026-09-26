import Link from "@/components/ui/Link";

import { currentMemberRow } from "@/lib/auth/currentSession";
import { levelShown } from "@/lib/xp/levelShown";
import { levelPath, xpLevelName } from "@/lib/xp/levelNames";
import { xpForBadge } from "@/lib/xp/xpScope";

import { StripGames } from "./StripGames";

/**
 * A MEMBER'S OWN FIGURES, ON ONE LINE UNDER THE MASTHEAD, EACH A LINK.
 *
 * John, 2026-09-24, beside UmaKuma's sub-header: "we should take advantage of
 * the area below the header and put a row of small data that can be used to
 * quick link to games, etc. and all the items should be links to other
 * places." What is waiting on them, their rated record, their level and their
 * experience, small and quiet on the right, the way UmaKuma shows its XP.
 *
 * NOTHING NEW TO READ. The level and the total come off the member row every
 * page has already read (`memberRowFor` is cached per request), and the games
 * half shares the Play badge's one request (`StripGames`). A stranger, and an
 * operator with no member behind the session, get no line at all.
 */
export async function MemberStrip() {
  const member = await currentMemberRow();
  if (member === null) return null;
  const xp = xpForBadge({ xp: member.xp, xpEverywhere: member.xpEverywhere });
  const level = levelShown({ xp });
  return (
    <nav
      aria-label="Your games and standing"
      data-chrome
      className="flex flex-wrap items-baseline justify-end gap-x-4 gap-y-1 text-[0.7rem] font-semibold tracking-[0.12em] text-muted uppercase"
      data-testid="member-strip"
    >
      <StripGames memberId={member.id} />
      {level === null ? null : (
        <Link href={levelPath(level)} className="whitespace-nowrap underline-offset-4 hover:text-ink hover:underline" data-testid="strip-level">
          Lv {level} · {xpLevelName(level)}
        </Link>
      )}
      <Link href="/xp" className="whitespace-nowrap underline-offset-4 hover:text-ink hover:underline" data-testid="strip-xp">
        {xp.toLocaleString("en-US")} XP
      </Link>
    </nav>
  );
}
