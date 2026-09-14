import type { OpeningRule, Stone } from "@/lib/gomoku/gomoku.types";
import type { BotTier } from "@/lib/gomoku/opponent.types";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";
import type { RatingRefusal } from "@/lib/rating/rateable.constants";
import type { Opponent } from "@/lib/social/opponents";

import type { SetUpOpponent } from "./setUp.types";

/**
 * The shapes behind the set-up screen's tile pickers — the opening, whether it
 * counts, and who it is against. The game and the board pickers came first and
 * keep their props where they were written; these three were written to the
 * pattern AGENTS.md asks for.
 */

/** The heading a run of opponents sits under. */
export type OpponentGroupKind = "asked" | "here" | "known" | "computer";

/** One person or program somebody could choose, as the tile that offers them. */
export type OpponentTile = {
  /** The value the choice holds, `m:<id>` or `c:<id>` — see `opponentOptions.ts`. */
  value: string;
  name: string;
  /** A program. Said by the value's prefix, so a named program the list lacks is still one. */
  computer: boolean;
  /**
   * The grade, for a program this game offers — which is what lets its tile say
   * how strong it is. Null for a person, and for a program the address named
   * that this game does not have, whose grade is not this list's to vouch for.
   */
  tier: BotTier | null;
};

export type OpponentGroup = { kind: OpponentGroupKind; tiles: OpponentTile[] };

/** A heading's words: the phrase that switches language, and the kanji already beside it. */
export type GroupWords = { phrase: PhraseKey; kanji: string };

/** One answer to "does this game count". */
export type RatedTile = {
  rated: boolean;
  /** The word the tile carries for a test to find, and the old select's value. */
  word: "rated" | "friendly";
  phrase: PhraseKey;
  means: PhraseKey;
};

/** A stone in an opening's little picture, counted in cells from the top left. */
export type MarkStone = { row: number; col: number; colour: Stone };

/** The central square an opening restricts, in cells from the top left. */
export type MarkZone = { from: number; span: number };

export type OpeningPickerProps = {
  /** The draft's opening. */
  value: string;
  /** Which game, because which openings are offered is a fact about it. */
  variant: string;
  /** The chosen board, so each picture is drawn at the density that will be played on. */
  size: number;
  onChange: (opening: OpeningRule) => void;
  disabled?: boolean;
};

export type OpeningMarkProps = { opening: OpeningRule; size: number; px: number };

export type RatedPickerProps = {
  value: boolean;
  /** Why this game could never count, or null while it is still a choice. See `RulesForm`. */
  refused: RatingRefusal | null;
  onChange: (rated: boolean) => void;
  disabled?: boolean;
};

export type OpponentChoiceProps = {
  value: string;
  onChange: (next: string) => void;
  /** Which game, because a specialist program is offered at its own and nowhere else. */
  variant: string;
  opponents: Opponent[];
  /** Somebody the address named, so they are offered even when the list would not have them. */
  named: SetUpOpponent | null;
  disabled?: boolean;
  signedIn: boolean;
};
