import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Tabs } from "@/components/ui/Tabs";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { legacyTabs, tabFor } from "@/lib/legacy/legacyTabs";
import type { LegacyPlayer, LegacySource } from "@/lib/legacy/legacyPlayers.types";
import { activeTab } from "@/lib/ui/tabs";
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

const LEGACY_OWN_PAGE_COPY: Record<"remembered" | "honorary", { badge: string; tail: string }> = {
  remembered: { badge: "Remembered", tail: "Never played on Itsutsu — this record is kept, not earned here." },
  honorary: {
    badge: "Honorary member",
    tail: "Never played on Itsutsu — kept here as an honorary member, in her own right.",
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

/** A legacy record with its own address — nobody here plays under this name. */
export function LegacyOwnPage({ legacy, view }: { legacy: LegacyPlayer; view?: string | string[] }) {
  const copy = legacy.kind === "elsewhere" ? null : LEGACY_OWN_PAGE_COPY[legacy.kind];
  const tabs = legacyTabs([legacy]);
  const open = activeTab(tabs, view);
  const shown = tabFor(tabs, open);
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
      <Tabs tabs={tabs} active={open} base={`/players/${legacy.slug}`} label="Where this record was kept" />
      {shown !== null ? (
        <LegacySourcePanel legacy={shown.legacy} source={shown.source} keptFor={shown.legacy.slug} />
      ) : null}
    </Page>
  );
}
