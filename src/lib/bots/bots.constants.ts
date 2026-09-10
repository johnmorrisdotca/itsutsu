import { BOT_ALL_TIERS, BOT_PROFILES, BOT_TIERS } from "@/lib/gomoku/opponent.constants";
import { tiersFor } from "@/lib/gomoku/expert/experts";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import type { BotTier } from "@/lib/gomoku/opponent.types";

/**
 * The computer players, as members.
 *
 * They are not a setting on a game; they are accounts that hold seats,
 * appear in the record, and carry a rating that moves when you beat them. The
 * grade and how it plays live beside the engine in `opponent.constants.ts`;
 * what lives here is who they are on this site.
 *
 * Their ids are curated and fixed — the same pattern as the other curated ids
 * on this site — and that is load-bearing rather than decorative. "Is this
 * seat a computer" has to be answerable without a database read, because the
 * clock asks it: `deadlineFor` is a pure function that the board and the
 * timeout claim both go through, and it cannot become an `await` without
 * ending up with two callers deciding separately.
 */

export type BotMember = {
  tier: BotTier;
  /** The member id, fixed for the life of the site. See above. */
  id: string;
  /** The name it plays under, and what the game record shows. */
  name: string;
  /** What its own page says about it. */
  bio: string;
  /**
   * Where they are from, so a flag stands beside their name like anybody
   * else's — and it has to be the country the name actually comes from.
   *
   * The middle three are Japanese: 級, 段 and 名人, and the site they play on
   * is called five. The two at the ends are not, and it would be a small
   * dishonesty to fly the same flag over them. разряд is the classification a
   * Russian amateur holds in a sport, and renju is one there. 国手 is the
   * Chinese title for the finest player in the country. Each is a real rank
   * where it comes from rather than a foreign word chosen for flavour.
   */
  country: string;
};

export const BOT_MEMBERS: Record<BotTier, BotMember> = {
  razryad: {
    tier: BOT_TIERS.razryad,
    id: "razryad",
    name: BOT_PROFILES.razryad.name,
    country: "Russia",
    bio:
      "разряд — a computer player, and the gentlest of the five. The word is " +
      "the classification a Russian amateur holds in a sport, and renju is a " +
      "sport there. Razryad sees a win about a third of the time it has one, " +
      "and throws a turn away now and then. Games against it are rated, and " +
      "so is its own record.",
  },
  kyu: {
    tier: BOT_TIERS.kyu,
    id: "kyu",
    name: BOT_PROFILES.kyu.name,
    country: "Japan",
    bio:
      "級 — a computer player, and the second gentlest of the five. Kyu looks one " +
      "move ahead: it will finish a line that is already there, and it will " +
      "miss a good deal of what you are building. Games against Kyu are rated, " +
      "and so is its own record.",
  },
  dan: {
    tier: BOT_TIERS.dan,
    id: "dan",
    name: BOT_PROFILES.dan.name,
    country: "Japan",
    bio:
      "段 — a computer player, and the middle of the five. Dan checks every " +
      "move against what you could do in reply, so it will not let you finish " +
      "a line in front of it. It does not look further than that. Games " +
      "against Dan are rated, and so is its own record.",
  },
  meijin: {
    tier: BOT_TIERS.meijin,
    id: "meijin",
    name: BOT_PROFILES.meijin.name,
    country: "Japan",
    bio:
      "名人 — a computer player, and the second strongest of the five. Meijin reads " +
      "several moves ahead in the games where lines can be read, and answers " +
      "a threat before it lands. Games against Meijin are rated, and so is " +
      "its own record.",
  },
  guoshou: {
    tier: BOT_TIERS.guoshou,
    id: "guoshou",
    name: BOT_PROFILES.guoshou.name,
    country: "China",
    bio:
      "国手 — a computer player, and the strongest of the graded five. The word " +
      "means the nation's hand, and is the title China gave its finest player " +
      "of the board games five-in-a-row grew up beside. Guoshou reads further " +
      "than Meijin and weighs more of the board before it moves, and it will " +
      "play anything on this site — which is the one thing the specialists " +
      "will not. Games against it are rated, and so is its own record.",
  },
  /*
   * The two specialists. Their flags follow their names the same way the
   * grades' do: Othello is a Japanese game and its greatest player is
   * Japanese; renju's first European world champion is Estonian, and Estonia
   * is one of the two or three countries where the game is played seriously.
   */
  tamenoki: {
    tier: BOT_TIERS.tamenoki,
    id: "tamenoki",
    name: BOT_PROFILES.tamenoki.name,
    country: "Japan",
    bio:
      "為乃木秀正 — a computer player, and the only one here that plays one " +
      "game. Tamenoki plays Reversi, and reads it as a Reversi player does: " +
      "corners first, then what each side has left to play, then the front " +
      "line, and the discs last of all — until the end, where he counts the " +
      "last dozen squares out exactly rather than judging them. The name is " +
      "an homage to Hideshi Tamenori, seven times world champion at Othello " +
      "and generally reckoned the finest ever to play it. " +
      "Games against him are rated, and so is his own record.",
  },
  meritalu: {
    tier: BOT_TIERS.meritalu,
    id: "meritalu",
    name: BOT_PROFILES.meritalu.name,
    country: "Estonia",
    bio:
      "A computer player, and the only one here that plays five in a row and " +
      "little else. Meritalu counts threats rather than shape: the four that " +
      "has to be answered, the open four that cannot be, and the stone that " +
      "makes two threats at once. The name is an homage to Ando Meritee, " +
      "four times world champion at renju and the first European to hold the " +
      "title. Games against him are rated, and so is his own record.",
  },
};

