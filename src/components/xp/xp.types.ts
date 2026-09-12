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
