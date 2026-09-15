import { ChallengeButton } from "@/components/mine/ChallengeButton";
import { RowActions } from "@/components/ui/Controls";
import type { Reader } from "@/lib/auth/reader.types";
import { shownName } from "@/lib/rating/shownName";
import { recencyOf } from "@/lib/social/presence";
import type { DirectoryEntry } from "@/lib/rating/directoryRows";

import { RowMore } from "./RowMore";

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
 *
 * THE OFFER OF A GAME IN PLAIN SIGHT, BUDDY AND IGNORE BEHIND "⋯". All three at
 * the end of every row ran "Challenge" 81 pixels past the table's edge at 1280 —
 * see `RowMore`, which says what it measured and why this is the shape.
 */
export function directoryActions(
  reader: Pick<Reader, "hasAccount" | "memberId">,
  /** The reader's buddies and ignores BY MEMBER ID — see `buddyMemberIds`. */
  buddies: Set<string>,
  ignored: Set<string>,
  now: Date,
) {
  return {
    recency: (entry: DirectoryEntry) => recencyOf(new Date(entry.lastSeenAt), now),
    forEntry: (entry: DirectoryEntry) => {
      /*
       * AN ACCOUNT TO ASK WITH, somebody with an address to be asked, and not
       * the reader's own row — the last decided by id. It compared addresses,
       * which is the question `currentMemberId` asks the rest of the site not to
       * put: an id is who somebody is, an address is only how they sign in.
       */
      if (!reader.hasAccount || entry.email === null || entry.id === reader.memberId) return null;
      return (
        <RowActions>
          {/*
            By id, and to the setup screen rather than into a game. A directory
            row is the most likely place for an accidental press on this whole
            site — the button sits at the end of every line of a long list — and
            it used to create a game of Gomoku on the spot.
          */}
          <ChallengeButton memberId={entry.id} />
          <RowMore
            email={entry.email}
            name={shownName(entry.name)}
            isBuddy={buddies.has(entry.id)}
            ignoring={ignored.has(entry.id)}
          />
        </RowActions>
      );
    },
  };
}
