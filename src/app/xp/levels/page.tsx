import Link from "next/link";

import { Paired } from "@/components/i18n/Paired";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { LevelLadder } from "@/components/xp/LevelLadder";
import { countText } from "@/lib/rating/figures";
import { LEVEL_MILESTONES, levelLadder } from "@/lib/xp/levelLadder";
import { levelPath, xpLevelName } from "@/lib/xp/levelNames";
import { XP_LEVELS, xpForLevel } from "@/lib/xp/xpCurve";
import { viewerXp } from "@/lib/xp/xpViewer";

export const metadata = {
  title: "The hundred levels",
  description:
    "Every rung of Itsutsu's experience ladder, from Insert Coin to Divine Move: what each level is called, what it costs, and why.",
};

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
  const rungs = levelLadder();
  const viewer = await viewerXp();
  const standing = viewer?.standing ?? null;

  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />

      <section className={`${PANEL_CLASS} flex flex-col gap-4`}>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="flex items-baseline gap-2 text-lg font-semibold">
            <Paired
              en="The hundred levels"
              kanji="段位"
              kanjiClassName="text-sm font-normal opacity-70"
            />
          </h1>
          {/* The leaderboard and the ladder are two halves of one thing, and each
              is the other's way on. See Nothing Is A Dead End. */}
          <Link href="/xp" className="text-sm underline underline-offset-4" data-testid="to-leaderboard">
            Who is where <span className="font-mincho">経験値</span>
          </Link>
        </div>

        <p className="max-w-3xl text-sm text-muted">
          Experience is the second of the two ladders here, and it is not the rating. A rating
          says how well you play; experience says you turned up and tried things — so an
          unrated game at one screen pays it, and a game you lost still pays for having been
          finished. Every level has a name out of gaming, from the arcade at the bottom to the
          pantheon at the top, and {countText(XP_LEVELS)} of them reach{" "}
          <Link href={levelPath(XP_LEVELS)} className="underline underline-offset-4">
            {xpLevelName(XP_LEVELS)}
          </Link>{" "}
          at {countText(xpForLevel(XP_LEVELS))} XP.
        </p>

        {viewer === null ? (
          /*
           * Nobody to mark. The ladder is worth reading either way, so the page
           * is the same page — what changes is that this says how to get onto it
           * rather than where the reader is, and it must read as an invitation
           * rather than as a door being shut.
           */
          <p className="text-sm" data-testid="ladder-join">
            Everybody starts at{" "}
            <Link href={levelPath(1)} className="underline underline-offset-4">
              level 1, {xpLevelName(1)}
            </Link>
            .{" "}
            <Link href="/join" className="underline underline-offset-4" data-testid="ladder-join-link">
              Join, and start climbing it
            </Link>
            .
          </p>
        ) : (
          <YourRung
            level={standing!.level}
            xp={viewer.xp}
            into={standing!.into}
            span={standing!.span}
            toNext={standing!.toNext}
          />
        )}

        <p className="text-xs text-muted">
          The marked rungs — {LEVEL_MILESTONES.map((level) => level).join(", ")} — are the ones
          worth stopping at. Press any level for its own page: what the name is, what it cost,
          and who is standing there.
        </p>

        <LevelLadder rungs={rungs} standing={standing?.level ?? null} />
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
}: {
  level: number;
  xp: number;
  into: number;
  span: number;
  toNext: number;
}) {
  const top = level >= XP_LEVELS;
  return (
    <div
      className="flex flex-col gap-2 rounded-xl border border-moss/40 bg-moss-soft/40 p-3"
      data-testid="your-standing"
      data-level={level}
    >
      <p className="text-sm">
        You are on{" "}
        <Link href={levelPath(level)} className="font-semibold underline underline-offset-4">
          level {level}, {xpLevelName(level)}
        </Link>
        , with {countText(xp)} XP.{" "}
        {top ? (
          <span className="text-muted">
            That is the top of the ladder — there is no rung above {xpLevelName(XP_LEVELS)}.
          </span>
        ) : (
          <span className="text-muted">
            {countText(toNext)} more reaches{" "}
            <Link href={levelPath(level + 1)} className="underline underline-offset-4">
              {xpLevelName(level + 1)}
            </Link>
            .
          </span>
        )}
      </p>
      {top ? null : (
        /* A bar rather than a percentage, because "930 of 1,150 into this level"
           is the fact and a rounded 81% is a worse way of saying it. */
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-rule"
          role="img"
          aria-label={`${countText(into)} of ${countText(span)} XP into level ${level}`}
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
