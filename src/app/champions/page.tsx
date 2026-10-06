import Link from "@/components/ui/Link";

import { Paired } from "@/components/i18n/Paired";

import { GameCount } from "@/components/games/GameCount";
import { GameThumb } from "@/components/games/GameThumb";
import { PageTitle } from "@/components/layout/Headings";
import { Tabs } from "@/components/ui/Tabs";
import { PLAYERS_TABS } from "@/app/players/players.tabs";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PlayerLink, TierMark } from "@/components/players/Standings";
import { withoutLevel } from "@/lib/xp/nameTag.types";
import { XP_BLANK_BECAUSE } from "@/components/players/players.constants";
import { IpCell, XpCell, championIp, ipHeadTitle } from "@/components/players/recordTrailing";
import { titleWithKanji } from "@/components/games/pageTitles";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import type { Speaker } from "@/lib/i18n/i18n";
import { SITE_NAME } from "@/lib/i18n/siteName";
import { weave } from "@/lib/i18n/weave";
import { LevelName } from "@/components/xp/LevelName";
import { PANEL_CLASS, TABLE_SCROLL } from "@/components/ui/ui.constants";
import { levelShown } from "@/lib/xp/levelShown";
import { GAME_FAMILIES, boardGamesOf } from "@/lib/gomoku/families";
import { standingsPath } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { fetchChampions, type VariantChampion } from "@/lib/rating/variantRatings";
import { SimpleChampions } from "@/components/players/SimpleChampions";
import { ViewTabs } from "@/components/ui/ViewTabs";
import { currentTestModeReader } from "@/lib/testMode/testMode";

export async function generateMetadata() {
  return { title: titleWithKanji(await currentSpeaker(), "players.champions", "名人") };
}

// The standings are read from the database on every request, never at build time.
export const dynamic = "force-dynamic";

const HEAD_CLASS = "text-left text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase";

/** One game's line: its name, and the player at the top of its ladder. */
function ChampionRow({ variant, champion, say }: { variant: string; champion: VariantChampion | undefined; say: Speaker }) {
  const copy = RULE_VARIANT_DISPLAY[variant as keyof typeof RULE_VARIANT_DISPLAY];
  return (
    <tr className="border-t border-rule" data-testid={`champion-row-${variant}`}>
      <td className="py-1.5 pr-3">
        <span className="flex items-center gap-2">
          {/* Forty rows of names scan by their boards; a table cell gets the small size. */}
          <GameThumb variant={variant} size="small" />
          <Link href={standingsPath(variant)} className="font-medium underline-offset-2 hover:underline">
            <Paired en={copy.label} kanji={copy.kanji} kanjiClassName="text-xs font-normal opacity-70" />
          </Link>
        </span>
      </td>
      {champion === undefined ? (
        <td className="py-1.5 pr-3 text-xs text-muted" colSpan={7}>
          {say.say("players.champEmpty")}
        </td>
      ) : (
        <>
          <td className="py-1.5 pr-3">
            {/*
              The champion's level beside their name and their XP after the
              rating, exactly as every table of people draws them: a champion
              is a person on a stats table, and John asked for XP on all of
              those. The level goes through `levelShown` from the total
              `fetchChampions` read — null for a name with nobody behind it.
            */}
            <span className="flex min-w-0 items-baseline gap-2">
              <PlayerLink name={champion.leader.name} memberId={champion.leader.memberId} tag={withoutLevel(champion.leader.tag ?? undefined)} />
              {champion.leader.xp === null ? null : (
                <LevelName
                  level={levelShown({ xp: champion.leader.xp }) ?? 1}
                  compact
                  className="text-muted"
                  testId="champion-level"
                />
              )}
            </span>
          </td>
          <td className="py-1.5 pr-3 font-mono tabular-nums">{champion.leader.rating}</td>
          <XpCell
            say={say}
            xp={champion.leader.xp}
            blankBecause={champion.leader.memberId === null ? XP_BLANK_BECAUSE.unclaimedName : undefined}
          />
          {/* What the champion has won at this game, leading to those games. */}
          <IpCell say={say} ip={championIp(champion)} />
          <td className="py-1.5 pr-3">
            <TierMark tier={champion.leader.tier} />
          </td>
          <td className="py-1.5 pr-3 font-mono tabular-nums">{champion.players}</td>
          <td className="py-1.5 pr-3 font-mono tabular-nums">
            {/*
              A count of games leads to those games. The standing rule, and
              this table was printing the one number on the page that is
              literally a pile of games as plain text.

              Rated games among people, which is what the ladder beside it is
              made of, so the address says both: a link that dropped either
              would open a wider set than the number it sits under.
            */}
            <GameCount
              count={champion.games}
              variant={variant}
              pool="people"
              rated="yes"
              title={say.say("players.champGamesTitle")}
              testId="champion-games"
            />
          </td>
        </>
      )}
    </tr>
  );
}

