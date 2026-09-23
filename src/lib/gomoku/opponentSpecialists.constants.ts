import { EXPERT_KINDS } from "./expert/expert.constants";
import type { BotProfile, SpecialistTier, TierSpec } from "./opponent.types";

/**
 * THE SPECIALISTS: one game each, studied properly, and off the ladder.
 *
 * Kept out of `opponent.constants.ts` so the ladder's fingerprint
 * (`ladderFingerprint.ts`) does not hash them. The fingerprint exists so a
 * change to how a GRADE chooses a move silences the grades' measured
 * strength tables until they are measured again. A specialist never decides a
 * graded move — every grade's `expertise` is empty — so a specialist added or
 * tuned is not such a change, and hashing these rows made every new
 * specialist blank the tables and the About page's ladder graph for a
 * re-measure that came back the same (board ticket
 * the-ladder-fingerprint-counts-a-specialist-as-a-change-to-the-grades).
 *
 * The guard that keeps this honest is in `ladderStrength.test.ts`: every row
 * here must have an expertise, so nothing that could decide a graded move can
 * hide in the file the fingerprint does not read.
 */

export const SPECIALIST_TIERS = {
  tamenoki: "tamenoki",
  meritalu: "meritalu",
  monkton: "monkton",
  tinsdale: "tinsdale",
  hondo: "hondo",
} as const satisfies Record<SpecialistTier, SpecialistTier>;

/**
 * The second row's shape is the diagnosis over again: the specialist beats 国手
 * more comfortably than it beats 段. A deeper search over a reading that
 * misunderstands the game is not a smaller error than a shallow one, it is a
 * better-executed one.
 */
export const BOT_SPECIALIST_LIST: readonly SpecialistTier[] = [
  SPECIALIST_TIERS.tamenoki,
  SPECIALIST_TIERS.meritalu,
  SPECIALIST_TIERS.monkton,
  SPECIALIST_TIERS.tinsdale,
  SPECIALIST_TIERS.hondo,
];

