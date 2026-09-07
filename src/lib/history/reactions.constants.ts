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

/** How many recent reactions a game carries to its readers. */
export const REACTIONS_KEPT = 30;

/** How long an incoming reaction floats over the board before fading. */
export const REACTION_SHOW_MS = 6_000;

/** The longest message that may ride along with an emoji. */
export const MESSAGE_MAX = 140;

/** A seat may not send more than this many reactions in a minute. */
export const REACTION_RATE_LIMIT = { windowMs: 60_000, maxRequests: 20 };