/**
 * Every game, with the player at the top of its ladder: the site's 名人,
 * the title Go and Shogi give the best player of one game. The players page
 * ranks everyone on one ladder whatever they played; this is the other
 * question, who is best at each game.
 */
export default async function ChampionsPage({ searchParams }: PageProps<"/champions">) {
  /*
   * TWO READINGS OF ONE TABLE, the simple one first. John, 2026-09-24, on
   * vint.ee's leaders page: "it's simple to read. I don't know if we have a
   * page that is as simple to read. but I like that." The simple view is that
   * page: one line a game, its leader and their rating (and XP, which every
   * table of players carries), each game leading to its own standings. The
   * full table, families and tiers and counts, is `?view=full`.
   */
  const say = await currentSpeaker();
  const full = (await searchParams).view === "full";
  const champions = await fetchChampions(await currentTestModeReader());
  return (
    <Page>
      <SiteHeader />
      {/*
        A TAB OF PLAYERS, drawn as one: the same heading and strip as /players,
        with Champions open. John, 2026-09-25: "Champions is a direct descendant
        of [Players]… yet there is no tab or link to view the Champs".
      */}
      <PageTitle title={say.say("nav.players")} kanji="対局者" />
      <Tabs tabs={PLAYERS_TABS} active="champions" base="/players" label={say.say("players.tabsLabel")} />
      <section className={`${PANEL_CLASS} flex flex-col gap-4`} data-testid="champions">
        <p className="text-sm text-muted">
          {weave(say.say("players.champLead"), {
            link: (
              <Link href="/players/ladder" className="underline underline-offset-4">
                {say.say("players.ladderWord")}
              </Link>
            ),
          })}
        </p>
        {/* Two ways to read the same table: tabs, as every choice of what a page lists is (`ViewTabs`). */}
        <ViewTabs
          label={say.say("players.champViews")}
          testId="champions-views"
          items={(["simple", "full"] as const).map((view) => ({
            key: view,
            href: view === "full" ? "/champions?view=full" : "/champions",
            current: (view === "full") === full,
            testId: `champions-view-${view}`,
            label: say.say(view === "full" ? "players.viewFull" : "players.viewSimple"),
          }))}
        />
        {full ? null : <SimpleChampions champions={champions} />}
        {/* Six columns of record. Unwrapped, this made /champions 570 pixels wide on a 390-pixel phone. */}
        {full ? (
        <div className={TABLE_SCROLL}>
          <table className="w-full text-sm">
            <thead className={HEAD_CLASS}>
              <tr>
                <th className="py-1 pr-3">{say.say("players.colGame")}</th>
                <th className="py-1 pr-3">{say.say("players.colChampion")}</th>
                <th className="py-1 pr-3">{say.say("players.colRating")}</th>
                {/* Directly after Rating, where John put it on every stats table. */}
                <th className="py-1 pr-3" title={say.say("points.board.xpTitle", { site: SITE_NAME })}>
                  {say.say("players.colXp")}
                </th>
                <th className="py-1 pr-3" title={ipHeadTitle(say)}>
                  IP
                </th>
                <th className="py-1 pr-3">{say.say("players.colTier")}</th>
                <th className="py-1 pr-3">{say.say("players.colPlayers")}</th>
                <th className="py-1 pr-3">{say.say("players.colGames")}</th>
              </tr>
            </thead>
            {/* The families with a ladder: a puzzle has no champion, so Numbers is not a row here. */}
            {GAME_FAMILIES.filter((family) => boardGamesOf(family).length > 0).map((family) => (
              <tbody key={family.title} data-testid="champions-family">
                <tr>
                  <th colSpan={8} className="pt-5 pb-1 text-left text-base font-semibold">
                    <Paired en={family.title} kanji={family.kanji} kanjiClassName="text-sm font-normal opacity-70" />
                  </th>
                </tr>
                {boardGamesOf(family).map((variant) => (
                  <ChampionRow key={variant} variant={variant} champion={champions.get(variant)} say={say} />
                ))}
              </tbody>
            ))}
          </table>
        </div>
        ) : null}
      </section>
    </Page>
  );
}
