"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import { GameCount } from "@/components/games/GameCount";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { PlayerName } from "@/components/players/PlayerName";
import { RAISED_LINK } from "@/components/ui/ui.constants";
import { LevelName } from "@/components/xp/LevelName";
import type { SinceLastPlayed } from "@/lib/catalogue/catalogueFigures";
import type { TopPlayerShown } from "@/lib/catalogue/catalogue.types";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { matchPath, playPath, standingsPath } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import type { Speaker } from "@/lib/i18n/i18n";
import { countText } from "@/lib/rating/figures";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { CROWN_MARK, STAT_CHIP, STAT_LABEL, STAT_LINK, STAT_POOL_TAG } from "./games.constants";
import type { FamilyStatsLineProps, GameStatsStripProps } from "./games.types";

/**
 * WHAT HAS BEEN PLAYED OF A GAME, UNDER ITS NAME, IN EVERY VIEW OF /games.
 *
 * John, on the index: "we see there are 2 captures games in this family... but
 * don't see links to the leaderboards or extended stats. The Top Winner of
 * these leaderboards... Could say 'TOP PLAYER: SO AND SO with 12-0 record' -
 * something interesting."
 *
 * So each game carries a strip: how many games of it have been played, its top
 * player with their record on that ladder, when it was last played, and the
 * way to its standings. Every number in it is the way into the games it
 * counted — the played count to the record narrowed to games that reached a
 * result, each of the top player's three numbers to their rated games at this
 * game on THAT ladder, won, lost or drawn.
 *
 * A game nobody has played keeps the strip's place and says so, with the way
 * in — the board for a member, the door for a stranger, worded for the
 * stranger — and NOTHING ELSE. A top-player chip reading "no rated games" and
 * a standings link under "nobody has played this" are three ways of saying one
 * thing, and on thirty-odd unplayed games they were the clutter John's rule
 * about empty tables is not asking for. A game that HAS been played with no
 * rated game among them keeps the chip, because there it says something the
 * count beside it does not. See Show The Data, Not The Way To It in AGENTS.md.
 *
 * The standings link is drawn once per game per view: here, unless the view
 * already offers one beside the strip (`standings={false}` — the plain list's
 * row of links does).
 *
 * A CLIENT COMPONENT only because the Cards view is one; it holds no state and
 * reads no clock. Everything time-dependent arrived decided (`sinceLastPlayed`).
 * Every link is `RAISED_LINK`, because in two of the three views the card
 * under it is itself one stretched link to the game.
 */
export function GameStatsStrip({ stats, signedIn, compact = false, standings = true }: GameStatsStripProps) {
  const say = useSpeaker();
  const hydrated = useHydrated();
  const variant = stats.variant;
  const strip = {
    className: "flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs",
    "data-testid": "game-stats",
    "data-variant": variant,
    ...readyMark(hydrated),
  };

  if (stats.played === 0) {
    return (
      <div {...strip}>
        <span className={`${STAT_CHIP} text-muted`} data-testid="game-stats-nobody">
          {say.say("catalogue.nobodyYet")}
        </span>
        <Link
          href={signedIn ? playPath(variant) : "/join"}
          className={`${STAT_LINK} px-1 font-semibold`}
          data-testid="game-stats-be-first"
        >
          {say.say(signedIn ? "catalogue.beFirst" : "catalogue.beFirstStranger")}
        </Link>
      </div>
    );
  }

  return (
    <div {...strip}>
      <span className={STAT_CHIP} data-testid="game-stats-played">
        {phraseWith(say.say(stats.played === 1 ? "catalogue.playedOne" : "catalogue.playedMany"), {
          count: (
            <GameCount
              count={countText(stats.played)}
              variant={variant}
              outcome="decided"
              title={say.say("rules.everyGamePlayed", { game: RULE_VARIANT_DISPLAY[variant as RuleVariant].label })}
              raised
              className="font-mono font-semibold tabular-nums"
              testId="game-stats-played-count"
            />
          ),
        })}
      </span>
      <TopPlayer top={stats.top} variant={variant} />
      {!compact && stats.last !== null ? (
        <span className={`${STAT_CHIP} text-muted`} data-testid="game-stats-last">
          {stats.last.gameId === null ? (
            lastPlayedText(say, stats.last.since)
          ) : (
            <Link href={matchPath(variant, stats.last.gameId)} className={STAT_LINK}>
              {lastPlayedText(say, stats.last.since)}
            </Link>
          )}
        </span>
      ) : null}
      {standings ? (
        <Link href={standingsPath(variant)} className={`${STAT_LINK} px-1`} data-testid="game-stats-standings">
          {say.say("catalogue.standings")}
        </Link>
      ) : null}
    </div>
  );
}

