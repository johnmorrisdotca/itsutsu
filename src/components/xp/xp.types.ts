/**
 * The XP a player just earned, as a toast shows it.
 *
 * This is the whole contract between the delivery mechanism — `src/lib/xp/`,
 * which decides what earns points and how a page learns of it — and the
 * pixels, which are this directory and draw only. A page with awards in hand
 * mounts `XpToastHost` and passes them; nothing here fetches, polls or
 * listens for anything.
 */
export type XpToastItem = {
  /** Unique per award, for keys and dismissal. */
  id: string;
  /** e.g. 25 */
  points: number;
  /** e.g. "First win at Reversi" */
  label: string;
  /** e.g. "初勝利" — may be empty */
  kanji: string;
  /** One line saying why: "You beat Kyu at Reversi for the first time." */
  sentence: string;
  /**
   * Present when this award crossed a level. `reached: true` means the level
   * was just reached, and the toast makes an occasion of it. `reached: false`
   * is read here as the level this award moved the player towards, and is
   * said quietly under the sentence.
   */
  level?: { name: string; reached: boolean };
};

export type XpToastHostProps = {
  /**
   * The awards to show, in the order they were earned; the first is the top
   * of the stack. Every id is shown once however many times it is handed
   * over, so the list may accumulate or be replaced, whichever the caller
   * finds easier. An award's time on screen belongs to the host from the
   * moment it is admitted: taking it out of this list does not take it off
   * the screen.
   */
  items: readonly XpToastItem[];
  /** Told when a toast has gone — by tap, key or time — so the caller can let it go too. */
  onDismiss?: (id: string) => void;
};

/** Where in its life a shown toast is. */
export type XpToastPhase = "shown" | "leaving";

/**
 * A LEVEL BESIDE A NAME, WHICH IS WHERE THE LADDER IS ACTUALLY READ.
 *
 * `/xp/levels` is the whole ladder and almost nobody will visit it. What every
 * member sees instead is this: the rung they are on, wherever their name is
 * printed. So the badge is the feature and the ladder page is its reference,
 * which is why the badge carries the link rather than the other way round.
 *
 * It is in this file and not a `LevelName.types.ts` of its own because
 * AGENTS.md asks for one types module per component group, and this directory is
 * one group — the toasts and the badge are both "what XP looks like".
 */
export type LevelNameProps = {
  /** The level, as `xpLevelFor(member.xp)` answered it. */
  level: number;
  /**
   * Whether the badge leads to the level's own page.
   *
   * On by default, because a level with nothing behind it is the dead end this
   * site has a gate about. Off only where the badge sits INSIDE another link —
   * a stretched card, a row that is itself an anchor — since an anchor within an
   * anchor is invalid HTML and the browser silently drops one of them, so the
   * reader's click lands somewhere neither of us chose.
   */
  linkable?: boolean;
  /**
   * Draw the number alone, with the name on hover.
   *
   * For a narrow cell in a table that already has a name in it. The name is
   * still in the `title` and in the accessible label, so nothing is lost to a
   * reader who cannot hover — it is only the pixels that are short.
   */
  compact?: boolean;
  className?: string;
  testId?: string;
};
