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
import { fetchComputerPlayers, fetchDirectory, type DirectoryEntry } from "@/lib/rating/players";
import { RATING_POOLS, gamesPlayed, ratingShown } from "@/lib/rating/wholeRecord";
import { RecordCells, RecordHeadings } from "./PlayerRecord";
import { filterDirectory, type DirectoryFilter } from "@/lib/rating/directoryFilter";
import { SHOW_EVERYBODY_HREF } from "@/lib/rating/rememberedFilter";
import { ignoredEmails } from "@/lib/social/ignores";
import { playerPath } from "@/lib/rating/playerKey";
import { recencyOf } from "@/lib/social/presence";

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
function DirectoryRecord({ profile, elsewhere }: Pick<DirectoryEntry, "profile" | "elsewhere">) {
  const here = gamesPlayed(profile);
  const played = {
    wins: here.wins + elsewhere.wins,
    losses: here.losses + elsewhere.losses,
    draws: here.draws + elsewhere.draws,
  };
  const rating = ratingShown(profile);
  const kept = elsewhere.wins + elsewhere.losses + elsewhere.draws > 0;
  return (
    <>
      <RecordCells
        record={played}
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
export async function Directory({ filter, now }: { filter: DirectoryFilter; now: Date }) {
  const [directory, computers, me] = await Promise.all([
    fetchDirectory(RECENT),
    fetchComputerPlayers(),
    currentSession(),
  ]);
  /*
   * Everybody the directory could show, before it is narrowed.
   *
   * The programs are fetched on their own rather than picked out of the
   * directory, which is ordered by who was seen last — a computer player is
   * never seen, so past two hundred members every one of them fell off the
   * end and this page stopped offering any computer opponent at all.
   */
  const seen = new Set(directory.map((entry) => entry.id));
  const everybody = [...directory, ...computers.filter((one) => !seen.has(one.id))];
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
                    <Link href={playerPath(entry.name)} className="underline-offset-2 hover:underline" data-testid="directory-name">
                      {entry.name}
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
              <DirectoryRecord profile={entry.profile} elsewhere={entry.elsewhere} />
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
