// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { BASE_KANA, tileKana } from "../../puzzles/kumimoji/kana";
import { PARTY_SPECS } from "../party.constants";
import type { PartyLanguage } from "../party.types";
import { cleanPartyName } from "../partyNames";

import type { GhostAnswerProblem, GhostEnd, GhostGame, GhostJudge, GhostLoss, GhostMove, GhostPhase, GhostRound, GhostSeat } from "./superghost.types";

/**
 * SUPERGHOST: the rules, and nothing else.
 *
 * Players take turns adding one letter to either end of a fragment. A letter
 * that finishes a word of `shortest` letters or more loses the round for the
 * player who added it. Instead of a letter, a player may challenge the one
 * who added the last: that player must name a word with the fragment in it,
 * in order and together; if they can, the challenger loses the round, and if
 * they cannot, they do. The loser of a round takes the next letter of GHOST,
 * and begins the next round; five letters and they are out. The last player
 * left wins.
 *
 * Pure, as the engine is: every function returns a new game and leaves the
 * one it was given alone. What is a word is asked of a `GhostJudge`, handed
 * in, so these rules hold no list: the table hands them Kumimoji's
 * (`ghostWords.ts`), and a kept game is read back with the verdicts it was
 * played with, written into its moves — so My games can show a game still
 * going without fetching a dictionary to do it.
 */

export const GHOST_PHASE = { adding: "adding", answering: "answering", finished: "finished" } as const satisfies Record<GhostPhase, GhostPhase>;
export const GHOST_LOSS = { spelled: "spelled", caught: "caught", named: "named" } as const satisfies Record<GhostLoss, GhostLoss>;
export const GHOST_END = { before: "before", after: "after" } as const satisfies Record<GhostEnd, GhostEnd>;

const SPEC = PARTY_SPECS.superghost;

/**
 * The letters a player takes, one a round lost, by language. English's are
 * the game's own name. Japanese's are おばけだぞ, "it's a ghost!": ゴースト is
 * four characters, not five, and a round lost should cost the same in either
 * language.
 */
export const GHOST_WORD: Record<PartyLanguage, string> = { english: "GHOST", japanese: "おばけだぞ" };

/** Five letters, and a player is out. */
export const GHOST_OUT_AT = 5;

/** The letters of each language's alphabet, as a move is made in them. */
export const GHOST_ALPHABET: Record<PartyLanguage, string> = { english: "abcdefghijklmnopqrstuvwxyz", japanese: BASE_KANA };

/** The letter a key typed plays as: a to z from either case, a kana as its Kumimoji tile (が as か), or null. */
export function foldGhostLetter(language: PartyLanguage, typed: string): string | null {
  if (language === "english") {
    const letter = typed.toLowerCase();
    return /^[a-z]$/.test(letter) ? letter : null;
  }
  return tileKana(typed);
}

/** A word as typed, in the game's letters, or null when any character of it is not one. */
export function foldGhostWord(language: PartyLanguage, typed: string): string | null {
  const characters = [...typed.trim()];
  if (characters.length === 0) return null;
  const letters = characters.map((character) => foldGhostLetter(language, character));
  return letters.some((letter) => letter === null) ? null : letters.join("");
}

/** Whether a table of these many players, this shortest word and this language is one the game is offered for. */
export function isGhostTable(shortest: number, count: number, language: PartyLanguage): boolean {
  return (
    SPEC.sizes.includes(shortest) &&
    (SPEC.languages ?? []).includes(language) &&
    Number.isInteger(count) &&
    count >= SPEC.fewestPlayers &&
    count <= SPEC.mostPlayers
  );
}

