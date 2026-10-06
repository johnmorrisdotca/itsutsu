import { SITE_NAME } from "@/lib/i18n/siteName";
import Link from "@/components/ui/Link";

import { Paired } from "@/components/i18n/Paired";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { LevelLadder } from "@/components/xp/LevelLadder";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import type { Speaker } from "@/lib/i18n/i18n";
import { weave } from "@/lib/i18n/weave";
import { countText } from "@/lib/rating/figures";
import { LEVEL_MILESTONES, levelLadder } from "@/lib/xp/levelLadder";
import { levelPath, xpLevelName } from "@/lib/xp/levelNames";
import { XP_LEVELS, xpForLevel } from "@/lib/xp/xpCurve";
import { viewerXp } from "@/lib/xp/xpViewer";
import { xpForBadge } from "@/lib/xp/xpScope";

export async function generateMetadata() {
  const say = await currentSpeaker();
  return {
    title: say.say("xp.levels.title"),
    description: say.say("xp.levels.metaDescription", {
      site: SITE_NAME,
      first: xpLevelName(1, say.locale),
      last: xpLevelName(XP_LEVELS, say.locale),
    }),
  };
}

/*
 * The reader's own rung is marked, and that is read off the session — so this
 * cannot be built once and served to everybody.
 */
export const dynamic = "force-dynamic";

/**
 * THE LADDER: ALL HUNDRED LEVELS, THEIR NAMES, WHAT THEY COST AND WHY.
 *
 * A reference page, and it is built like one rather than like a table. There is
 * no pager, no sort and no cursor on it: a hundred rows is the whole thing, it
 * will be a hundred rows for ever, and a reader goes down it the way they go
 * down a rules page — looking for the rung above theirs, or for the name they
 * were just called. `LevelLadder.tsx` says why that is a decision and not an
 * omission of the paging convention.
 *
 * **The one query it might have run, it does not.** Marking where the reader
 * stands needs their total, and `viewerXp` reads it off the row `memberRowFor`
 * has already cached for this request — so the whole page is the hundred-element
 * array in memory and nothing else. See `xpViewer.ts`.
 */
export default async function LevelsPage() {
  const say = await currentSpeaker();
  const rungs = levelLadder(say.locale);
  const viewer = await viewerXp();
  const standing = viewer?.standing ?? null;

  return (
    <Page>
      <SiteHeader />

      {/* The leaderboard and the ladder are two halves of one thing, and each
          is the other's way on. See Nothing Is A Dead End. */}
      <PageTitle
        title={say.say("xp.levels.title")}
        kanji="段位"
        aside={
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <Link href="/xp/promotions" className="text-sm underline underline-offset-4" data-testid="to-promotions">
              <Paired en={say.say("xp.promotions.title")} kanji="昇級" />
            </Link>
            <Link href="/xp" className="text-sm underline underline-offset-4" data-testid="to-leaderboard">
              <Paired en={say.say("xp.board.metaTitle")} kanji="経験値" />
            </Link>
          </div>
        }
      />
      <section className={`${PANEL_CLASS} flex flex-col gap-4`}>
        <p className="text-sm text-muted">
          {weave(say.say("xp.levels.intro"), {
            count: countText(XP_LEVELS, say.locale),
            xp: countText(xpForLevel(XP_LEVELS), say.locale),
            top: (
              <Link href={levelPath(XP_LEVELS)} className="underline underline-offset-4">
                {xpLevelName(XP_LEVELS, say.locale)}
              </Link>
            ),
          })}
        </p>

        {viewer === null ? (
          /*
           * Nobody to mark. The ladder is worth reading either way, so the page
           * is the same page — what changes is that this says how to get onto it
           * rather than where the reader is, and it must read as an invitation
           * rather than as a door being shut.
           */
          <p className="text-sm" data-testid="ladder-join">
            {weave(say.say("xp.levels.guest"), {
              level: (
                <Link href={levelPath(1)} className="underline underline-offset-4">
                  {say.say("xp.standing.levelName", { level: "1", name: xpLevelName(1, say.locale) })}
                </Link>
              ),
              join: (
                <Link href="/join" className="underline underline-offset-4" data-testid="ladder-join-link">
                  {say.say("xp.levels.joinLink")}
                </Link>
              ),
            })}
          </p>
        ) : (
          <YourRung
            level={standing!.level}
            /* The badge's total, the one `standing` was read from — see `xpForBadge`. */
            xp={xpForBadge(viewer)}
            into={standing!.into}
            span={standing!.span}
            toNext={standing!.toNext}
            say={say}
          />
        )}

        <p className="text-xs text-muted">{say.say("xp.levels.marked", { marked: LEVEL_MILESTONES.join(", ") })}</p>

        <LevelLadder rungs={rungs} standing={standing?.level ?? null} say={say} />
      </section>
    </Page>
  );
}

/**
 * Where the reader stands, above the ladder they are about to scroll.
 *
 * "Show The Data, Not The Way To It" — the fact a member came for is their own
 * rung, so it is on the page rather than one click under it, and the ladder
 * below marks the same row again so scrolling to it finds it.
 */
function YourRung({
  level,
  xp,
  into,
  span,
  toNext,
  say,
}: {
  level: number;
  xp: number;
  into: number;
  span: number;
  toNext: number;
  say: Speaker;
}) {
  const top = level >= XP_LEVELS;
  return (
    <div
      className="flex flex-col gap-2 rounded-xl border border-moss/40 bg-moss-soft/40 p-3"
      data-testid="your-standing"
      data-level={level}
    >
      <p className="text-sm">
        {weave(say.say("xp.levels.youAre"), {
          level: (
            <Link href={levelPath(level)} className="font-semibold underline underline-offset-4">
              {say.say("xp.standing.levelName", { level: String(level), name: xpLevelName(level, say.locale) })}
            </Link>
          ),
          xp: countText(xp, say.locale),
          rest: top ? (
            <span className="text-muted">
              {say.say("xp.levels.topOfLadder", { top: xpLevelName(XP_LEVELS, say.locale) })}
            </span>
          ) : (
            <span className="text-muted">
              {weave(say.say("xp.levels.moreReaches"), {
                count: countText(toNext, say.locale),
                next: (
                  <Link href={levelPath(level + 1)} className="underline underline-offset-4">
                    {xpLevelName(level + 1, say.locale)}
                  </Link>
                ),
              })}
            </span>
          ),
        })}
      </p>
      {top ? null : (
        /* A bar rather than a percentage, because "930 of 1,150 into this level"
           is the fact and a rounded 81% is a worse way of saying it. */
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-rule"
          role="img"
          aria-label={say.say("xp.levels.progress", { into: countText(into, say.locale), span: countText(span, say.locale), level: String(level) })}
        >
          <div
            className="h-full rounded-full bg-moss"
            style={{ width: `${span === 0 ? 100 : Math.round((into / span) * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
