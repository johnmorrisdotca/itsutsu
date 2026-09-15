import { BuddyButton } from "@/components/mine/BuddyButton";
import { ChallengeButton } from "@/components/mine/ChallengeButton";
import { IgnoreButton } from "@/components/mine/IgnoreButton";
import { shownName } from "@/lib/rating/shownName";

import { RowMore } from "./RowMore";

/**
 * What you can do about somebody, on the page about them.
 *
 * The directory has offered all three for a long time and the page a
 * directory row leads to offered none of them — so the way to challenge
 * somebody was to go back to the list you had just left, find them again, and
 * press the button there. The elder sites all put these on the profile
 * itself, and they were right to.
 *
 * The same three components the directory uses rather than three new ones, so
 * the words cannot drift apart: whatever a buddy is called, it is called that
 * in both places.
 *
 * Not everybody gets all three. A kept record is nobody with an account — Chibi
 * never signed in — so there is nobody to challenge or to hear from, and it gets
 * none. A computer player is offered a game and nothing else; buddying or
 * ignoring a program is not a thing anybody means. And nobody is offered any of
 * it about themselves.
 */
export function PlayerActions({
  memberId,
  person,
  isBuddy,
  ignoring,
  isComputer,
  isYou,
  canAsk,
  compact = false,
  testId = "player-actions",
  name,
}: {
  /** Whose actions these are, for the ⋯ button's accessible name in a row. */
  name?: string;
  /** Their member id; undefined for a name with no member behind it. */
  memberId?: string;
  /**
   * A person with an account — `listable`: not a program, not a kept record.
   *
   * It was their ADDRESS being there, which said the same thing about programs
   * and kept records and something false about every member who came in with an
   * invite code: they have no address and are people like anybody else.
   */
  person: boolean;
  isBuddy: boolean;
  ignoring: boolean;
  isComputer: boolean;
  /** Decided by member id: the reader's own row, where there is nothing to offer. */
  isYou: boolean;
  /**
   * Whether the READER has an account to ask with — `Reader.hasAccount`.
   *
   * Every route behind these three buttons — the challenge, the buddy list, the
   * ignore list — keys on the reader's member id, so they are offered wherever
   * there is one, and nowhere a session has no member behind it.
   */
  canAsk: boolean;
  /**
   * For a row rather than a page heading.
   *
   * The same three components and the same rules — only the challenge is
   * worded shorter, because "Ask for a game 対局を申し込む" beside every line of
   * a ten-row list is the offer shouting over the record it is attached to.
   * Anything more than the wording would be a second version of this to keep
   * in step, which is what the component exists to prevent.
   */
  compact?: boolean;
  /**
   * A name of its own where these are not the page's own actions.
   *
   * The heading's offer and a row's offer are different objects in different
   * places, and a page carrying eleven of one name is a page nothing can point
   * at — a test asking for "the actions" got all eleven and could no longer
   * say which it meant.
   */
  testId?: string;
}) {
  if (isYou || !canAsk || memberId === undefined) return null;
  if (isComputer) {
    return (
      <div className="flex flex-wrap items-center gap-2" data-testid={testId}>
        <ChallengeButton memberId={memberId} label="Play 対局" strong={!compact} />
      </div>
    );
  }
  if (!person) return null;

  /*
   * IN A ROW, THE OFFER OF A GAME AND "⋯" FOR THE REST. Play, Buddy and Ignore at
   * the end of a standings row ran past the table's edge at 768 and 400 — see
   * `RowMore`. The page heading keeps all three in full, where there is room.
   */
  if (compact) {
    return (
      <div className="flex items-center justify-end gap-1" data-testid={testId}>
        <ChallengeButton memberId={memberId} label="Play 対局" />
        <RowMore memberId={memberId} name={shownName(name ?? "")} isBuddy={isBuddy} ignoring={ignoring} />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid={testId}>
      {/* A game is offered by member id, and so is everything beside it. */}
      <ChallengeButton memberId={memberId} label="Ask for a game 対局を申し込む" strong />
      <BuddyButton memberId={memberId} isBuddy={isBuddy} />
      <IgnoreButton memberId={memberId} ignoring={ignoring} />
    </div>
  );
}
