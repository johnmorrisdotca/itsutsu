"use client";

import { PICK_CHIP_OPEN, PICK_CHIP_SHUT, PICK_WORD_CHIP } from "@/components/live/picker.constants";
import type { KumimojiLanguage, KumimojiLength } from "@/lib/puzzles/kumimoji/kumimoji.types";
import { partyFits, partyTilesNeeded } from "@/lib/puzzles/kumimoji/party";
import { KUMIMOJI_PARTY, kumimojiTileCount, TILE_MIX_TOTAL } from "@/lib/puzzles/kumimoji/tiles.constants";

import { PARTY_PLAYERS_CHIP } from "./kumimoji.constants";

const LENGTHS = ["short", "medium", "full"] as const;
const LENGTH_WORDS: Record<KumimojiLength, string> = { short: "Short", medium: "Medium", full: "Full" };

/**
 * KUMIMOJI'S OWN SET-UP CHOICES, under the puzzle's options: how many
 * players, the language, the length of the game, one set or two, Diagonals
 * and Help.
 * Each is a row of chips, as every choice on the set-up screen is, and each
 * writes into the address the set-up already builds (`puzzleQuery`).
 *
 * PLAYERS, one to eight (John, 2026-09-28: "pass and play with up to eight
 * players… we have to have the number of players as an option"). One is the
 * solo game, as it always was. More pass one device round (`KumimojiParty`),
 * and a bag must deal every hand and a round of draws (`partyFits`): a length
 * or set too small for the players is switched off here, with the reason, and
 * `gameLength` arrives already moved to the shortest that fits. The names are
 * typed on the play page, so this screen keeps one height whatever is chosen.
 */