/**
 * The top player, labelled with the ladder they top.
 *
 * The label is the point, not decoration: a game nobody has played rated
 * among people shows the top of the ladder against the computer, and a figure
 * earned against programs read as a place among people is the two-pools fault
 * this site keeps having to fix. The hover says which, in a sentence.
 */
function TopPlayer({ top, variant }: { top: TopPlayerShown | null; variant: string }) {
  const say = useSpeaker();
  return (
    <span
      className={STAT_CHIP}
      title={
        top === null
          ? undefined
          : say.say(top.pool === "people" ? "catalogue.topMeansPeople" : "catalogue.topMeansComputer")
      }
      data-testid="game-stats-top"
      data-pool={top?.pool}
    >
      <span aria-hidden className={CROWN_MARK}>
        首
      </span>
      <span className={STAT_LABEL}>{say.say("catalogue.topPlayer")}</span>
      {top === null ? (
        <span className="text-muted" data-testid="game-stats-no-standing">
          {say.say("catalogue.noStanding")}
        </span>
      ) : (
        <>
          <Holder holder={top} />
          <TopRecord top={top} variant={variant} />
          <span className={STAT_POOL_TAG} data-testid="game-stats-pool">
            {say.say(top.pool === "people" ? "catalogue.poolPeople" : "catalogue.poolComputer")}
          </span>
        </>
      )}
    </span>
  );
}

/**
 * Who, for a reader who may be told; the way to be told, for one who may not.
 *
 * `forReader` decides which — this only draws what it was handed. A null name
 * is a reader with no session, and what they get is an invitation rather than
 * a blank: the site has somebody at the top of this game, and joining is how
 * to meet them.
 */
function Holder({ holder }: { holder: TopPlayerShown }) {
  const say = useSpeaker();
  if (holder.name === null) {
    return (
      <Link href="/join" className={STAT_LINK} data-testid="game-stats-join-to-see">
        {say.say("catalogue.joinToSeeWho")}
      </Link>
    );
  }
  return (
    <>
      <PlayerName
        name={holder.name}
        memberId={holder.memberId}
        fallback=""
        className={`font-semibold ${RAISED_LINK}`}
        testId="game-stats-top-name"
      />
      {holder.level === null ? null : (
        <LevelName level={holder.level} compact className={`text-muted ${RAISED_LINK}`} testId="game-stats-top-level" />
      )}
    </>
  );
}

/**
 * Won–lost–drawn on that ladder, each number the way into those games.
 *
 * Narrowed exactly as it was counted: this member, this game, this pool, rated
 * games only, and the outcome. A standing's tallies move only on rated games
 * of its pool, so a link that dropped any one of those would open a longer
 * list than the number it sits in.
 *
 * Asked by member id. Where there is no id and no name to ask by — a stranger
 * reading a standing nobody has claimed — the only address left is the whole
 * name, which is not this page's to publish, so the numbers are plain.
 */
function TopRecord({ top, variant }: { top: TopPlayerShown; variant: string }) {
  const say = useSpeaker();
  const linkable = top.memberId !== null || top.name !== null;
  const titles = {
    won: say.say("catalogue.wonTitle"),
    lost: say.say("catalogue.lostTitle"),
    drawn: say.say("catalogue.drawnTitle"),
  };
  const figure = (count: number, outcome: "won" | "lost" | "drawn", tone: string) => {
    const title = titles[outcome];
    const testId = `game-stats-${outcome}`;
    if (!linkable) {
      return (
        <span className={tone} title={title} data-testid={testId}>
          {countText(count)}
        </span>
      );
    }
    return (
      <GameCount
        count={countText(count)}
        variant={variant}
        memberId={top.memberId}
        player={top.name ?? undefined}
        pool={top.pool}
        rated="yes"
        outcome={outcome}
        title={title}
        raised
        className={tone}
        testId={testId}
      />
    );
  };
  return (
    <span className="font-mono font-semibold tabular-nums" data-testid="game-stats-record">
      {figure(top.wins, "won", "text-moss")}
      <span aria-hidden className="text-muted">–</span>
      {figure(top.losses, "lost", "text-shu")}
      <span aria-hidden className="text-muted">–</span>
      {figure(top.draws, "drawn", "text-ink-soft")}
    </span>
  );
}

