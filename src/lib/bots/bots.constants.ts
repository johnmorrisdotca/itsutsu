import { BOT_PROFILES, BOT_TIERS, BOT_TIER_LIST } from "@/lib/gomoku/opponent.constants";
import type { BotTier } from "@/lib/gomoku/opponent.types";

/**
 * The three computer players, as members.
 *
 * They are not a setting on a game; they are three accounts that hold seats,
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
};

export const BOT_MEMBERS: Record<BotTier, BotMember> = {
  kyu: {
    tier: BOT_TIERS.kyu,
    id: "kyu",
    name: BOT_PROFILES.kyu.name,
    bio:
      "級 — a computer player, and the gentlest of the three. Kyu looks one " +
      "move ahead: it will finish a line that is already there, and it will " +
      "miss a good deal of what you are building. Games against Kyu are rated, " +
      "and so is its own record.",
  },
  dan: {
    tier: BOT_TIERS.dan,
    id: "dan",
    name: BOT_PROFILES.dan.name,
    bio:
      "段 — a computer player, and the middle of the three. Dan checks every " +
      "move against what you could do in reply, so it will not let you finish " +
      "a line in front of it. It does not look further than that. Games " +
      "against Dan are rated, and so is its own record.",
  },
  meijin: {
    tier: BOT_TIERS.meijin,
    id: "meijin",
    name: BOT_PROFILES.meijin.name,
    bio:
      "名人 — a computer player, and the strongest of the three. Meijin reads " +
      "several moves ahead in the games where lines can be read, and answers " +
      "a threat before it lands. Games against Meijin are rated, and so is " +
      "its own record.",
  },
};

/** The three, weakest first — the order they are offered as opponents in. */
export const BOT_MEMBER_LIST: readonly BotMember[] = BOT_TIER_LIST.map(
  (tier) => BOT_MEMBERS[tier],
);

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
