import Link from "next/link";

import { BuddyButton } from "@/components/mine/BuddyButton";
import { ChallengeButton } from "@/components/mine/ChallengeButton";
import { CountryMark } from "@/components/players/CountryMark";
import { MemberKindBadge } from "@/components/auth/MemberKindBadge";
import { memberKind } from "@/lib/auth/memberKind";
import { DirectoryFilters } from "@/components/players/DirectoryFilters";
import { IgnoreButton } from "@/components/mine/IgnoreButton";
import { RecencyMark } from "@/components/mine/Recency";
import { RowActions } from "@/components/ui/Controls";
import { buddyEmails } from "@/lib/social/buddies";
import { currentSession } from "@/lib/auth/currentSession";
import { fetchComputerPlayers, fetchDirectory, fetchKeptRecords, type DirectoryEntry } from "@/lib/rating/players";
import { gamesPlayed, ratingShown } from "@/lib/rating/shownRecord";
import { fetchPlayedTallies } from "@/lib/history/playerRecord";
import type { PlayedTally } from "@/lib/history/playerRecord";
import { RECORD_SCOPES, scopeWorthAsking, type RecordScope } from "@/lib/rating/recordScope";
import { RecordScopeBar } from "./RecordScopeBar";
import { RecordTable, type RecordTableRow } from "./RecordTable";
import { filterDirectory, type DirectoryFilter } from "@/lib/rating/directoryFilter";
import { SHOW_EVERYBODY_HREF } from "@/lib/rating/rememberedFilter";
import { ignoredEmails } from "@/lib/social/ignores";
import { playerPath } from "@/lib/rating/playerKey";
import { recencyOf } from "@/lib/social/presence";
import { shownName } from "@/lib/rating/shownName";

/** How many of the most recently seen members the directory reads. */
const RECENT = 200;

/**
 * One member's row, worked out from their profile and what they played
 * elsewhere.
 *
 * This used to read the ladder columns alone, and a person whose games had all
 * been against the computer players came out as 0W 0L 0D with a dash for a
 * rating — while their own page, one click away, showed five games and a
 * rating of 1639. The columns were not wrong about the ladder; they were
 * answering a question nobody had asked them, and saying nothing about which.
 *
 * So the counts are every game played here, and the rating says which pool
 * earned it whenever it is not the ladder.
 *
 * THE COUNTS REACH FURTHER BACK THAN THIS SITE, which was the same fault one
 * step over. A kept record has a member row so the site can list them at all,
 * and this table read the Itsutsu columns alone — so Chibi, fourteen thousand
 * games on two sites before this one existed, appeared as somebody who had
 * never played. His own page said 14,606 the whole time.
 *
 * THE RATING DOES NOT REACH BACK, and that is the one column that must not.
 * Games and wins add up; ratings do not — another site's is on another scale,
 * against other players, and was never converted. So the rating column always
 * answers about Itsutsu whatever the counts beside it are counting.
 *
 * THE STREAK DOES NOT REACH BACK EITHER, for a stronger reason than the
 * rating's: a run is an ORDER, and a record copied down from another site is
 * four totals with no order in them at all. So it is the run over the games
 * finished HERE — every one of them, rated or not, which is exactly the set
 * `gamesPlayed` counts — and on a row carrying a kept record the cell says as
 * much in its own words, since `of.here` is false there.
 */
