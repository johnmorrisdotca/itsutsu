import Link from "next/link";

import { BuddyButton } from "@/components/mine/BuddyButton";
import { ChallengeButton } from "@/components/mine/ChallengeButton";
import { IgnoreButton } from "@/components/mine/IgnoreButton";
import { InviteFriends } from "@/components/mine/InviteFriends";
import { RecencyLegend, RecencyMark } from "@/components/mine/Recency";
import { RowActions } from "@/components/ui/Controls";
import { fetchBuddies } from "@/lib/social/buddies";
import { fetchIgnored } from "@/lib/social/ignores";
import { shownName } from "@/lib/rating/shownName";

/**
 * The people a member has said something about: the ones they play, the ones
 * they have shut out, and the way to bring somebody new in.
 *
 * Three lists that were three panels down one page, and two of them are
 * usually empty. Together they are one answer to one question — who is on
 * your side of the site — and putting the ignored roll here rather than on a
 * tab of its own also stops a tab appearing and disappearing with the list,
 * which is a worse page than one tab named for both.
 *
 * Fetches its own rows: nothing else on this page needs them, and the page
 * used to read the buddy list and the ignore list on every visit whichever
 * part of it somebody had come for.
 */
export async function MyPeople({ email }: { email: string }) {
  const [buddies, ignored] = await Promise.all([fetchBuddies(email), fetchIgnored(email)]);

  return (
    <div className="flex flex-col gap-4" data-testid="my-people">
      <section className="flex flex-col gap-3" data-testid="buddies">
        <h2 className="flex items-baseline gap-2 font-semibold">
          Buddies <span className="font-mincho text-xs font-normal opacity-70">仲間</span>
          <span className="text-xs font-normal text-muted">{buddies.length}</span>
        </h2>
        {buddies.length === 0 ? (
          <p className="text-sm text-muted">
            Nobody yet. Star people on the{" "}
            <Link href="/players" className="underline underline-offset-4">players</Link> page and they are listed
            here, most recently seen first.
          </p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {buddies.map((buddy) => (
              <li key={buddy.email} className="flex flex-wrap items-center gap-3 border-t border-rule py-1.5 first:border-t-0">
                <RecencyMark recency={buddy.recency} />
                <span className="font-medium">{buddy.name || buddy.email}</span>
                <span className="text-xs text-muted">
                  {[buddy.city, buddy.country].filter(Boolean).join(", ")}
                  {buddy.localTime !== null ? ` · ${buddy.localTime} there` : ""}
                </span>
                <span className="ml-auto">
                  <RowActions>
                    {buddy.email === null ? null : (
                      <>
                        <ChallengeButton memberId={buddy.id} />
                        <BuddyButton email={buddy.email} isBuddy />
                      </>
                    )}
                  </RowActions>
                </span>
              </li>
            ))}
          </ul>
        )}
        {/* The legend explains the marks beside names; with no names, nothing. */}
        {buddies.length > 0 ? <RecencyLegend /> : null}
      </section>

      {ignored.length > 0 ? (
        <section className="flex flex-col gap-2 border-t border-rule pt-4" data-testid="ignored">
          <h2 className="flex items-baseline gap-2 font-semibold">
            Ignored <span className="font-mincho text-xs font-normal opacity-70">無視</span>
            <span className="text-xs font-normal text-muted">{ignored.length}</span>
          </h2>
          <p className="text-xs text-muted">They cannot challenge you, and their messages in a game are hidden from you.</p>
          <ul className="flex flex-col gap-1 text-sm">
            {ignored.map((entry) => (
              <li key={entry.email} className="flex items-center gap-3">
                <span>{shownName(entry.name)}</span>
                <span className="ml-auto"><IgnoreButton email={entry.email} ignoring /></span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="border-t border-rule pt-4">
        <InviteFriends />
      </div>
    </div>
  );
}
