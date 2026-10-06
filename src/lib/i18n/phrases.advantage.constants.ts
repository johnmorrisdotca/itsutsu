/**
 * advantage.*: the advantage panel's explanations: what each count means, why a game cannot be read, and what the threats reading is (`src/lib/gomoku/advantage.constants.ts`). A side's standing is named by its English label beside its `kanji`.
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_ADVANTAGE = {
  // What a count means, and what it means where the smaller number wins
  "advantage.discsNote": "A count, not a forecast. The lead in a flipping game changes hands late and often — a board that looks settled at move thirty rarely is.",
  "advantage.discsFewerNote": "A count, not a forecast. Here the smaller number is the better one: the object is to finish with fewer discs than your opponent.",
  "advantage.homeNote": "A count of pieces that have reached the far camp. It says how far along the race each side is, not who will get there first — a train of pieces left behind can move faster than one that is already spread out.",
  "advantage.homeFewerNote": "A count of pieces that have reached the far camp.",
  "advantage.scoreNote": "The area score as the board stands, komi included for White. It counts stones and the empty regions only one colour touches — so it cannot know which groups are dead, and a stone that will be captured is still counted until it is. Early on, most of the board belongs to nobody yet.",
  "advantage.scoreFewerNote": "The area score as the board stands, komi included for White.",
  "advantage.materialNote": "A plain count of pieces still on the board, kings included. Material is most of the game here, but a piece about to be forced into a capture is still counted — the number does not know what happens next.",
  "advantage.materialFewerNote": "A plain count of pieces still on the board, kings included.",
  // Why a game cannot be read
  "advantage.unreadable": "This game cannot be read that way",
  "advantage.unreadableTurning": "A quarter of the board turns after every stone. Nothing counted about this position survives the next move intact, so any reading of it would be out of date before it was shown.",
  "advantage.unreadableQueued": "Pieces here cover several points at once, and what you may play next is whatever the queue hands you. A reading of lines assumes single stones placed freely, and neither is true here.",
  "advantage.unreadableConnection": "The whole position is one question — whether a chain reaches side to side — and it is not a question a count of stones can answer. One stone can join two groups and settle a board that looked even.",
  "advantage.unreadableSquare": "The win is a square rather than a line, and both sides keep the same four pieces from first move to last. There is nothing to count that is not equal, and no line to read.",
  "advantage.unreadableAsymmetric": "The two players do not want the same thing here: one is trying to make a line, the other to prevent every line. There is no single quantity both sides can be ahead on.",
  "advantage.unreadableShared": "The stones do not belong to a colour in this game, so there is no black position and no white one to weigh against each other — only the shape both players are building together.",
  // The threats reading, in words
  "advantage.threatsNote": "A reading of the threats on the board, in words rather than a percentage — this site does not search the position, and a number would suggest it had.",
} as const;