/** A new game, nobody holding a letter, the seat `first` to begin; null for a table the game is not offered for. */
export function startGhost(shortest: number, players: readonly string[], language: PartyLanguage, first: GhostSeat = 0): GhostGame | null {
  if (!isGhostTable(shortest, players.length, language) || !Number.isInteger(first) || first < 0 || first >= players.length) return null;
  return {
    language,
    shortest,
    players: players.map(cleanPartyName),
    first,
    rounds: [],
    letters: new Array<number>(players.length).fill(0),
    starter: first,
    fragment: "",
    record: "",
    lastBy: null,
    challenger: null,
    toPlay: first,
    phase: GHOST_PHASE.adding,
    winners: [],
  };
}

/** Whether a seat is still in: fewer than five letters. */
export function ghostStillIn(game: Pick<GhostGame, "letters">, seat: GhostSeat): boolean {
  return (game.letters[seat] ?? GHOST_OUT_AT) < GHOST_OUT_AT;
}

/** The next seat round the table after `seat` who is still in. */
function nextIn(letters: readonly number[], seat: GhostSeat): GhostSeat {
  for (let step = 1; step <= letters.length; step += 1) {
    const at = (seat + step) % letters.length;
    if (letters[at] < GHOST_OUT_AT) return at;
  }
  return seat;
}

/** The fragment with a letter on one end. */
export function withLetter(fragment: string, letter: string, end: GhostEnd): string {
  return end === GHOST_END.before ? letter + fragment : fragment + letter;
}

/** Whether a fragment is a word that loses the round: the shortest length or more, and in the list. */
export function spellsWord(game: Pick<GhostGame, "shortest">, fragment: string, judge: GhostJudge): boolean {
  return [...fragment].length >= game.shortest && judge.isWord(fragment);
}

/**
 * Why a word named in answer to a challenge is not taken, or null when it
 * is: a word in the list, the shortest length or more — a shorter one could
 * never have ended the round — with the fragment in it, in order and together.
 */
export function answerProblem(game: GhostGame, word: string, judge: GhostJudge): GhostAnswerProblem | null {
  if (![...word].every((letter) => GHOST_ALPHABET[game.language].includes(letter))) return "letters";
  if ([...word].length < game.shortest) return "short";
  if (!word.includes(game.fragment)) return "missing";
  if (!judge.isWord(word)) return "unknown";
  return null;
}

/** The round over, `loser` taking a letter; the next round begun by the loser, or the next player still in. */
function endRound(game: GhostGame, loser: GhostSeat, how: GhostLoss, word: string | null, record: string, fragment: string): GhostGame {
  const letters = game.letters.map((count, seat) => (seat === loser ? count + 1 : count));
  const challenge = how !== GHOST_LOSS.spelled;
  const round: GhostRound = { fragment, loser, how, word, challenger: challenge ? game.challenger : null, challenged: challenge ? game.lastBy : null, record };
  const left = letters.flatMap((count, seat) => (count < GHOST_OUT_AT ? [seat] : []));
  const over = left.length === 1;
  const starter = letters[loser] < GHOST_OUT_AT ? loser : nextIn(letters, loser);
  return {
    ...game,
    rounds: [...game.rounds, round],
    letters,
    starter: over ? game.starter : starter,
    fragment: "",
    record: "",
    lastBy: null,
    challenger: null,
    toPlay: over ? left[0] : starter,
    phase: over ? GHOST_PHASE.finished : GHOST_PHASE.adding,
    winners: over ? left : [],
  };
}

/** The mark a move leaves in the round's record. */
function markOf(move: GhostMove, spelled: boolean): string {
  switch (move.kind) {
    case "letter":
      return `${move.end === GHOST_END.before ? "<" : ">"}${move.letter}${spelled ? "!" : ""}`;
    case "challenge":
      return "?";
    case "answer":
      return `=${move.word}.`;
    case "concede":
      return "#";
  }
}

/**
 * The game after the player to move makes `move`, or null when they may not:
 * a letter that is not one of the game's, a challenge with nobody to
 * challenge, an answer when nobody asked for one, or a word that is not
 * taken (`answerProblem`) — the table says why and asks again, rather than
 * losing a round to a slip of the finger.
 */
