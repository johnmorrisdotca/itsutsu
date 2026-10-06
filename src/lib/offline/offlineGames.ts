import { CASUAL_SPECS } from "../casual/casual.constants";
import { EVERY_GAME_KEY, isCasualKind, isPartyKind, isPuzzleKind } from "../catalogue/gameKeys";
import { PARTY_PLAY_GAMES } from "../gomoku/party/partyGames";
import { casualPlayPath, joinQuery, passAndPlayPath, playPath, setUpPath } from "../gomoku/slugs";
import { PUZZLE_SPECS } from "../puzzles/puzzles.constants";
import { puzzleQuery } from "../puzzles/puzzleAddress";

/**
 * EVERY GAME, KEPT FOR OFFLINE AT ONCE: the addresses "Keep every game
 * offline" hands the keeper (`KeepAllOffline`). John, 2026-09-30, of Google
 * Maps' saved regions: "Curious if that's useful for our itsutsu too. Or if
 * it's automatic." Both: a game is kept the first time it is opened, and this
 * keeps the rest in one go, before a flight.
 *
 * Where each is played with nothing asked of the site: every game's practice
 * board, the tables of the games played round one device, every party game's
 * table, and every puzzle's set-up and a solve at its set-up's first choice
 * (any other size or level is made from that page, `PuzzlePlay`). And the
 * pages a game is found from: the games list in its views, New game, and My
 * games.
 *
 * Each is one page asked of the site, once, so the whole list is a cost paid
 * only when the button is pressed, never on a visit.
 */
export function offlineGameAddresses(): string[] {
  // The dice roller too: every roll is made in the browser, so kept, it rolls on a plane.
  const pages = ["/games", "/games/cards", "/games/list", "/games/new", "/play", "/dice"];
  for (const key of EVERY_GAME_KEY) {
    if (isPuzzleKind(key)) {
      const spec = PUZZLE_SPECS[key];
      pages.push(setUpPath(key));
      // A puzzle of fixed levels is played at a level, its first; any other is made from that page, as any other size is.
      pages.push(joinQuery(playPath(key), spec.fixedLevels === true ? `?size=${spec.defaultSize}&seed=1` : puzzleQuery({ size: spec.defaultSize, level: spec.defaultLevel, seed: null })));
    } else if (isPartyKind(key)) {
      pages.push(passAndPlayPath(key));
    } else if (isCasualKind(key)) {
      // A casual game asks nothing of the site once its page is open: its set-up, and a level of it at each of its levels, are kept.
      pages.push(setUpPath(key));
      for (let level = 1; level <= CASUAL_SPECS[key].levels; level += 1) pages.push(casualPlayPath(key, level));
    } else {
      pages.push(playPath(key));
      if (PARTY_PLAY_GAMES.includes(key)) pages.push(passAndPlayPath(key));
    }
  }
  return pages;
}
