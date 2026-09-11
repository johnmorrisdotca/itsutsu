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
import { RECORD_SCOPES, scopeWorthAsking, type RecordScope } from "@/lib/rating/recordScope";
import { RecordScopeBar } from "./RecordScopeBar";
import { RATING_POOLS } from "@/lib/rating/pools";
import { RecordCells, RecordHeadings } from "./PlayerRecord";
import { filterDirectory, type DirectoryFilter } from "@/lib/rating/directoryFilter";
import { SHOW_EVERYBODY_HREF } from "@/lib/rating/rememberedFilter";
import { ignoredEmails } from "@/lib/social/ignores";
import { playerPath } from "@/lib/rating/playerKey";
import { recencyOf } from "@/lib/social/presence";
import { shownName } from "@/lib/rating/shownName";

/** How many of the most recently seen members the directory reads. */
const RECENT = 200;

/**
 * The three counts and the rating, for a person who may play in either pool.
 *
 * This row used to read the ladder columns alone, and a person whose games had
 * all been against the computer players came out as 0W 0L 0D with a dash for a
 * rating — while their own page, one click away, showed five games and a
 * rating of 1639. The columns were not wrong about the ladder; they were
 * answering a question nobody had asked them, and saying nothing about which.
 *
 * So the counts are every game played here, and the rating says which pool
 * earned it whenever it is not the ladder. The list of computer players below
 * this one has marked its figures that way all along — it was only the people
 * who were left unmarked, which is why it read as a contradiction rather than
 * as a distinction.
 *
 * THE COUNTS NOW REACH FURTHER BACK THAN THIS SITE, which was the same fault
 * one step over. A kept record has a member row so the site can list them at
 * all, and this table read the Itsutsu columns alone — so Chibi, fourteen
 * thousand games on two sites before this one existed, appeared as somebody
 * who had never played. His own page said 14,606 the whole time.
 *
 * THE RATING DOES NOT REACH BACK, and that is the one column that must not.
 * Games and wins add up; ratings do not — another site's is on another scale,
 * against other players, and was never converted. So the rating column always
 * answers about Itsutsu whatever the counts beside it are counting. Chibi's
 * dash is a fact about Chibi, who never played here; it is not what a lifetime
 * view looks like. Somebody with a real rating here keeps showing it.
 */
