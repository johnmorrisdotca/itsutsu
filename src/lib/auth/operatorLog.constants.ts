import type { OperatorActionName } from "./operatorLog.types";

/**
 * The acts the operator log keeps: one name per thing the operator can do to
 * somebody else's account. The name is what the `OperatorAction.action` column
 * holds, verbatim, so there is no mapping to drift.
 */
export const OPERATOR_ACTIONS = {
  /** An account shut: it stops working on its next request. */
  shut: "shut",
  /** A shut account opened again. */
  restore: "restore",
  /** Four words set for a member, whether or not they replaced some. */
  wordsSet: "wordsSet",
  /** A four-word pick opened for a member: no credential exists yet, but somebody started making one. */
  wordsPickOpened: "wordsPickOpened",
  /** A member's name taken off or set by the operator. The row says which, never the name. */
  rename: "rename",
  /**
   * A record kept under a name nobody had an account for, attached to a member.
   * The row says what moved, in counts — never the name it was kept under.
   */
  recordClaimed: "recordClaimed",
} as const satisfies Record<string, OperatorActionName>;

/** What the Admin tab says for each act, in the site's paired English and kanji. */
export const OPERATOR_ACTION_DISPLAY: Record<OperatorActionName, { label: string; kanji: string }> = {
  shut: { label: "Shut the account", kanji: "停止" },
  restore: { label: "Opened the account", kanji: "再開" },
  wordsSet: { label: "Set four words", kanji: "合言葉" },
  wordsPickOpened: { label: "Opened a four-word pick", kanji: "選択" },
  rename: { label: "Changed the name", kanji: "改名" },
  recordClaimed: { label: "Attached a record", kanji: "引継" },
};

/**
 * The longest `detail` a row keeps. A line of fact, not a note: long enough for
 * "replaced words that were set on 2026-09-15T10:00:00.000Z", short enough that
 * nothing resembling a message can be carried in it.
 */
export const OPERATOR_DETAIL_MAX = 160;

/** How many acts the Admin tab lists, newest first. */
export const OPERATOR_ACTIONS_SHOWN = 100;