function directoryRow(
  entry: DirectoryEntry,
  scope: RecordScope,
  actions: ReturnType<typeof directoryActions>,
  /** This member's tally from `fetchPlayedTallies`, or undefined for nobody yet. */
  played: PlayedTally | undefined,
): RecordTableRow {
  /*
   * EVERY GAME PLAYED HERE, from the games table — not `entry.profile`, the
   * rating table, which only holds RATED games. That was 0.147.1's fix: Andrus
   * Meritalu had 36 finished games and this column said 1. This branch was cut
   * before it and re-threaded at the merge; the tally is the honest source.
   */
  const here = gamesPlayed(played);
  /*
   * Counting everywhere unless the reader has asked for this site alone. The
   * table led with the lifetime figure and offered no way to narrow it, while
   * the page one click away — a player's own — had offered exactly that choice
   * for two releases. Same question, same two answers, and the list could only
   * give one of them.
   */
  const everywhere = scope === RECORD_SCOPES.everywhere;
  const elsewhere = entry.elsewhere;
  const record = everywhere
    ? {
        wins: here.wins + elsewhere.wins,
        losses: here.losses + elsewhere.losses,
        draws: here.draws + elsewhere.draws,
      }
    : here;
  // Only worth marking where the figure beside it actually reaches back.
  const kept = everywhere && elsewhere.wins + elsewhere.losses + elsewhere.draws > 0;
  const rating = ratingShown(entry.profile);
  return {
    key: entry.id,
    subject: (
      <span className="flex items-center gap-2">
        <RecencyMark recency={actions.recency(entry)} />
        {entry.picture ? (
          // eslint-disable-next-line @next/next/no-img-element -- a Google avatar
          <img src={entry.picture} alt="" className="size-5 rounded-full" referrerPolicy="no-referrer" />
        ) : null}
        {entry.name.trim() !== "" ? (
          <Link
            href={playerPath(entry.name, entry.id)}
            className="underline-offset-2 hover:underline"
            data-testid="directory-name"
          >
            {shownName(entry.name)}
          </Link>
        ) : (
          entry.email
        )}
        {/* Where they are, which is most of why they answer at four in the morning. */}
        <CountryMark country={entry.country} className="text-sm" />
        {/*
          Which sort of member this is, drawn on the unusual rows only — the
          badge the operator's list has used all along, rather than a second
          one invented here. It earns its place now that the default shows
          programs alongside people: a reader should never have to work out
          which of the names is a program.
        */}
        <MemberKindBadge
          kind={memberKind({
            email: entry.email,
            botTier: entry.botTier,
            unclaimableBecause: entry.unclaimableBecause,
          })}
        />
      </span>
    ),
    record,
    /*
     * Every game here, both pools, which is what `here` adds up. A
     * row carrying a kept record is counting games this site never saw, so it
     * links nowhere: there is nothing here to open, and a link that showed the
     * Itsutsu half under a total that includes another site would be quietly
     * wrong about which games it meant.
     */
    /*
     * Every game here, both pools, rated or not — which is what `here` now adds
     * up. `rated` is deliberately unset: "yes" would open a shorter list than
     * the number beside it promised. A kept record links nowhere (see below).
     */
    of: { player: entry.name, here: !kept },
    /*
     * THE RUN OVER EVERY GAME, which is the set this row's count is over —
     * and it exists because this cell showed a dash until it did.
     *
     * The three runs on the rating row are `people`, `computer` and `rated`,
     * and all three count RATED games; the count here counts every finished
     * game. So a rated run printed here would have been described by the cell
     * — which words its scope from the same `of` the counts link by — as a run
     * over every game, which it was not. The answer was a fourth scope rather
     * than a plausible number: `Member.playedStreakKind`, kept by
     * `recordPlayed` wherever a game is decided, read off the row
     * `fetchDirectory` was fetching anyway.
     *
     * It matches the count to the game, by construction: both are keyed by
     * member id and both count a game against yourself once. Where `kept` is
     * true the count reaches beyond this site and the run cannot — a run is an
     * ORDER, and another site's record is four totals — which is why the cell
     * is handed `here: false` above and says so in its own words.
     */
    streak: entry.playedStreak,
    rating,
    joined: { at: entry.joinedAt, isNew: entry.isNew },
    note: kept ? (
      /*
       * Marked, because part of this number does not move.
       *
       * A profile page says it in a paragraph beside the figure; a table row
       * has nowhere to put one. Leaving it out because it does not fit would
       * be misleading by omission — which is precisely the fault the paragraph
       * was written to avoid — so the mark carries it, and the line under the
       * table says what the mark means.
       */
      <span
        className="ml-0.5 align-super text-[0.6rem] text-muted"
        title="Includes games from another site, copied down once and not updated since."
        data-testid="record-kept-mark"
      >
        ※
      </span>
    ) : null,
    actions: actions.forEntry(entry),
  };
}

