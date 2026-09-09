import Link from "next/link";

import { BuddyButton } from "@/components/mine/BuddyButton";
import { ChallengeButton } from "@/components/mine/ChallengeButton";
import { CountryMark } from "@/components/players/CountryMark";
import { DirectoryFilters } from "@/components/players/DirectoryFilters";
import { IgnoreButton } from "@/components/mine/IgnoreButton";
import { RecencyMark } from "@/components/mine/Recency";
import { RowActions } from "@/components/ui/Controls";
import { buddyEmails } from "@/lib/social/buddies";
import { currentSession } from "@/lib/auth/currentSession";
import { fetchComputerPlayers, fetchDirectory } from "@/lib/rating/players";
import { filterDirectory, type DirectoryFilter } from "@/lib/rating/directoryFilter";
import { ignoredEmails } from "@/lib/social/ignores";
import { playerPath } from "@/lib/rating/playerKey";
import { recencyOf } from "@/lib/social/presence";

/** How many of the most recently seen members the directory reads. */
const RECENT = 200;

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
            <th className="py-1 pr-3">W</th>
            <th className="py-1 pr-3">L</th>
            <th className="py-1 pr-3">D</th>
            <th className="py-1 pr-3">Rating</th>
            <th className="py-1 pr-3">Joined</th>
            <th className="py-1"></th>
            <th className="py-1"></th>
          </tr>
        </thead>
        <tbody>
          {people.length === 0 ? (
            <tr className="border-t border-rule">
              <td colSpan={8} className="py-3 text-sm text-muted" data-testid="directory-empty">
                Nobody here answers to all of that.{" "}
                <Link href="/players" className="underline underline-offset-4" data-testid="directory-clear">
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
                </span>
              </td>
              <td className="py-1.5 pr-3 font-mono tabular-nums">{entry.profile?.wins ?? 0}</td>
              <td className="py-1.5 pr-3 font-mono tabular-nums">{entry.profile?.losses ?? 0}</td>
              <td className="py-1.5 pr-3 font-mono tabular-nums">{entry.profile?.draws ?? 0}</td>
              <td className="py-1.5 pr-3 font-mono tabular-nums">
                {entry.profile !== null && entry.profile.tier !== "unrated" ? entry.profile.rating : "–"}
              </td>
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
    </div>
  );
}