export const SPECIALIST_PROFILES: Record<SpecialistTier, BotProfile> = {
  /*
   * The specialists, named after the players who defined their games rather
   * than after a rank — because a specialist is a person and not a rung.
   *
   * Each name is an homage: near enough to say plainly who is meant, and
   * altered so that it is not them. Hidemasa Tamenoki is for Hideshi Tamenori,
   * seven times champion of the world at Othello and generally reckoned the
   * finest ever to play it. Andrus Meritalu is for Ando Meritee, four times
   * world champion at renju and the first European to hold the title. The
   * flags follow the names, as they do for the grades.
   */
  tamenoki: {
    tier: SPECIALIST_TIERS.tamenoki,
    name: "Hidemasa Tamenoki",
    native: "為乃木秀正",
    strength: "Strongest at Reversi",
    blurb:
      "Reversi, and almost nothing else. Tamenoki counts what a Reversi " +
      "player counts — corners, the squares that give a corner away, how many " +
      "replies you have left — and plays the last dozen squares out exactly " +
      "rather than guessing at them. The disc lead you build in the middle of " +
      "the game is the thing he is playing to take off you.",
  },
  meritalu: {
    tier: SPECIALIST_TIERS.meritalu,
    name: "Andrus Meritalu",
    /*
     * No other script. An Estonian name written in Estonian is the name, and
     * a field repeating it would mean both "here is the other script" and
     * "there isn't one". See `BotProfile.native`.
     */
    native: null,
    strength: "Strongest at five in a row",
    blurb:
      "Five in a row, and almost nothing else. Meritalu counts threats rather " +
      "than shape: the four you have to answer, the open four nobody can, and " +
      "the two threats made by one stone that end the game. He will not be " +
      "drawn with, which is the difference between him and the grades.",
  },
  /*
   * THE THIRD SPECIALIST IS NAMED AFTER AN INVENTOR RATHER THAN A CHAMPION,
   * and that is the honest thing rather than a shortcut.
   *
   * The other two are homages to the finest player of their game. These games
   * have no such person to point at: there is no tournament scene for Halma or
   * Chinese Checkers anywhere, no published engine above hobby grade, and no
   * record of a champion at either — which is the same fact that makes a
   * specialist here worth building at all. Inventing a plausible-sounding
   * champion to keep the pattern tidy would be putting a person on the site who
   * never existed, so the homage goes to the man who made the game instead:
   * George Howard Monks, a Boston surgeon, who devised Halma at Harvard in the
   * 1880s. Chinese Checkers is his game on a star. The flag follows the name,
   * as it does for the others.
   */
  monkton: {
    tier: SPECIALIST_TIERS.monkton,
    name: "Howard Monkton",
    /* No other script: an American name written in English is the name. See `native`. */
    native: null,
    /*
     * "Chinese Checkers", not "the race games", and the difference is measured
     * rather than modest. He takes eighteen games in eighteen off the graded
     * ladder on the star, and six in eight on Halma's small board. On Halma's
     * own sixteen-point board he is level with 名人 at best — that board is
     * sparse enough to be nearly a pure race, where a reading that can see the
     * camp has little to see, and it is the one place his ideas do not pay.
     * Saying "strongest at Halma" would be a claim the series does not support,
     * so it is not made. See `RACE` for the widths this was measured at.
     */
    strength: "Strongest at Chinese Checkers",
    blurb:
      "The race games, and almost nothing else. Monkton counts what a race " +
      "player counts \u2014 how many steps each piece has left, on the lattice the " +
      "board is actually drawn on, with a square of the far camp set aside for " +
      "every piece and the back of the camp filled first. What he is really " +
      "playing for is the piece you leave behind: the game is not over until " +
      "your last one is in, and he will let you build a pretty middlegame and " +
      "finish first. He plays Halma too, and is at his best on the crowded " +
      "boards where getting in each other's way is the game.",
  },
  /*
   * THE FOURTH SPECIALIST, and an homage to the finest player his game has
   * had: Marion Tinsley, world checkers champion, who lost seven games in
   * forty-five years at the top. The name is changed a little, as the others'
   * are, so it is a tribute rather than an impersonation. The flag follows the
   * name. His reading is `draughtsExpert.ts`.
   */
  tinsdale: {
    tier: SPECIALIST_TIERS.tinsdale,
    name: "Marion Tinsdale",
    /* No other script: an American name written in English is the name. See `native`. */
    native: null,
    strength: "Strongest at checkers and draughts",
    blurb:
      "Checkers and the five draughts games, and nothing else. Tinsdale " +
      "counts what a draughts player counts \u2014 material first, a king at " +
      "two and a half men, then his own back row, which he will not give up " +
      "while you still have a man to crown, and the middle of the board. " +
      "Ahead, he trades: five against four is a game, two against one is " +
      "not. Behind, he will not.",
  },
  /*
   * THE FIFTH SPECIALIST, and an homage to the Go player every Japanese
   * student is taught to revere: Hon'inbō Shūsaku, unbeaten in nineteen years
   * of castle games. Changed a little, as the others are, so it is a tribute
   * rather than an impersonation. His reading is `expert/goExpert.ts`.
   */
  hondo: {
    tier: SPECIALIST_TIERS.hondo,
    name: "Shūsaku Hondō",
    native: "本堂秀策",
    strength: "Strongest at Go on the small boards",
    blurb:
      "Go, and nothing else. Hondō looks where a club player looks first: " +
      "whose ground each empty point is, by whose stones are nearer, and which " +
      "groups are short of breath. A group of yours in atari is one he means " +
      "to take, and one of his is one he means to save.",
  },
};

export const SPECIALIST_SPECS: Record<SpecialistTier, TierSpec> = {
  /*
   * The specialists carry 国手's knobs and one thing more: a game they have
   * actually studied. At that game the knobs hardly matter — the specialist
   * reading decides the move, and everything here is what happens when the
   * reading declines, which is what it does at the other thirty-odd games on
   * the site. A specialist away from its own board is 国手 and no better,
   * which is the honest thing for it to be.
   */
  tamenoki: {
    depth: 2,
    guard: 1,
    blunder: 0,
    noise: 0,
    reads: true,
    width: 180,
    guardTop: 34,
    searchDepth: 8,
    expertise: [EXPERT_KINDS.flip],
  },
  meritalu: {
    depth: 2,
    guard: 1,
    blunder: 0,
    noise: 0,
    reads: true,
    width: 180,
    guardTop: 34,
    searchDepth: 8,
    expertise: [EXPERT_KINDS.line],
  },
  monkton: {
    depth: 2,
    guard: 1,
    blunder: 0,
    noise: 0,
    reads: true,
    width: 180,
    guardTop: 34,
    searchDepth: 8,
    expertise: [EXPERT_KINDS.race],
  },
  tinsdale: {
    depth: 2,
    guard: 1,
    blunder: 0,
    noise: 0,
    reads: true,
    width: 180,
    guardTop: 34,
    searchDepth: 8,
    expertise: [EXPERT_KINDS.draughts],
  },
  hondo: {
    depth: 2,
    guard: 1,
    blunder: 0,
    noise: 0,
    reads: true,
    width: 180,
    guardTop: 34,
    searchDepth: 8,
    expertise: [EXPERT_KINDS.go],
  },
};