/**
 * What the reader may do about each member, and how recently each was seen.
 *
 * Gathered once and handed to every row rather than looked up per row: it
 * reads the signed-in reader's buddies and ignores, which is two queries for
 * the whole list however long the list is.
 */
function directoryActions(
  me: { email?: string | null } | null,
  buddies: Set<string>,
  ignored: Set<string>,
  now: Date,
) {
  return {
    recency: (entry: DirectoryEntry) => recencyOf(new Date(entry.lastSeenAt), now),
    forEntry: (entry: DirectoryEntry) => {
      if (!me?.email || entry.email === null || me.email === entry.email) return null;
      const email = entry.email;
      return (
        <RowActions>
          <BuddyButton email={email} isBuddy={buddies.has(email)} />
          <IgnoreButton email={email} ignoring={ignored.has(email)} />
          {/*
            By id, and to the setup screen rather than into a game. A directory
            row is the most likely place for an accidental press on this whole
            site — the button sits at the end of every line of a long list — and
            it used to create a game of Gomoku on the spot.
          */}
          <ChallengeButton memberId={entry.id} />
        </RowActions>
      );
    },
  };
}

/**
 * The members, most recently seen first, with the record each name has
 * earned, and the bar that narrows them.
 *
 * Fetches its own rows rather than being handed them: it is the only section
 * that needs any of this, and a page that reads the directory in order to
 * render a ladder is a page that pays for four sections to show one.
 */
