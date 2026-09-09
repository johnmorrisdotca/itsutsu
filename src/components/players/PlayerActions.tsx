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
}: {
  /** Null for a kept record and for a computer player: neither has one. */
  email: string | null;
  memberId?: string;
  isBuddy: boolean;
  ignoring: boolean;
  isComputer: boolean;
  isYou: boolean;
  signedIn: boolean;
}) {
  if (isYou || !signedIn) return null;
  if (isComputer) {
    if (memberId === undefined) return null;
    return (
      <div className="flex flex-wrap items-center gap-2" data-testid="player-actions">
        <ChallengeButton memberId={memberId} label="Play 対局" strong />
      </div>
    );
  }
  if (email === null) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="player-actions">
      <ChallengeButton email={email} label="Ask for a game 対局を申し込む" strong />
      <BuddyButton email={email} isBuddy={isBuddy} />
      <IgnoreButton email={email} ignoring={ignoring} />
    </div>
  );
}