function DirectoryRecord({
  name,
  profile,
  elsewhere,
  scope,
}: Pick<DirectoryEntry, "profile" | "elsewhere"> & { name: string; scope: RecordScope }) {
  const here = gamesPlayed(profile);
  /*
   * Counting everywhere unless the reader has asked for this site alone. The
   * table led with the lifetime figure and offered no way to narrow it, while
   * the page one click away — a player's own — had offered exactly that choice
   * for two releases. Same question, same two answers, and the list could only
   * give one of them.
   */
  const everywhere = scope === RECORD_SCOPES.everywhere;
  const played = everywhere
    ? {
        wins: here.wins + elsewhere.wins,
        losses: here.losses + elsewhere.losses,
        draws: here.draws + elsewhere.draws,
      }
    : { wins: here.wins, losses: here.losses, draws: here.draws };
  const rating = ratingShown(profile);
  // Only worth marking where the figure beside it actually reaches back.
  const kept = everywhere && elsewhere.wins + elsewhere.losses + elsewhere.draws > 0;
  return (
    <>
      <RecordCells
        record={played}
        /*
         * Rated games here, both pools, which is what `gamesPlayed` added up.
         * A row carrying a kept record is counting games this site never saw,
         * so it links nowhere: there is nothing here to open, and a link that
         * showed the Itsutsu half under a total that includes another site
         * would be quietly wrong about which games it meant.
         */
        of={{ player: name, rated: "yes", here: !kept }}
        note={
          kept ? (
            /*
             * Marked, because part of this number does not move.
             *
             * A profile page says it in a paragraph beside the figure; a table
             * row has nowhere to put one. Leaving it out because it does not
             * fit would be misleading by omission — which is precisely the
             * fault the paragraph was written to avoid — so the mark carries
             * it, and the line under the table says what the mark means.
             */
            <span
              className="ml-0.5 align-super text-[0.6rem] text-muted"
              title="Includes games from another site, copied down once and not updated since."
              data-testid="record-kept-mark"
            >
              ※
            </span>
          ) : null
        }
      />
      <td className="py-1.5 pr-3 font-mono tabular-nums" data-testid="directory-rating">
        {rating === null ? (
          "–"
        ) : (
          <>
            {rating.rating}
            {rating.pool === RATING_POOLS.computer ? (
              <span
                className="ml-1 font-mincho text-[0.68rem] font-normal opacity-70"
                title="Earned against the computer players, which are rated in a pool of their own."
                data-testid="rating-pool-computer"
              >
                機械
              </span>
            ) : null}
          </>
        )}
      </td>
    </>
  );
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
  const buddies = me?.email ? await buddyEmails(me.email) : new Set<string>();
  const ignored = me?.email ? await ignoredEmails(me.email) : new Set<string>();

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
      {scopeWorthAsking(people.some((one) => one.elsewhere.wins + one.elsewhere.losses + one.elsewhere.draws > 0) ? 2 : 1) ? (
        <RecordScopeBar
          base="/players"
          query={query}
          scope={scope}
          label="How much of these records to count"
        />
      ) : null}
      <table className="w-full text-sm" data-testid="directory">
        <thead className="text-left text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
          <tr>
            <th className="py-1 pr-3">Member</th>
            <RecordHeadings />
            <th className="py-1 pr-3">Rating</th>
            <th className="py-1 pr-3">Joined</th>
            <th className="py-1"></th>
            <th className="py-1"></th>
          </tr>
        </thead>
        <tbody>
          {people.length === 0 ? (
            <tr className="border-t border-rule">
              <td colSpan={9} className="py-3 text-sm text-muted" data-testid="directory-empty">
                Nobody here answers to all of that.{" "}
                {/*
                  Says "everyone" out loud rather than pointing at the bare
                  page. Now that /players means "however I last asked for it",
                  a way back that went there would re-apply the very narrowing
                  it offers to remove, and appear to do nothing at all.
                */}
                <Link href={SHOW_EVERYBODY_HREF} className="underline underline-offset-4" data-testid="directory-clear">
                  Show everybody again
                </Link>
                .
              </td>
            </tr>
          ) : null}
          {people.map((entry) => (
            <tr key={entry.id} className="border-t border-rule">
              <td className="py-1.5 pr-3">
                <span className="flex items-center gap-2">
                  <RecencyMark recency={recencyOf(new Date(entry.lastSeenAt), now)} />
                  {entry.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element -- a Google avatar
                    <img src={entry.picture} alt="" className="size-5 rounded-full" referrerPolicy="no-referrer" />
                  ) : null}
                  {entry.name.trim() !== "" ? (
                    <Link href={playerPath(entry.name, entry.id)} className="underline-offset-2 hover:underline" data-testid="directory-name">
                      {shownName(entry.name)}
                    </Link>
                  ) : (
                    entry.email
                  )}
                  {/* Where they are, which is most of why they answer at four in the morning. */}
                  <CountryMark country={entry.country} className="text-sm" />
                  {/*
                    Which sort of member this is, drawn on the unusual rows
                    only — the badge the operator's list has used all along,
                    rather than a second one invented here.

                    It earns its place on this list now that the default shows
                    programs alongside people. The suite already carried the
                    objection to that: "a program in the directory of people
                    would be a person as far as anybody reading it is
                    concerned." That was right, and hiding them was the wrong
                    answer to it — a reader on a quiet evening should find the
                    five opponents who are always here, and should never have
                    to work out which of the names is a program.
                  */}
                  <MemberKindBadge
                    kind={memberKind({
                      email: entry.email,
                      botTier: entry.botTier,
                      unclaimableBecause: entry.unclaimableBecause,
                    })}
                  />
                </span>
              </td>
              <DirectoryRecord
                name={entry.name}
                profile={entry.profile}
                elsewhere={entry.elsewhere}
                scope={scope}
              />
              <td className="py-1.5 pr-3 text-xs text-muted">
                {new Date(entry.joinedAt).toLocaleDateString()}
                {entry.isNew ? (
                  <span className="ml-2 rounded-full bg-moss-soft px-2 py-0.5 text-[0.65rem] font-semibold text-moss">
                    New 新人
                  </span>
                ) : null}
              </td>
              <td className="py-1.5 text-right">
                <RowActions>
                  {me?.email && entry.email !== null && me.email !== entry.email ? (
                    <>
                      <BuddyButton email={entry.email} isBuddy={buddies.has(entry.email)} />
                      <IgnoreButton email={entry.email} ignoring={ignored.has(entry.email)} />
                    </>
                  ) : null}
                </RowActions>
              </td>
              <td className="py-1.5 text-right">
                <RowActions>
                  {me?.email && entry.email !== null && me.email !== entry.email ? (
                    <ChallengeButton email={entry.email} />
                  ) : null}
                </RowActions>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/*
        What the mark means, said once under the table rather than repeated in
        every row that carries it. Drawn only when a row on this screen
        actually has one: a legend for a mark nobody can see is furniture.
      */}
      {people.some((entry) => entry.elsewhere.wins + entry.elsewhere.losses + entry.elsewhere.draws > 0) ? (
        <p className="text-xs leading-snug text-muted" data-testid="directory-kept-note">
          <span className="align-super text-[0.6rem]">※</span> Counts games from before Itsutsu, on
          the sites named on that player&rsquo;s own page.{" "}
          <span className="font-medium text-ink-soft">Those figures do not update</span> — they were
          copied down by hand once and are a snapshot of that day. Only what happens here is counted
          as it happens, and the rating column is always Itsutsu&rsquo;s alone.
        </p>
      ) : null}
    </div>
  );
}
