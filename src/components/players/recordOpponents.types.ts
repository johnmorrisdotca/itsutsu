import type { NamedMember } from "@/lib/auth/members";
import type { NameTag } from "@/lib/xp/nameTag.types";

/**
 * Who the opponents in a player's Recent Games are, and what the reader may do
 * about them — built on the player's page, read by `ItsutsuRecord`.
 *
 * Undefined for a reader with no account, so a page nobody can act on costs no
 * lookup at all. Every set here is of MEMBER IDS: the lists are kept by address,
 * but whether a row is somebody's buddy, somebody ignored, or the reader, is a
 * question about who a person is.
 */
export type RecordOpponents = {
  /** The opponents' member rows, by folded name. */
  members: Map<string, NamedMember>;
  /** Member ids on the reader's buddy list. */
  buddies: Set<string>;
  /** The flag, badge and level beside each opponent's name, by member id (`nameTagsOf`). */
  tags?: ReadonlyMap<string, NameTag>;
  /** Member ids the reader has ignored. */
  ignored: Set<string>;
  /** Members under 13 who have not made the reader a buddy (`closedToReader`). */
  closed: Set<string>;
  /** The reader's own member id. */
  me: string | null;
  /** `Reader.hasAccount`: whether the reader can ask anybody anything. */
  canAsk: boolean;
};
