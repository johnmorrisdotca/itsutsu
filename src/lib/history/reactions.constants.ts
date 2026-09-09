/**
 * Emoji a player may send the other during a shared game.
 *
 * A fixed set, not free text: nothing typed by a stranger is ever shown to
 * another player, so there is nothing to moderate. Each has a caption for the
 * button's accessible name and for the record.
 */
export const REACTIONS = [
  { emoji: "👏", label: "Nice move" },
  { emoji: "🔥", label: "On fire" },
  { emoji: "😮", label: "Did not see that coming" },
  { emoji: "🤔", label: "Thinking" },
  { emoji: "😅", label: "Close one" },
  { emoji: "😂", label: "Ha" },
  { emoji: "😱", label: "Oh no" },
  { emoji: "🙇", label: "Well played" },
  { emoji: "🍵", label: "Take your time" },
  { emoji: "👋", label: "Hello" },
] as const;

export type ReactionEmoji = (typeof REACTIONS)[number]["emoji"];

export const REACTION_EMOJI = REACTIONS.map((reaction) => reaction.emoji) as [
  ReactionEmoji,
  ...ReactionEmoji[],
];

/**
 * The things people actually say over a slow game, one tap each.
 *
 * An emoji on its own carries a mood; a game played a move a day needs
 * sentences — that you have seen the move, that you are not ignoring them,
 * that you are going out and will answer tonight. The elder turn-based sites
 * all kept a list like this, and they kept it for a reason: two people playing
 * across a timezone and often across a language will send a phrase they can
 * pick off a list far sooner than one they have to compose.
 *
 * Each carries its own emoji, so a phrase is still a reaction and the rule
 * that a message never travels alone holds. They are deliberately short: they
 * are read as buttons, and a button nobody can take in at a glance is slower
 * than typing.
 */
export const QUICK_PHRASES = [
  { emoji: "👋", text: "Hello, good luck" },
  { emoji: "🍵", text: "No rush" },
  { emoji: "🤔", text: "Need to think about this one" },
  { emoji: "😅", text: "Sorry, misclick" },
  { emoji: "👋", text: "Have to go — back later" },
  { emoji: "🙇", text: "Good game, thank you" },
] as const satisfies readonly { emoji: ReactionEmoji; text: string }[];

/** How many recent reactions a game carries to its readers. */
export const REACTIONS_KEPT = 30;

/** How long an incoming reaction floats over the board before fading. */
export const REACTION_SHOW_MS = 6_000;

/** The longest message that may ride along with an emoji. */
export const MESSAGE_MAX = 140;

/** A seat may not send more than this many reactions in a minute. */
export const REACTION_RATE_LIMIT = { windowMs: 60_000, maxRequests: 20 };

/**
 * The two a computer player says, taken from the list above rather than
 * written again.
 *
 * A program says what a person can say and nothing a person cannot: picking
 * these out of QUICK_PHRASES is what keeps that true, and means a change to
 * the wording reaches the computer players without anybody remembering to
 * make it twice. Only these two — a greeting and a thank you, at the two
 * moments a person would say them. Nothing mid-game: "Need to think about
 * this one" from something that thinks in milliseconds would be a lie.
 */
export const BOT_PHRASES = {
  hello: QUICK_PHRASES[0],
  goodGame: QUICK_PHRASES[QUICK_PHRASES.length - 1],
} as const;