export function KumimojiSetUpOptions({
  size,
  language,
  setLanguage,
  gameLength,
  setGameLength,
  doubleSet,
  setDoubleSet,
  diagonals,
  setDiagonals,
  hints,
  setHints,
  players,
  setPlayers,
}: {
  players: number;
  setPlayers: (players: number) => void;
  size: number;
  language: KumimojiLanguage;
  setLanguage: (language: KumimojiLanguage) => void;
  gameLength: KumimojiLength;
  setGameLength: (length: KumimojiLength) => void;
  doubleSet: boolean;
  setDoubleSet: (double: boolean) => void;
  diagonals: boolean;
  setDiagonals: (diagonals: boolean) => void;
  hints: boolean;
  setHints: (hints: boolean) => void;
}) {
  const double = doubleSet && language === "english";
  const inBag = (length: KumimojiLength, two: boolean) => kumimojiTileCount(size, length, TILE_MIX_TOTAL, two && language === "english");
  const fits = (length: KumimojiLength, two: boolean) => partyFits(players, size, inBag(length, two));
  const tooSmall = LENGTHS.filter((each) => !fits(each, double));
  /* Six or more round one device: Double in English, Full in Japanese, chosen as the count reaches it and marked, never forced. */
  const crowd = players >= KUMIMOJI_PARTY.doubleFrom;
  const recommended = language === "english" ? "Double, 288 tiles," : "Full, all 144 tiles,";
  const choosePlayers = (each: number) => {
    setPlayers(each);
    if (each < KUMIMOJI_PARTY.doubleFrom || players >= KUMIMOJI_PARTY.doubleFrom) return;
    if (language === "english") setDoubleSet(true);
    setGameLength("full");
  };
  const tooFew = (tiles: number) => `${tiles} tiles cannot deal ${players} hands of ${size} and a round of draws (${partyTilesNeeded(players, size)})`;
  return (
    <>
      <div className="grid grid-cols-8 gap-1 pt-1" role="radiogroup" aria-label="Players" data-testid="kumimoji-players">
        {Array.from({ length: KUMIMOJI_PARTY.most }, (_, at) => at + 1).map((each) => (
          <button
            key={each}
            type="button"
            role="radio"
            aria-checked={players === each}
            aria-label={each === 1 ? "One player" : `${each} players`}
            className={`${PARTY_PLAYERS_CHIP} ${players === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            onClick={() => choosePlayers(each)}
            data-testid={`kumimoji-players-${each}`}
          >
            {each}
          </button>
        ))}
      </div>
      {/* Three lines' room at a phone's width whatever it says, so the options below never move when the players do. */}
      <p className="min-h-12 text-xs text-muted" data-testid="kumimoji-players-blurb">
        {players === 1
          ? "One player: the solo game, with its clock and its leaderboard. Choose more to pass this device round."
          : `${players} players pass this device round, one bag, kept in this browser only.${crowd ? ` ${recommended} is recommended for ${KUMIMOJI_PARTY.doubleFrom} or more.` : ""}${tooSmall.length === 0 ? "" : ` ${tooSmall.map((each) => LENGTH_WORDS[each]).join(" and ")} ${tooSmall.length === 1 ? "is" : "are"} too small for ${players}.`}`}
      </p>
      <div className="grid grid-cols-2 gap-1.5 pt-1" role="radiogroup" aria-label="Language" data-testid="kumimoji-language">
        {(["english", "japanese"] as const).map((each) => (
          <button
            key={each}
            type="button"
            role="radio"
            aria-checked={language === each}
            className={`${PICK_WORD_CHIP} ${language === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            onClick={() => {
              setLanguage(each);
              if (each === "japanese") setDoubleSet(false);
            }}
            data-testid={`kumimoji-language-${each}`}
          >
            {each === "english" ? "English" : "Japanese · ひらがな"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5 pt-1" role="radiogroup" aria-label="Game length" data-testid="kumimoji-length">
        {LENGTHS.map((each) => (
          <button
            key={each}
            type="button"
            role="radio"
            aria-checked={gameLength === each}
            className={`${PICK_WORD_CHIP} ${gameLength === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            onClick={() => setGameLength(each)}
            disabled={!fits(each, double)}
            title={fits(each, double) ? undefined : tooFew(inBag(each, double))}
            data-testid={`kumimoji-length-${each}`}
          >
            {LENGTH_WORDS[each]} · {inBag(each, double)}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Tile set" data-testid="kumimoji-double">
        {[false, true].map((each) => (
          <button
            key={String(each)}
            type="button"
            role="radio"
            aria-checked={doubleSet === each}
            className={`${PICK_WORD_CHIP} ${doubleSet === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            onClick={() => language === "english" && setDoubleSet(each)}
            disabled={(each && language === "japanese") || !fits(gameLength, each)}
            title={fits(gameLength, each) ? undefined : tooFew(inBag(gameLength, each))}
            data-testid={`kumimoji-double-${each ? "on" : "off"}`}
            data-recommended={each && crowd && language === "english" ? "true" : undefined}
          >
            {each ? "Double" : "One set"} · {kumimojiTileCount(size, gameLength, TILE_MIX_TOTAL, each && language === "english")}
            {each && crowd && language === "english" ? <span aria-label=", recommended"> ★</span> : null}
          </button>
        ))}
      </div>
      {/*
        DIAGONALS, chosen here or not at all (John, 2026-09-28: "we could
        allow people to play diagonally… An option at startup is the right
        choice"): every diagonal run of three or more tiles must be a word
        too (`judgeGrid`). Off by default, and part of the game, as the
        language is: the address, a kept game and a race all carry it.
      */}
      <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Diagonals" data-testid="kumimoji-diagonals-choice">
        {[false, true].map((each) => (
          <button
            key={String(each)}
            type="button"
            role="radio"
            aria-checked={diagonals === each}
            className={`${PICK_WORD_CHIP} ${diagonals === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            onClick={() => setDiagonals(each)}
            title={each ? "Three or more tiles in a line corner to corner must spell a word too, read downward." : "Words across and down only; tiles may touch at a corner."}
            data-testid={`kumimoji-diagonals-${each ? "on" : "off"}`}
          >
            {each ? "Diagonals" : "No diagonals"} <span className="font-mincho opacity-70">{each ? "斜め有" : "斜め無"}</span>
          </button>
        ))}
      </div>
      {/*
        HELP, chosen here or not at all (John, 2026-09-28: "can only be
        turned on as an option before you start the game"): the puzzles'
        own hints switch, which a Kumimoji spends on arranging the hand
        into a word (`help.ts`).
      */}
      <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Help" data-testid="kumimoji-help-choice">
        {[false, true].map((each) => (
          <button
            key={String(each)}
            type="button"
            role="radio"
            aria-checked={hints === each}
            className={`${PICK_WORD_CHIP} ${hints === each ? PICK_CHIP_OPEN : PICK_CHIP_SHUT}`}
            onClick={() => setHints(each)}
            data-testid={`kumimoji-help-${each ? "on" : "off"}`}
          >
            {each ? "Help" : "No help"} <span className="font-mincho opacity-70">{each ? "助け有" : "助け無"}</span>
          </button>
        ))}
      </div>
    </>
  );
}