export async function Directory({
  filter,
  scope,
  query,
  now,
}: {
  filter: DirectoryFilter;
  scope: RecordScope;
  /** The address as it stands, so choosing a scope keeps the narrowing. */
  query: string;
  now: Date;
}) {
  const [directory, computers, kept, me] = await Promise.all([
    fetchDirectory(RECENT),
    fetchComputerPlayers(),
    fetchKeptRecords(),
    currentSession(),
  ]);
  /*
   * Everybody the directory could show, before it is narrowed.
   *
   * The programs are fetched on their own rather than picked out of the
   * directory, which is ordered by who was seen last — a computer player is
   * never seen, so past two hundred members every one of them fell off the
   * end and this page stopped offering any computer opponent at all.
   *
   * The kept records are fetched on their own for exactly the same reason, and
   * that reason was written here about the programs alone for weeks. Somebody
   * remembered on this site never signs in either: their stamp is frozen at
   * the moment their row was written, so they sink as the site fills and
   * vanish off the end of the page that exists to remember them. It has not
   * happened yet only because there are fifteen members.
   */
  const seen = new Set(directory.map((entry) => entry.id));
  const extra = [...computers, ...kept].filter((one) => !seen.has(one.id));
  const everybody = [...directory, ...extra];
  const people = filterDirectory(everybody, filter, now.getTime());
  const [buddies, ignored, tallies] = await Promise.all([
    me?.email ? buddyEmails(me.email) : Promise.resolve(new Set<string>()),
    me?.email ? ignoredEmails(me.email) : Promise.resolve(new Set<string>()),
    // Every row's played count in ONE query, however many rows — the shape
    // 0.139.0 set for the landing page: a table of many must not cost one per row.
    fetchPlayedTallies(everybody.map((entry) => entry.id)),
  ]);
  const actions = directoryActions(me, buddies, ignored, now);
  const anyKept = people.some(
    (entry) => entry.elsewhere.wins + entry.elsewhere.losses + entry.elsewhere.draws > 0,
  );

  return (
    <div className="flex flex-col gap-4" data-testid="directory-section">
      <p className="text-sm text-muted">
        The members, most recently seen first, with the record their name has earned. New members
        are marked for two weeks; challenge one, and the game is in their list the moment you
        start it.
      </p>
      <DirectoryFilters filter={filter} shown={people.length} total={everybody.length} />
      {/*
        Drawn only where it can change an answer — the same rule a player's own
        page keeps. With nobody on this list carrying a record from anywhere
        else, the two scopes are the same games, and a control that cannot
        change anything is furniture that also promises a chapter which is not
        there.
      */}
      {scopeWorthAsking(anyKept ? 2 : 1) ? (
        <RecordScopeBar
          base="/players"
          query={query}
          scope={scope}
          label="How much of these records to count"
        />
      ) : null}
      {/*
        NO SORTABLE HEADINGS HERE, AND THAT IS A DECISION RATHER THAN AN
        OMISSION — said in the source so it cannot be mistaken for one.
        `RecordTable` takes a `sort` and the ladder beside this one passes it;
        this table does not, for two reasons that both have to be fixed before
        it could.

        THE ROWS ARE A COMPOSITE OF FOUR READS. `fetchDirectory` gives the two
        hundred most recently seen members; the programs and the kept records
        are fetched separately, because a computer player is never "seen" and
        somebody remembered here never signs in, so both fall off the end of any
        recency order (see `fetchComputerPlayers`). `filterDirectory` then
        narrows the three in memory. There is no single query whose `orderBy`
        this table is drawn from, so there is nothing for a sort parameter to
        reach.

        AND THE COLUMNS ARE NOT ON THE ROW ANYWAY. Played, W, L and D come from
        `fetchPlayedTallies`, a groupBy over the GAMES table keyed by member id;
        the rating comes from `Player`. Ordering members by a figure held in two
        other tables is a join this read does not make.

        The obvious shortcut is the one thing that must not be done: sorting the
        assembled array in the browser. It would look identical to the ladder's
        headings and mean something else — "the best rated of the two hundred
        most recently seen", which is not the best rated, and the two hundred is
        a cap a reader cannot see. A heading that answers a narrower question
        than it appears to is the fault this whole convention exists to remove,
        wearing a control.

        What would make it possible: one query over `Member` joined to `Player`
        and to a games tally, with the programs and the kept records brought in
        by that query rather than beside it. That is a rewrite of
        `rating/players.ts`, not a prop.
      */}
      <RecordTable
        subject="Member"
        rows={people.map((entry) => directoryRow(entry, scope, actions, tallies.get(entry.id)))}
        columns={{ joined: true, actions: "" }}
        testId="directory"
        empty={
          /*
           * No testid of its own: `RecordTable` already wraps whatever `empty`
           * renders in a `<td data-testid="directory-empty">` — the id this
           * span duplicated from before the tables were unified, when
           * Directory drew its own empty row and needed one. Two elements
           * answering to the same test id is a strict-mode violation waiting
           * to happen, so the outer one is the only one that keeps it now.
           */
          <span>
            Nobody here answers to all of that.{" "}
            {/*
              Says "everyone" out loud rather than pointing at the bare page.
              Now that /players means "however I last asked for it", a way back
              that went there would re-apply the very narrowing it offers to
              remove, and appear to do nothing at all.
            */}
            <Link href={SHOW_EVERYBODY_HREF} className="underline underline-offset-4" data-testid="directory-clear">
              Show everybody again
            </Link>
            .
          </span>
        }
        /*
          What the mark means, said once under the table rather than repeated
          in every row that carries it. Drawn only when a row on this screen
          actually has one: a legend for a mark nobody can see is furniture.
        */
        caption={
          anyKept ? (
            <p className="text-xs leading-snug text-muted" data-testid="directory-kept-note">
              <span className="align-super text-[0.6rem]">※</span> Counts games from before Itsutsu, on
              the sites named on that player&rsquo;s own page.{" "}
              <span className="font-medium text-ink-soft">Those figures do not update</span> — they were
              copied down by hand once and are a snapshot of that day. Only what happens here is counted
              as it happens; the rating and the streak are always Itsutsu&rsquo;s alone.
            </p>
          ) : null
        }
      />
    </div>
  );
}
