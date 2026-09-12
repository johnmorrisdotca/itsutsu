import { BuddyButton } from "@/components/mine/BuddyButton";
import { ChallengeButton } from "@/components/mine/ChallengeButton";
import { IgnoreButton } from "@/components/mine/IgnoreButton";
import { RowActions } from "@/components/ui/Controls";
import { recencyOf } from "@/lib/social/presence";
import type { DirectoryEntry } from "@/lib/rating/directoryRows";

/**
 * What the reader may do about each member of the directory, and how recently
 * each was seen.
 *
 * Gathered once and handed to every row rather than looked up per row: it reads
 * the signed-in reader's buddies and ignores, which is two queries for the
 * whole list however long the list is.
 *
 * Beside `Directory.tsx` rather than in it because that file reached the size
 * gate when the directory learned to sort and page, and this was the seam: it
 * is the one part of a row that is about the READER rather than about the
 * member, and it is the only part with no opinion about the columns.
 */
export function directoryActions(
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
