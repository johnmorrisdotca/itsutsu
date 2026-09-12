import { BuddyButton } from "@/components/mine/BuddyButton";
import { ChallengeButton } from "@/components/mine/ChallengeButton";
import { IgnoreButton } from "@/components/mine/IgnoreButton";

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
 * Not everybody gets all three. A kept record has no address — Chibi never
 * signed in — so there is nobody to challenge or to hear from, and it gets
 * none. A computer player has no address either but does have an id, and a
 * game against one is the point of it being listed at all; buddying or
 * ignoring a program is not a thing anybody means, so it is offered a game
 * and nothing else. And nobody is offered any of it about themselves.
 */
export function PlayerActions({
  email,
  memberId,
  isBuddy,
  ignoring,
  isComputer,
  isYou,
  signedIn,
  compact = false,
  testId = "player-actions",
}: {
  /** Null for a kept record and for a computer player: neither has one. */
  email: string | null;
  memberId?: string;
  isBuddy: boolean;
  ignoring: boolean;
  isComputer: boolean;
  isYou: boolean;
  signedIn: boolean;
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
  if (isYou || !signedIn) return null;
  if (isComputer) {
    if (memberId === undefined) return null;
    return (
      <div className="flex flex-wrap items-center gap-2" data-testid={testId}>
        <ChallengeButton memberId={memberId} label="Play 対局" strong={!compact} />
      </div>
    );
  }
  if (email === null) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid={testId}>
      {/*
        A game is offered by member id, so the offer needs one. A member row
        without an id is a kept record — somebody who never signed in — and
        `email === null` above has already sent those away; a row that somehow
        has an address and no id is nobody this can reach, and saying nothing is
        the honest answer rather than a button that cannot name who it is for.
      */}
      {memberId === undefined ? null : (
        <ChallengeButton
          memberId={memberId}
          label={compact ? "Play 対局" : "Ask for a game 対局を申し込む"}
          strong={!compact}
        />
      )}
      <BuddyButton email={email} isBuddy={isBuddy} />
      <IgnoreButton email={email} ignoring={ignoring} />
    </div>
  );
}
