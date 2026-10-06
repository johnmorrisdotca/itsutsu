import type { Handicap, HeadStart } from "@/lib/gomoku/gomoku.types";
import { describeHeadStart } from "@/lib/gomoku/headStartWords";
import type { Speaker } from "@/lib/i18n/i18n";

import { playerWord } from "./doorstepSays";
import { randomComputerWords } from "./picker.constants";
import { describeHandicap, type SettingWord } from "./rulesSummary";
import type { SetUpFork, SetUpOpponent } from "./setUp.types";

/**
 * WHAT THE SETUP SCREEN'S OWN FIELDS SAY, IN THE LINE OVER CONTINUE.
 *
 * `describeSettings` in rulesSummary.ts says what the RULES are — the opening,
 * the clock, whether it counts. These are the settings that belong to the setup
 * screen rather than to the rules: who the game is against, and whether anybody
 * is carrying a handicap. The line over the button says all of them, so a reader
 * at the bottom of a long form reads the whole game Continue will carry without
 * scrolling back up to check.
 *
 * Pure, and its own module, for the reason `setUpStart.ts` is: deciding what a
 * line says about a press is a decision, not a rendering, and a decision wants a
 * test beside it.
 */

/**
 * The default opponent, in the words the control uses.
 *
 * Said once because it is said twice — on the tile, and in the line over the
 * button. Two copies of it would be two things to keep in step.
 */
export const postForAnyone = (say: Speaker): string => say.say("summary.postForAnyone");

/**
 * The setup screen's own words, in the order its fields appear.
 *
 * WHO IT IS AGAINST reads what Continue will actually CARRY rather than the
 * chooser's raw value, because those can disagree: a specialist chosen at its own
 * game and then left behind by a change of game is no longer among the players
 * offered, and the game posts for anyone instead.
 *
 * A FORK NAMES ITS OPPONENT — the player who was in the position, whom the route
 * finds by reading the seats — through `playerWord`, so a program is marked as
 * one in the same words the doorstep uses.
 *
 * A COMPUTER PLAYER DRAWN AT RANDOM is said as that, since nobody has been drawn:
 * the draw is made when Begin creates the game.
 *
 * THE HANDICAP is left out entirely where there is none, rather than saying "no
 * handicap": the line is what this game IS, and the ordinary answer to a question
 * nobody asked is not worth a word of it.
 */
export function recapWords({
  opponent,
  fork,
  handicap,
  game,
  random = false,
  say,
}: {
  /**
   * Who this game will actually be against: the player chosen for an ordinary
   * ask, and whoever was in the POSITION for a fork. Null for a seat posted for
   * anyone, for a computer player still to be drawn, and for a fork of a game
   * nobody else was in.
   */
  opponent: SetUpOpponent | null;
  /** The position being carried, where one is. */
  fork: SetUpFork | null;
  handicap: Handicap;
  /** The game and the head start given in it, which the line names beside the handicap. */
  game: { variant: string; headStart: HeadStart };
  /** A computer player is to be drawn at random. */
  random?: boolean;
  say: Speaker;
}): SettingWord[] {
  const against: SettingWord =
    opponent !== null
      ? { text: say.say("summary.againstPlayer", { player: playerWord(opponent.name, opponent.computer, say) }), notable: true }
      : random && fork === null
        ? { text: randomComputerWords(say).against, notable: true }
        : fork !== null
          ? { text: say.say("summary.againstHandOver"), notable: true }
          : { text: postForAnyone(say), notable: false };

  const given = describeHeadStart(game, say);
  const carried = describeHandicap(handicap, say);
  return [
    against,
    ...(given === null ? [] : [{ text: given, notable: true }]),
    ...(carried === null ? [] : [{ text: carried, notable: true }]),
  ];
}