/**
 * A family's line: its games played, how many of its games have been tried,
 * and who holds the most of its top places.
 *
 * THE TOTAL IS NOT A LINK, AND IT CANNOT BE. It counts the matches of every
 * game in the family, and /history filters by one game: a link would open a
 * different set from the number it sits under, which is the fault this site's
 * gate is written against. It is named there, with this reason, among the
 * counts said through a phrase. The "2 of 2" counts games of the catalogue,
 * and each of those is under the heading, linked.
 *
 * The crowns follow `familyFiguresOf`: a crown is a game's top place, exactly
 * as the strip under that game shows it, so the family line cannot disagree
 * with the rows beneath it.
 */
export function FamilyStatsLine({ stats }: FamilyStatsLineProps) {
  const say = useSpeaker();
  const { crowns } = stats;
  return (
    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs font-normal text-muted" data-testid="family-stats">
      <span data-testid="family-stats-played">
        {say.say(stats.played === 1 ? "catalogue.familyPlayedOne" : "catalogue.familyPlayedMany", {
          count: countText(stats.played),
        })}
      </span>
      <span aria-hidden>·</span>
      <span data-testid="family-stats-tried">
        {say.say("catalogue.familyTried", { played: String(stats.gamesPlayed), total: String(stats.games) })}
      </span>
      {crowns === null ? null : (
        <>
          <span aria-hidden>·</span>
          {crowns.kind === "held" ? (
            <span className="inline-flex flex-wrap items-baseline gap-x-1" title={say.say("catalogue.crownMeans")} data-testid="family-stats-crowns">
              <span aria-hidden className={CROWN_MARK}>
                首
              </span>
              <span className={STAT_LABEL}>{say.say("catalogue.crownsHeld")}</span>
              <Holder holder={crowns.holder} />
              <span className="font-mono tabular-nums">
                {say.say("catalogue.crownCount", { count: String(crowns.games.length), total: String(stats.games) })}
              </span>
            </span>
          ) : (
            <span title={say.say("catalogue.crownMeans")} data-testid="family-stats-crowns">
              {say.say("catalogue.crownsShared", { count: String(crowns.holders) })}
            </span>
          )}
        </>
      )}
    </span>
  );
}

/** "Last played 3 days ago", in the reader's language. */
function lastPlayedText(say: Speaker, since: SinceLastPlayed): string {
  switch (since.unit) {
    case "today":
      return say.say("catalogue.lastToday");
    case "yesterday":
      return say.say("catalogue.lastYesterday");
    case "days":
      return say.say("catalogue.lastDays", { count: countText(since.count) });
    case "months":
      return say.say("catalogue.lastMonths", { count: countText(since.count) });
    case "years":
      return say.say("catalogue.lastYears", { count: countText(since.count) });
  }
}

/**
 * A phrase with a node where a placeholder was — a link where "{count}" is.
 *
 * `say` fills placeholders with text, and a count here has to be a LINK, in
 * whatever position the reader's language puts the number: "12 games played"
 * in English, "対局数 12" in Japanese. Asked with no values, `say` hands back
 * the phrase with its placeholders standing, and this splits it around them.
 */
function phraseWith(template: string, nodes: Record<string, ReactNode>): ReactNode {
  return template.split(/(\{\w+\})/).map((part, index) => {
    const name = /^\{(\w+)\}$/.exec(part)?.[1];
    return <Fragment key={index}>{name !== undefined && name in nodes ? nodes[name] : part}</Fragment>;
  });
}