export function playGhost(game: GhostGame, move: GhostMove, judge: GhostJudge): GhostGame | null {
  const mover = game.toPlay;
  if (game.phase === GHOST_PHASE.adding) {
    if (move.kind === "letter") {
      if (move.letter.length !== 1 || !GHOST_ALPHABET[game.language].includes(move.letter)) return null;
      if (move.end !== GHOST_END.before && move.end !== GHOST_END.after) return null;
      const fragment = withLetter(game.fragment, move.letter, move.end);
      const spelled = spellsWord(game, fragment, judge);
      const record = game.record + markOf(move, spelled);
      if (spelled) return endRound(game, mover, GHOST_LOSS.spelled, fragment, record, fragment);
      return { ...game, fragment, record, lastBy: mover, toPlay: nextIn(game.letters, mover) };
    }
    if (move.kind === "challenge") {
      if (game.lastBy === null) return null;
      return { ...game, record: game.record + markOf(move, false), challenger: mover, toPlay: game.lastBy, phase: GHOST_PHASE.answering };
    }
    return null;
  }
  if (game.phase === GHOST_PHASE.answering && game.challenger !== null) {
    if (move.kind === "answer") {
      if (answerProblem(game, move.word, judge) !== null) return null;
      return endRound(game, game.challenger, GHOST_LOSS.named, move.word, game.record + markOf(move, false), game.fragment);
    }
    if (move.kind === "concede") return endRound(game, mover, GHOST_LOSS.caught, null, game.record + markOf(move, false), game.fragment);
  }
  return null;
}

/** Every letter at either end, then a challenge: what any turn offers, the same list every time (`ghostMoves`). */
const OFFERED = new Map<string, readonly GhostMove[]>();

function addingMoves(language: PartyLanguage, canChallenge: boolean): readonly GhostMove[] {
  const key = `${language}:${canChallenge}`;
  const already = OFFERED.get(key);
  if (already !== undefined) return already;
  const letters = [...GHOST_ALPHABET[language]].flatMap((letter): GhostMove[] => [
    { kind: "letter", letter, end: GHOST_END.before },
    { kind: "letter", letter, end: GHOST_END.after },
  ]);
  const moves = canChallenge ? [...letters, { kind: "challenge" } as const] : letters;
  OFFERED.set(key, moves);
  return moves;
}

/**
 * Every move the player to move may make, one of each kind of outcome.
 *
 * On a turn: every letter at either end — a letter need not lead to any word,
 * which is the bluff the challenge is for — and, once there is a letter to
 * answer for, the challenge. When challenged: a word from the list with the
 * fragment in it, if the list has one (any such word ends the round the same
 * way, so one stands for them all), and the admission that they have none.
 */
export function ghostMoves(game: GhostGame, judge: GhostJudge): readonly GhostMove[] {
  if (game.phase === GHOST_PHASE.adding) return addingMoves(game.language, game.lastBy !== null);
  if (game.phase === GHOST_PHASE.answering) {
    const word = judge.wordWith(game.fragment, game.shortest);
    return word === null ? [{ kind: "concede" }] : [{ kind: "answer", word }, { kind: "concede" }];
  }
  return [];
}

/** The same table again, from nothing, the next seat round beginning so that nobody always opens. */
export function ghostAgain(game: GhostGame): GhostGame {
  // The table was already one the game is offered for, so a start from it cannot be refused.
  return startGhost(game.shortest, game.players, game.language, (game.first + 1) % game.players.length)!;
}

/**
 * A round's record read back into its moves, each with the verdict it was
 * played with — a letter's, whether it spelled a word; a word named's, that
 * it was taken — or null for anything else.
 */