/**
 * All of them: the graded ladder weakest first, then the specialists.
 *
 * Everybody the site plays as a computer, which is what this list is for —
 * their rows are written from it, and `isBotId` is built out of it, so a
 * player missing here is a player the clock does not know is a program.
 */
export const BOT_MEMBER_LIST: readonly BotMember[] = BOT_ALL_TIERS.map(
  (tier) => BOT_MEMBERS[tier],
);

/**
 * The computer players worth offering as an opponent at one particular game.
 *
 * The graded five, who play anything, plus whichever specialist has actually
 * studied this board. Asked by the two places somebody picks an opponent and
 * by the sweep that answers a seat nobody has taken, so that a specialist is
 * never offered at a game it would play as a generalist.
 */
export function botsFor(variant: RuleVariant): readonly BotMember[] {
  return tiersFor(variant).map((tier) => BOT_MEMBERS[tier]);
}

/** Their ids, for the constant-time lookup the clock needs. */
export const BOT_MEMBER_IDS: ReadonlySet<string> = new Set(
  BOT_MEMBER_LIST.map((bot) => bot.id),
);

/**
 * Why a computer player's row may never be claimed by somebody signing in.
 *
 * Its own reason rather than a borrowed one. "seed" would say something false
 * — these are not made-up rows waiting to be replaced by real people, they are
 * players — and any query later asking why a member cannot be claimed would
 * have to guess which kind it was looking at.
 */
export const BOT_UNCLAIMABLE = "computer";

/**
 * Everything a release decides about a computer player's member row.
 *
 * One object, written by both halves of the upsert that keeps those rows.
 * The rule it enforces used to be a sentence in a comment — any value a
 * release decides has to be in the update as well as the create, or the
 * create is the only release that ever applies — and `unclaimableBecause`
 * had already been left out of the update once, so rows written before that
 * column existed never gained it.
 *
 * `showOnline` and `emailNotify` were the two still only in the create. The
 * column defaults to true, and "here now" is `showOnline` plus a stamp inside
 * the last half hour: a computer player's stamp never moves after its row is
 * written, so a row that kept the default would stand in the "who is here"
 * list for its first half hour and then quietly leave. Nothing produced such
 * a row today. The fix is that nothing can.
 *
 * Identity is not here on purpose. `id` and `email` are what the row IS, not
 * what a release decided about it, and rewriting either on every sweep is a
 * different and much worse thing than keeping a description up to date.
 */
export function botRowFields(bot: BotMember) {
  return {
    name: bot.name,
    bio: bot.bio,
    botTier: bot.tier,
    country: bot.country,
    unclaimableBecause: BOT_UNCLAIMABLE,
    // Not in the "who is here" list: it is always here, which is not news.
    showOnline: false,
    emailNotify: false,
  };
}

/**
 * How long a computer player may think about one move inside a request.
 *
 * Shorter than the chooser's own default, because a computer player can be sat
 * in a great many games at once and a request that answers one of its seats
 * must not be the slowest thing on the site. The strongest grade deepens
 * iteratively, so a smaller budget costs it a ply rather than an answer.
 */
export const BOT_MOVE_MILLIS = 250;

/**
 * The most turns one request will take on a computer's behalf.
 *
 * Enough for the games where a turn is more than one stone — two a turn in
 * Connect6 — and for a computer sitting opposite a computer to get a few moves
 * in. It is a bound rather than a target: a request answers a request, and a
 * game that would not stop asking is a bug, not a long game.
 */
export const BOT_TURNS_PER_REQUEST = 6;

/**
 * How long a posted seat waits for a person before a computer takes it.
 *
 * A day. Long enough that somebody who posted a game hoping for a person gets
 * an evening and a morning to find one; short enough that a seat posted on a
 * quiet Tuesday is a game by Wednesday rather than a line on a noticeboard
 * nobody answers.
 *
 * This number, and whether every posted seat should be answerable this way at
 * all, is the site owner's call rather than this file's. It is one constant so
 * that changing his mind is one edit.
 */
export const OPEN_SEAT_GRACE_MS = 24 * 60 * 60 * 1000;

/** How many stale seats one sweep will take, so a sweep is never a long request. */
export const OPEN_SEATS_ANSWERED_AT_ONCE = 3;
