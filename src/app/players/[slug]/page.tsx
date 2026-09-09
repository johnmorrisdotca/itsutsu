import { notFound, redirect } from "next/navigation";

import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CountryMark } from "@/components/players/CountryMark";
import { Whereabouts } from "@/components/players/Whereabouts";
import { ItsutsuRecord } from "@/components/players/ItsutsuRecord";
import { LegacyOwnPage, PlayedEverywhere } from "@/components/players/LegacyRecord";
import { LegacySourcePanel } from "@/components/players/LegacySource";
import { Figures } from "@/components/ui/Figures";
import { Tabs } from "@/components/ui/Tabs";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { findMemberByName } from "@/lib/auth/members";
import { fetchPlayerRecord } from "@/lib/history/playerRecord";
import { fetchTimeGiftRecord } from "@/lib/history/timeGifts";
import { findLegacyPlayer, findLinkedLegacies, foldedInto } from "@/lib/legacy/legacyPlayers.data";
import { ITSUTSU_TAB, legacyTabs } from "@/lib/legacy/legacyTabs";
import { TIER_DISPLAY } from "@/lib/rating/elo";
import { countText, figuresOf, recordText, winRateText } from "@/lib/rating/figures";
import { playerKey, playerKeysFromSlug } from "@/lib/rating/playerKey";
import { fetchPlayer } from "@/lib/rating/players";
import { activeTab, type Tab } from "@/lib/ui/tabs";

export const metadata = { title: "Player" };

/**
 * What this site itself holds of somebody, by the name they are known by.
 *
 * Every player page asks for it, including a kept record's — Chibi and
 * Kyokosan are members here now, so the honest answer is a real query rather
 * than an assumption that it is empty. Today it is empty for both.
 */
async function recordHere(name: string) {
  const [record, gifts] = await Promise.all([fetchPlayerRecord(name), fetchTimeGiftRecord(name)]);
  return { record, gifts };
}

