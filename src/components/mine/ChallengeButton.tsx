import Link from "next/link";

import { setUpLink } from "@/lib/gomoku/slugs";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG } from "@/components/ui/ui.constants";

/**
 * OFFERING SOMEBODY A GAME — WHICH MEANS GOING TO SETTLE ONE, NOT STARTING ONE.
 *
 * This used to POST a game and land you on the board. That is the exact thing
 * John has now asked to be rid of three times: "The Play button for user takes
 * us right to a game which is Gomoku and you have to change the game, otherwise
 * you're playing Gomoku with an accidental click (or just clicking around). I
 * keep telling you we need to take the user to the Game settings page, the page
 * BEFORE the game starts."
 *
 * He is right about more than the accident. A press of this knew ONE thing — a
 * person, or a game to repeat, or a position — and filled the rest in from
 * defaults nobody had been shown: the game was always freestyle, the board was
 * whatever the schema said, the clock was whatever was left over. So the only
 * way to play Reversi against a buddy was to start Gomoku against them and
 * change it afterwards, on a board that already existed, which is the window
 * every rules-settling bug on this site has lived in.
 *
 * Now it carries what it knows to the screen that asks the rest. Everything
 * about the link is in `setUpLink`, so what travels and how is decided in one
 * place rather than at nine call sites.
 *
 * A LINK RATHER THAN A BUTTON, and that is a real improvement rather than a
 * consequence. It needs no JavaScript at all — nine places on this site drop a
 * client component each — it can be opened in a new tab or a new window, it
 * prefetches, and it cannot lose a press to hydration because there is no
 * handler to attach. It keeps its button clothes: it is still the loud thing on
 * a row, and it is still called `challenge` so that every spec naming it goes
 * on naming it.
 */
export function ChallengeButton({
  memberId,
  label = "Challenge",
  strong = false,
  from,
  rematch,
  variant,
}: {
  /**
   * The member to offer a game to, by id.
   *
   * BY ID AND ONLY BY ID. An address used to be accepted here too, and was the
   * form most callers used, which meant every list with this button on it wrote
   * members' email addresses into the page's markup — and it could never be used
   * for a computer player, which has no address because it never signs in. Both
   * problems are one problem. Omitted for a rematch and a fork, which find the
   * other player in the game they came from.
   */
  memberId?: string;
  label?: string;
  strong?: boolean;
  /** Carry a position out of another game: its rules, and its first `move` moves. */
  from?: { id: string; move: number };
  /**
   * Play that finished game again: same board, same rules, same clock, same
   * opponent, colours swapped.
   *
   * It goes to the setup screen at /games/new rather than the one that names a
   * game, so the game itself is still a field. That is deliberate and it is
   * John's: "Perhaps you want to switch over to a variant — you need this page
   * so that you can say, I want to definitely play Bob at Reversi, but I want to
   * try that variant, and change some rules."
   */
  rematch?: string;
  /**
   * The game a fork belongs to, for the address.
   *
   * Used for a fork and for nothing else, which is enforced below rather than
   * left to callers: a position belongs to the game it was played in, so a
   * fork's setup screen names that game in its path and does not offer to change
   * it — while a challenge and a rematch both want the game left open, and an
   * address that named one would close it.
   */
  variant?: string;
}) {
  return (
    <Link
      href={setUpLink({
        variant: from === undefined ? undefined : variant,
        against: memberId,
        rematch,
        from,
      })}
      className={`${BUTTON_BASE} ${strong ? BUTTON_STRONG : BUTTON_QUIET} px-3 py-1 text-xs`}
      data-testid="challenge"
    >
      {label}
    </Link>
  );
}
