import { notFound } from "next/navigation";
import { ComputerPlayers } from "@/components/players/ComputerPlayers";
import { BuddyList } from "@/components/players/BuddyList";
import { Directory } from "@/components/players/Directory";
import { HereNow } from "@/components/players/HereNow";
import { Ladder } from "@/components/players/Ladder";
import { LegacyRoll } from "@/components/players/LegacyRoll";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Tabs } from "@/components/ui/Tabs";
import { ensureBotMembers } from "@/lib/bots/botMembers";
import { currentReader } from "@/lib/auth/currentReader";
import { directoryFilterFor } from "@/lib/rating/memberFilter";
import { fetchComputerPlayers } from "@/lib/rating/directoryRows";
import { keptRecordStars, type KeptRecordStar } from "@/lib/social/keptRecordStars";
import { readRecordScope, SCOPE_PARAM } from "@/lib/rating/recordScope";
import { openTabOf, TAB_FROM_PATH } from "@/lib/ui/tabs";
import { titleWithKanji } from "@/components/games/pageTitles";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { PLAYERS_TABS as TABS, PLAYERS_OWN_TABS } from "./players.tabs";

/** Everything the address already says, as a query string. */
function addressOf(asked: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(asked)) {
    // The tab is the path (`/players/ladder`), never part of the query a heading or a page carries on.
    if (key === TAB_FROM_PATH) continue;
    if (typeof value === "string" && value !== "") params.set(key, value);
  }
  return params.toString();
}

export async function generateMetadata() {
  return { title: titleWithKanji(await currentSpeaker(), "nav.players", "対局者") };
}

// The tables are read from the database on every request, never at build time.
export const dynamic = "force-dynamic";


/** The computer players' own tab, which is the only place that needs their rows. */
async function ComputerTab() {
  return <ComputerPlayers entries={await fetchComputerPlayers()} />;
}

/**
 * The players. There are no accounts, so a name is a player: whoever plays as
 * a name plays for its record, which the page says plainly.
 *
 * Each tab fetches what it alone needs. The page used to read the directory,
 * the ladder, the computer players and the session on every request whichever
 * section was being looked at, which is four queries to render one table.
 */
export default async function PlayersPage({ searchParams }: PageProps<"/players">) {
  const say = await currentSpeaker();
  const now = new Date();
  const asked = await searchParams;
  const open = openTabOf(PLAYERS_OWN_TABS, asked);
  if (open === null) notFound();
  /*
   * How this reader likes the directory narrowed, and whether the kind of
   * player came from their account — asked for only inside the tab that shows
   * it, so a visit to another tab remembers nothing. It rides the member read
   * this page makes anyway, so it costs no query.
   */
  const shown = open === "members" ? await directoryFilterFor(asked) : null;
  /* Who is reading, asked for only by the tab that needs it. */
  const reader = open === "buddies" ? await currentReader() : { memberId: null };
  // The star beside each kept record: every member can be kept as a buddy.
  const stars = open === "honors" ? await keptRecordStars(await currentReader()) : new Map<string, KeptRecordStar>();
  /*
   * The computer players' rows are written the first time anybody needs them,
   * and until this page did nothing anybody visits needed them — so they
   * existed in the code and not in the database, and the directory that is
   * supposed to list them had nothing to list. One throttled upsert every
   * five minutes, and it runs whichever tab is open because every one of them
   * either lists a program or counts one.
   */
  await ensureBotMembers();

  /*
   * WIDE, AND NOT A BOARD — the two are separate questions since this page
   * needed the first without the second; see `Page`.
   *
   * The members list is ten columns: a name with a flag and a badge, played,
   * W, L, D, win rate, streak, rating, joined, and three controls. Measured,
   * it wants 1,051 pixels, and a `standard` column gave its table a box of
   * 990 — so the end of the actions column sat 61 pixels past the edge and
   * "Challenge" was cut off at every desktop width, reachable only by
   * scrolling the table sideways. That was the price of rows that are all the
   * same height, and it is not a price worth paying on the page it shows up
   * on. `wide` gives the table 1,118 and it fits.
   *
   * A narrow screen still scrolls the table in its own box, which is what it
   * did before and what AGENTS.md asks of wide content. What has gone is the
   * scroll at the widths where there was room all along.
   */
  return (
    <Page>
      <SiteHeader />
      <PageTitle title={say.say("nav.players")} kanji="対局者" />

      {/* Above the tabs, not behind one: it is the only thing here that answers
          "can I get a game this minute", and it is three lines whoever is in. */}
      <HereNow now={now} />

      <Tabs tabs={TABS} active={open} base="/players" label={say.say("players.tabsLabel")} />

      <section className={`${PANEL_CLASS} flex flex-col gap-4`} data-testid="players-panel">
        {shown !== null ? (
          <Directory
            filter={shown.filter}
            rememberedWho={shown.rememberedWho}
            scope={readRecordScope(asked[SCOPE_PARAM])}
            /*
              The address as it stands, so choosing how much to count keeps
              whatever narrowing is already on it. The two questions are
              independent and answering one must never quietly answer the
              other — the same rule a player's own page keeps about its tabs.
            */
            query={addressOf(asked)}
            now={now}
          />
        ) : null}
        {/*
          The address as it stands, so a heading's press keeps the tab it is
          inside and anything else on the query. A sort that dropped `view`
          would send a reader who pressed Rating back to the Members tab.
        */}
        {/*
          A buddy list belongs to a reader, so a visitor with no account is told
          what it is rather than shown an empty one — the same answer the ladder
          gives somebody who has played nothing.
        */}
        {open === "buddies" ? (
          reader.memberId === null ? (
            <p className="text-sm text-muted" data-testid="buddies-need-account">
              {say.say("players.buddiesNeedAccount")}
            </p>
          ) : (
            <BuddyList memberId={reader.memberId} />
          )
        ) : null}
        {open === "ladder" ? <Ladder query={addressOf(asked)} /> : null}
        {open === "bots" ? <ComputerTab /> : null}
        {open === "honors" ? (
          <div className="flex flex-col gap-3" data-testid="remembered-section">
            <p className="text-sm text-muted">{say.say("players.honorsLead")}</p>
            <LegacyRoll kind="remembered" label={say.say("players.rollRemembered")} kanji="偲ぶ" stars={stars} />
            <LegacyRoll kind="honorary" label={say.say("players.rollHonorary")} kanji="名誉会員" stars={stars} />
          </div>
        ) : null}
      </section>
    </Page>
  );
}