export default async function PlayerPage({ params, searchParams }: PageProps<"/players/[slug]">) {
  const { slug } = await params;
  const view = (await searchParams).view;

  const legacyBySlug = findLegacyPlayer(slug);
  /*
   * A folded record has no page of its own — one person, one page. Its
   * contents are not gone: they are a tab on the live member's page, which is
   * where this sends anybody who still has the old address, rather than
   * leaving them at a second page with the same name at the top of it.
   */
  if (legacyBySlug !== null) {
    const home = foldedInto(legacyBySlug);
    if (home !== null) redirect(home);
  }
  if (legacyBySlug !== null && legacyBySlug.kind !== "elsewhere") {
    return (
      <LegacyOwnPage
        legacy={legacyBySlug}
        view={view}
        base={`/players/${slug}`}
        here={await recordHere(legacyBySlug.name)}
      />
    );
  }

  /*
   * The address holds a folded name with hyphens for spaces, and folding
   * cannot be undone: "anne-marie" is either one hyphenated name or two
   * words. So both readings are looked for, and whichever finds somebody is
   * the player this address means.
   */
  const looked = await Promise.all(
    playerKeysFromSlug(slug).map(async (key) => {
      const [player, record, member] = await Promise.all([
        fetchPlayer(key),
        fetchPlayerRecord(key),
        findMemberByName(key),
      ]);
      return { key, player, record, member };
    }),
  );
  const found =
    looked.find((one) => one.player !== null || one.record.games > 0 || one.member !== null) ?? looked[0];
  const { key: decoded, player, record, member } = found;
  const gifts = await fetchTimeGiftRecord(decoded);
  // A member has a page from the day they join, before they have finished a
  // game: every list that prints their name links to it, and a link that
  // leads nowhere is worse than no page.
  const hasLiveData = player !== null || record.games > 0 || member !== null;
  const linkedByKey = findLinkedLegacies(playerKey(decoded));
  const linked = linkedByKey.length > 0 ? linkedByKey : hasLiveData || legacyBySlug === null ? [] : [legacyBySlug];

  if (!hasLiveData && linked.length === 0) notFound();
  if (!hasLiveData && linked.length > 0) {
    return <LegacyOwnPage legacy={linked[0]} view={view} base={`/players/${slug}`} here={{ record, gifts }} />;
  }

  const tier = player === null ? null : TIER_DISPLAY[player.tier];
  const figures = figuresOf({ won: record.wins, lost: record.losses, drawn: record.draws });

  /*
   * One tab for this site and one for each site somebody played on before it.
   * Where a member has no earlier record there is only the one, and the strip
   * does not draw itself at all — a page with a single tab is just a page.
   */
  const elsewhere = legacyTabs(linked);
  const tabs: Tab[] = [ITSUTSU_TAB, ...elsewhere];
  const open = activeTab(tabs, view);
  const shown = elsewhere.find((tab) => tab.key === open) ?? null;

  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />
      <section className={`${PANEL_CLASS} flex flex-col gap-4`} data-testid="player-profile">
        <h1 className="flex items-baseline gap-2 text-lg font-semibold">
          {player?.name ?? member?.name ?? decoded}
          {/*
            Where they are, said in full here because there is room for it —
            the directory has only the flag. The profile form has promised
            this for a long time and never showed it anywhere.
          */}
          <CountryMark
            country={member?.country}
            className="text-sm font-normal text-muted"
            showName
          />
        </h1>
        <Whereabouts city={member?.city} timeZone={member?.timeZone} />
        {/*
          Two ratings, side by side, because there are two pools and hiding
          one behind the other is how a number stops meaning anything. The
          ladder rating is what somebody has earned against people; the
          computer one is earned against the three programs and never touches
          it, which is the whole point of keeping them apart.

          Played and the record beside them count every finished game, of
          either kind — including a game somebody played against themselves,
          which is a game that happened and is not a game that counts. The
          note under the row says so rather than leaving the arithmetic to be
          reverse-engineered.
        */}
        <Figures
          testId="player-figures"
          figures={[
            { label: "Rating", value: player?.rating ?? "—", testId: "player-rating" },
            ...(player !== null && player.computer.ratedGames > 0
              ? [{ label: "Vs computer", value: player.computer.rating, testId: "player-computer-rating" }]
              : []),
            { label: "Played", value: countText(figures.played) },
            { label: "Won · Lost · Drawn", value: recordText(figures), testId: "player-record" },
            { label: "Win rate", value: winRateText(figures.winRate) },
          ]}
        />
        {player !== null && player.computer.ratedGames > 0 ? (
          <p className="text-xs text-muted" data-testid="two-pools">
            Played and the record beside it count every finished game. The ratings are kept in two:{" "}
            <span className="font-medium text-ink-soft">{player.ratedGames}</span> against people, and{" "}
            <span className="font-medium text-ink-soft">{player.computer.ratedGames}</span> against the computer
            players. A game against a program never moves where you stand among the people, and a game against
            yourself counts as neither.
          </p>
        ) : null}
        {tier !== null ? (
          <p className="text-xs text-muted">
            <span className="font-medium text-ink-soft">{tier.label}</span>{" "}
            <span className="font-mincho">{tier.kanji}</span> · {tier.note}
          </p>
        ) : null}
        {linked.length > 0 ? (
          <p className="text-sm text-muted" data-testid="legacy-elsewhere">
            {linked.map((legacy) => (
              <PlayedEverywhere key={legacy.slug} legacy={legacy} lead="Also played as" />
            ))}
            . Kept from before Itsutsu, in its own tab.
          </p>
        ) : null}
      </section>

      <Tabs tabs={tabs} active={open} base={`/players/${slug}`} label="Where this player's record was kept" />

      {shown === null ? (
        <ItsutsuRecord record={record} gifts={gifts} />
      ) : (
        <LegacySourcePanel legacy={shown.legacy} source={shown.source} keptFor={shown.legacy.slug} />
      )}
    </Page>
  );
}
