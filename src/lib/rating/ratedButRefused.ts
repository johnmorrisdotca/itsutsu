import { isHotSeat } from "@/lib/history/liveGame";

import { ratingImpossible } from "./rateable";
import type { RatingRefusal } from "./rateable.constants";

/**
 * A ROW WHOSE `rated` COLUMN IS A CLAIM THE SITE NEVER HONOURED.
 *
 * The column's own definition, from the schema: "Whether the result moves
 * ratings." For twelve finished games on production it said true and no
 * rating ever moved — they were played at one screen, or under one name in
 * both seats, and the write path refused them before `recordResult` was ever
 * called. 0.147.2 taught the two match pages to say so; the rows themselves
 * still carry the wrong answer, and everything that trusts the column rather
 * than asking the question reads it: the record's `?rated=yes` filter lists
 * them, a fork carries the flag onto a new game, the setup screen prefills
 * "Rated" for a rematch of one.
 *
 * This is that question as a predicate over one row, so the audit and the
 * pages cannot drift: the refusal comes from `ratingImpossible`, the hot-seat
 * test from `isHotSeat`, neither restated here.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * FINISHED ROWS ONLY, AND THAT IS THE WHOLE OF WHY THIS IS NOT ONE LINE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `gameRatingRefusal` answers about a game at any stage, because a board being
 * played wants to warn its players. An AUDIT is a different question: it is
 * about to overwrite the row, so it may only speak where the answer can no
 * longer change.
 *
 * It can still change for an active game. `ratingRefusal` reads the two NAMES,
 * and a name is not settled until the game is: an anonymous seat gets a name
 * when somebody claims it, and one person's two spellings become two people
 * the moment the second seat is taken by somebody else. A live board that
 * would be refused today is a warning, not a verdict — writing `rated: false`
 * onto it would decide, on its behalf, a game still being played.
 *
 * A finished game has no such future. `recordResult` is called once, at the
 * final stone, and never again; whatever was refused then is refused for good.
 * So `false` is not a guess about a finished row, it is what happened — and
 * that is exactly the line an audit may write to.
 */
export type AuditedGame = {
  rated: boolean;
  /** "active" or "finished" — see `GameLifecycle`. Nothing is audited until finished. */
  status: string;
  blackToken: string;
  whiteToken: string;
  blackName: string;
  whiteName: string;
};

export function ratedButRefused(row: AuditedGame): RatingRefusal | null {
  if (row.status !== "finished") return null;
  if (!row.rated) return null;
  return ratingImpossible({
    hotSeat: isHotSeat(row),
    blackName: row.blackName,
    whiteName: row.whiteName,
  });
}
