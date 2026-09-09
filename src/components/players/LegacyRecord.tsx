import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Tabs } from "@/components/ui/Tabs";
import { WholeRecordPanel } from "./WholeRecord";
import { wholeRecord } from "@/lib/legacy/wholeRecord";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import type { PlayerRecord } from "@/lib/history/playerRecord";
import type { TimeGiftRecord } from "@/lib/history/timeGifts";
import { ITSUTSU_TAB, legacyTabs, tabFor } from "@/lib/legacy/legacyTabs";
import type { LegacyPlayer, LegacySource } from "@/lib/legacy/legacyPlayers.types";
import { activeTab, type Tab } from "@/lib/ui/tabs";
import { ItsutsuRecord } from "./ItsutsuRecord";
import { LegacySourcePanel } from "./LegacySource";

/**
 * A record kept from somewhere else.
 *
 * Some of the people on this site played for years before it existed, on
 * ItsYourTurn and GoldToken, and some of them are not here to play again.
 * What was kept of that is shown the way it was kept: their totals, the games
 * they played, the comments they left, and the head-to-head records worth
 * remembering. It reads as a record rather than a profile, because that is
 * what it is — nobody can add to it now.
 *
 * One person is one page, and each site they played on is a tab of it. Chibi
 * played on two sites for nineteen years between them, which is several
 * thousand games and two dozen tables; stacked in a column it was a page
 * nobody would reach the bottom of.
 */

const LEGACY_OWN_PAGE_COPY: Record<"remembered" | "honorary", { badge: string; tail: string; here: string }> = {
  remembered: {
    badge: "Remembered",
    tail: "Never played on Itsutsu \u2014 this record is kept, not earned here.",
    // Not "no games yet". There will not be any, and saying "yet" of somebody
    // who has died is the wrong word in the one place it would be noticed.
    here: "No games on Itsutsu. This record was made elsewhere, before this site existed, and is kept rather than added to.",
  },
  honorary: {
    badge: "Honorary member",
    tail: "Never played on Itsutsu \u2014 kept here as an honorary member, in her own right.",
    here: "No games on Itsutsu. An honorary member has a record here without having played for it \u2014 should she ever take a seat, this is where those games would appear.",
  },
};

/**
 * How a person is described where they played: the handle, the site, and the
 * years, in one clause per site.
 */
function playedAs(legacy: LegacyPlayer, source: LegacySource) {
  return (
    <>
      <span className="font-medium text-ink-soft">{source.handle ?? legacy.name}</span> on{" "}
      <span className="font-medium text-ink-soft">{source.site}</span>
      {source.joined !== undefined && source.lastActive !== undefined
        ? `, ${source.joined} to ${source.lastActive}`
        : null}
    </>
  );
}

/**
 * The one sentence naming every site somebody played on.
 *
 * It stays out of the tabs on purpose: a reader looking at the GoldToken tab
 * should still be able to see, without moving, that there is an ItsYourTurn
 * chapter too. The tabs say where to go; this says what there is.
 */
export function PlayedEverywhere({ legacy, lead }: { legacy: LegacyPlayer; lead: string }) {
  return (
    <>
      {lead}{" "}
      {legacy.sources.map((source, index) => (
        <span key={source.site}>
          {index > 0 ? (index === legacy.sources.length - 1 ? ", and as " : ", as ") : ""}
          {playedAs(legacy, source)}
        </span>
      ))}
    </>
  );
}

/**
 * A legacy record with its own address — nobody here plays under this name.
 *
 * The sites they played on come first and this site comes last, which is both
 * the honest order for a record made elsewhere and the one that opens the
 * page on its substance. Itsutsu is a tab even for somebody who never played
 * here and never will: a page whose tabs depend on a count being zero looks
 * like a different kind of page to the reader, and what this site holds of
 * them is worth saying rather than leaving out.
 */
export function LegacyOwnPage({
  legacy,
  view,
  here,
  base,
}: {
  legacy: LegacyPlayer;
  view?: string | string[];
  /** What this site holds of them, which for a kept record is usually nothing. */
  here: { record: PlayerRecord; gifts: TimeGiftRecord };
  /**
   * The address this page is being served at, which is not always the
   * record's own slug: a folded record is shown at the live member's address
   * instead. Tabs are links, so they have to be built from where the reader
   * actually is, or the first tab click bounces them through a redirect.
   */
  base?: string;
}) {
  const copy = legacy.kind === "elsewhere" ? null : LEGACY_OWN_PAGE_COPY[legacy.kind];
  const whole = wholeRecord([legacy], {
    won: here.record.wins,
    lost: here.record.losses,
    drawn: here.record.draws,
  });
  const sources = legacyTabs([legacy]);
  const tabs: Tab[] = [...sources, ITSUTSU_TAB];
  const open = activeTab(tabs, view);
  const shown = open === ITSUTSU_TAB.key ? null : tabFor(sources, open);
  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />
      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="legacy-player">
        <span className="w-fit rounded-full border border-rule-strong bg-ivory px-2.5 py-0.5 text-[0.68rem] font-semibold tracking-[0.1em] text-muted uppercase">
          {copy?.badge ?? "Record elsewhere"}
        </span>
        <h1 className="text-lg font-semibold">{legacy.name}</h1>
        <p className="text-sm text-muted">
          {legacy.location !== undefined ? `${legacy.location} · ` : ""}
          <PlayedEverywhere legacy={legacy} lead="Played as" />.{" "}
          {copy?.tail ?? "From before Itsutsu — kept alongside whatever they've since earned here."}
        </p>
      </section>

      {/*
        Everything they played, added across every site and this one — beside
        the tabs below rather than instead of them. This is the page where it
        matters most: a kept record is nearly all of somebody's playing, and
        the tabs alone never show the whole of it in one number.
      */}
      {whole.figures.played > 0 ? (
        <section className={`${PANEL_CLASS} flex flex-col gap-4`}>
          <WholeRecordPanel whole={whole} />
        </section>
      ) : null}

      <Tabs
        tabs={tabs}
        active={open}
        base={base ?? `/players/${legacy.slug}`}
        label="Where this record was kept"
      />
      {shown === null ? (
        <ItsutsuRecord record={here.record} gifts={here.gifts} emptyNote={copy?.here} />
      ) : (
        <LegacySourcePanel legacy={shown.legacy} source={shown.source} keptFor={shown.legacy.slug} />
      )}
    </Page>
  );
}