function movesOf(record: string): { move: GhostMove; word: boolean }[] | null {
  const moves: { move: GhostMove; word: boolean }[] = [];
  const marks = [...record];
  let at = 0;
  while (at < marks.length) {
    const mark = marks[at];
    if (mark === "<" || mark === ">") {
      const letter = marks[at + 1];
      if (letter === undefined) return null;
      const spelled = marks[at + 2] === "!";
      moves.push({ move: { kind: "letter", letter, end: mark === "<" ? GHOST_END.before : GHOST_END.after }, word: spelled });
      at += spelled ? 3 : 2;
    } else if (mark === "?") {
      moves.push({ move: { kind: "challenge" }, word: false });
      at += 1;
    } else if (mark === "#") {
      moves.push({ move: { kind: "concede" }, word: false });
      at += 1;
    } else if (mark === "=") {
      const end = marks.indexOf(".", at + 1);
      if (end === -1) return null;
      moves.push({ move: { kind: "answer", word: marks.slice(at + 1, end).join("") }, word: true });
      at = end + 1;
    } else return null;
  }
  return moves;
}

/**
 * A judge that answers as the game was judged when it was played: a letter
 * spelled a word when its record says so, and a word named was taken. Only
 * for reading a kept game back; it can say nothing about a word not played.
 */
function recordedJudge(word: boolean): GhostJudge {
  return { isWord: () => word, wordWith: () => null };
}

/**
 * A game made again from its table and its rounds, or null if any move could
 * not have been made when it was, or a round's record does not end where the
 * round did.
 */
export function replayGhost(
  shortest: number,
  players: readonly string[],
  language: PartyLanguage,
  first: GhostSeat,
  rounds: readonly string[],
  record: string,
): GhostGame | null {
  let game = startGhost(shortest, players, language, first);
  if (game === null) return null;
  for (const [index, kept] of [...rounds, record].entries()) {
    const moves = movesOf(kept);
    if (moves === null) return null;
    const done = game.rounds.length;
    for (const { move, word } of moves) {
      // Nothing is played past the end of a round or of the game.
      if (game.rounds.length !== done || game.phase === GHOST_PHASE.finished) return null;
      game = playGhost(game, move, recordedJudge(word));
      if (game === null) return null;
    }
    const ended = game.rounds.length === done + 1;
    if (index < rounds.length ? !ended : game.rounds.length !== done) return null;
    // And the record the moves make again is the one kept, mark for mark: a verdict the rules would not give is refused.
    if ((ended ? game.rounds[done].record : game.record) !== kept) return null;
  }
  return game;
}

/** The version of what `encodeGhost` writes, so a later shape can refuse an older one rather than misread it. */
const KEPT_VERSION = 1;

/** A game as text to keep: its table and its moves, round by round, never what they make. */
export function encodeGhost(game: GhostGame): string {
  return JSON.stringify({
    v: KEPT_VERSION,
    language: game.language,
    shortest: game.shortest,
    players: game.players,
    first: game.first,
    rounds: game.rounds.map((round) => round.record),
    record: game.record,
  });
}

/**
 * A kept game read back, or null for nothing kept, or for text that is not a
 * game these rules can play out again: a browser's storage is somebody's to
 * edit, and a half-understood game is worse than none.
 */
export function decodeGhost(text: string | null): GhostGame | null {
  if (text === null) return null;
  let kept: unknown;
  try {
    kept = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof kept !== "object" || kept === null) return null;
  const { v, language, shortest, players, first, rounds, record } = kept as Record<string, unknown>;
  if (v !== KEPT_VERSION || (language !== "english" && language !== "japanese")) return null;
  if (typeof shortest !== "number" || typeof first !== "number" || typeof record !== "string") return null;
  if (!Array.isArray(players) || !players.every((name) => typeof name === "string")) return null;
  if (!Array.isArray(rounds) || !rounds.every((round) => typeof round === "string")) return null;
  return replayGhost(shortest, players as string[], language, first, rounds as string[], record);
}

/** How many letters of the ghost a seat holds, as the word they spell so far: "GH", or "" for none. */
export function ghostLettersOf(game: Pick<GhostGame, "language" | "letters">, seat: GhostSeat): string {
  return [...GHOST_WORD[game.language]].slice(0, game.letters[seat] ?? 0).join("");
}
