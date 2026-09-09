import { addUp, figuresOf, type RecordFigures } from "@/lib/rating/figures";
import type { LegacyClassRecord, LegacySource } from "./legacyPlayers.types";

/**
 * The figures a kept record yields.
 *
 * The arithmetic itself belongs to the ratings — a draw is half a point there
 * and so it is half a game here — and this module only says which records to
 * do it on. A source site's total is one of those: no source ever published
 * one, so it is the sum of the classes that site counted separately.
 */

/** Everything one class of games holds — regular play, tournaments, the ladder. */
export function figuresForClass(row: LegacyClassRecord): RecordFigures {
  return figuresOf(row.record);
}

/** Everything one site holds, as the sum of its classes. */
export function figuresForSource(source: LegacySource): RecordFigures {
  return figuresOf(addUp(source.summary.map((row) => row.record)));
}

/** Everything a person did across every site they played on. */
export function figuresForPlayer(sources: readonly LegacySource[]): RecordFigures {
  return figuresOf(addUp(sources.flatMap((source) => source.summary.map((row) => row.record))));
}
