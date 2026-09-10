import { cookies } from "next/headers";

import { ComputerPlayers } from "@/components/players/ComputerPlayers";
import { Directory } from "@/components/players/Directory";
import { HereNow } from "@/components/players/HereNow";
import { Ladder } from "@/components/players/Ladder";
import { LegacyRoll } from "@/components/players/LegacyRoll";
import { Page } from "@/components/layout/Page";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Tabs } from "@/components/ui/Tabs";
import { ensureBotMembers } from "@/lib/bots/botMembers";
import { fetchComputerPlayers } from "@/lib/rating/players";
import { DIRECTORY_FILTER_COOKIE, filterFor } from "@/lib/rating/rememberedFilter";
import { readRecordScope, SCOPE_PARAM } from "@/lib/rating/recordScope";
import { activeTab, type Tab } from "@/lib/ui/tabs";

/** Everything the address already says, as a query string. */
function addressOf(asked: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(asked)) {
    if (typeof value === "string" && value !== "") params.set(key, value);
  }
  return params.toString();
}

export const metadata = { title: "Players" };

// The tables are read from the database on every request, never at build time.
export const dynamic = "force-dynamic";

/*
 * Four lists that happen to be about players, so the page shows one at a
 * time. They were four headings stacked down one page — a directory of two
 * hundred, a ladder of fifty, the computer players and the kept records — and
 * the ladder was three screens below the fold on the day it was added.
 *
 * The members come first, so /players with nothing appended is still the list
 * of people it has always been, and a filtered directory is still an address
 * with no `view` on it.
 */
const TABS: Tab[] = [
  { key: "members", label: "Members", kanji: "会員" },
  { key: "ladder", label: "Ladder", kanji: "番付" },
  { key: "computers", label: "Computers", kanji: "機械" },
  { key: "remembered", label: "Remembered", kanji: "偲ぶ" },
];

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
  const now = new Date();
  const asked = await searchParams;
  const open = activeTab(TABS, asked.view);
  /*
   * How this reader last asked for the directory to be narrowed, if they ever
   * did. Read here and written by `proxy.ts`, because a Server Component can
   * read a cookie while it renders and cannot set one.
   */
  const remembered = (await cookies()).get(DIRECTORY_FILTER_COOKIE)?.value;
  /*
   * The computer players' rows are written the first time anybody needs them,
   * and until this page did nothing anybody visits needed them — so they
   * existed in the code and not in the database, and the directory that is
   * supposed to list them had nothing to list. One throttled upsert every
   * five minutes, and it runs whichever tab is open because every one of them
   * either lists a program or counts one.
   */
  await ensureBotMembers();

  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />
      <section className={`${PANEL_CLASS} flex flex-col gap-4`}>
        <h1 className="flex items-baseline gap-2 text-lg font-semibold">
          Players <span className="font-mincho text-sm font-normal opacity-70">対局者</span>
        </h1>

        {/* Above the tabs, not behind one: it is the only thing here that answers
            "can I get a game this minute", and it is three lines whoever is in. */}
        <HereNow now={now} />

        <Tabs tabs={TABS} active={open} base="/players" label="Which players to look at" />

        {open === "members" ? (
          <Directory
            filter={filterFor(asked, remembered)}
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
        {open === "ladder" ? <Ladder /> : null}
        {open === "computers" ? <ComputerTab /> : null}
        {open === "remembered" ? (
          <div className="flex flex-col gap-3" data-testid="remembered-section">
            <p className="text-sm text-muted">
              Players who never came here, whose record from elsewhere is kept under their name.
              A kept record has nobody on the other end of it: there is nothing to challenge,
              and nothing that can be played for.
            </p>
            <LegacyRoll kind="remembered" label="Remembered" kanji="偲ぶ" />
            <LegacyRoll kind="honorary" label="Honorary members" kanji="名誉会員" />
          </div>
        ) : null}
      </section>
    </Page>
  );
}
