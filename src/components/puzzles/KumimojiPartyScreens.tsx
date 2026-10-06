"use client";

import { useState } from "react";

import { Paired } from "@/components/i18n/Paired";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import type { Speaker } from "@/lib/i18n/i18n";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";
import type { BoardThemeTokens } from "@/components/board/board.types";
import { WinCoverOver } from "@/components/game/WinCover";
import { ResultMark } from "@/components/game/ResultMark";
import { RESULT_MARKS } from "@/components/game/resultMark.constants";
import { WIN_COVER_COPY } from "@/components/game/winCover.constants";
import { TableWallpaper } from "@/components/party/TableWallpaper";
import type { WinNews } from "@/components/game/winCover.types";
import Link from "@/components/ui/Link";
import { PressLabel } from "@/components/ui/PressLabel";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PLAY_BUTTON, SECTION_HEADING, SECTION_HEADING_KANJI } from "@/components/ui/ui.constants";
import { playPath } from "@/lib/gomoku/slugs";
import { isComputer } from "@/lib/puzzles/kumimoji/party";
import type { PartyGame, PartySeat } from "@/lib/puzzles/kumimoji/party.types";
import { winnersOf } from "@/lib/puzzles/kumimoji/partyTurns";
import { KUMIMOJI_PARTY } from "@/lib/puzzles/kumimoji/tiles.constants";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";

import { ComputerMark } from "./KumimojiDeskParts";
import { KumimojiPartyAll } from "./KumimojiPartyBoards";
import { useKeptParty } from "./kumimojiPartyKept";
import { inALine, seatName } from "./kumimojiWords";

/** The play page of a kept game: its own settings and the number it was dealt to (whoever has joined or left since), and never a name. */
export function partyAddress(game: PartyGame): string {
  const s = game.settings;
  return `${playPath("kumimoji")}${puzzleQuery({ size: s.size, level: s.level, seed: s.seed, hints: s.hints, gameLength: s.gameLength, language: s.language, doubleSet: s.doubleSet, diagonals: s.diagonals, players: game.dealt })}`;
}

/**
 * WHO IS PLAYING, before the deal: a name for each seat, or none for "Player
 * 2", or a computer — "Computer 1", which plays its own turns (John,
 * 2026-09-28: "Also you can add computer bots"). At least one seat is a
 * person's. Typed here, on the play page, rather than on the set-up screen,
 * so the set-up screen keeps one height whatever number is chosen; kept only
 * in this browser, the names filled from the last game's.
 */
export function KumimojiPartyNames({
  count,
  remembered,
  replacing,
  onBegin,
}: {
  count: number;
  remembered: readonly string[];
  /** Another pass-and-play game this browser is keeping, which beginning forgets. */
  replacing: PartyGame | null;
  onBegin: (seats: PartySeat[]) => void;
}) {
  const say = useSpeaker();
  const [computers, setComputers] = useState<readonly boolean[]>(() => Array.from({ length: count }, () => false));
  const nobody = computers.every(Boolean);
  /* A computer's name as it will be dealt: numbered among the computers, in seat order. */
  const computerNumber = (at: number) => computers.slice(0, at + 1).filter(Boolean).length;
  return (
    <form
      className="flex flex-col gap-3"
      data-testid="kumimoji-party-names"
      onSubmit={(event) => {
        event.preventDefault();
        if (nobody) return;
        const form = new FormData(event.currentTarget);
        onBegin(Array.from({ length: count }, (_, at) => (computers[at] === true ? { name: "", computer: true } : { name: String(form.get(`player-${at}`) ?? "") })));
      }}
    >
      <h2 className={SECTION_HEADING}>
        <Paired en={say.say("pkumi.party.who")} kanji="誰" kanjiClassName={SECTION_HEADING_KANJI} inReadersLanguage />
      </h2>
      <p className="text-sm text-muted">
        {say.say("pkumi.party.lead", { count: String(count) })}
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {Array.from({ length: count }, (_, at) => (
          <div key={at} className="flex items-center gap-2 text-sm" data-testid="kumimoji-party-seat-row" data-at={at}>
            <label htmlFor={`kumimoji-party-player-${at}`} className="w-16 shrink-0 text-muted">
              {say.say("pkumi.party.playerLabel", { n: String(at + 1) })}
            </label>
            {computers[at] === true ? (
              <span className="flex min-w-0 flex-1 items-center rounded border border-dashed border-rule px-2 py-1.5" data-testid="kumimoji-party-seat-computer-name">
                {say.say("pkumi.party.computerName", { n: String(computerNumber(at)) })}
              </span>
            ) : (
              <input
                id={`kumimoji-party-player-${at}`}
                name={`player-${at}`}
                defaultValue={remembered[at] ?? ""}
                placeholder={say.say("pkumi.party.playerLabel", { n: String(at + 1) })}
                maxLength={KUMIMOJI_PARTY.nameMost}
                autoComplete="off"
                className="min-w-0 flex-1 rounded border border-rule bg-paper px-2 py-1.5 text-ink"
                data-testid="kumimoji-party-name"
                data-at={at}
              />
            )}
            <button
              type="button"
              aria-pressed={computers[at] === true}
              aria-label={say.say("pkumi.party.computerAria", { n: String(at + 1) })}
              className={`shrink-0 rounded-full border p-0.5 ${computers[at] === true ? "border-ochre bg-ochre-soft" : "border-transparent opacity-60 hover:opacity-100"}`}
              onClick={() => setComputers((now) => now.map((one, seat) => (seat === at ? !one : one)))}
              data-testid="kumimoji-party-seat-computer"
              data-at={at}
            >
              <ComputerMark />
            </button>
          </div>
        ))}
      </div>
      {replacing === null ? null : (
        <p className="text-sm text-muted" data-testid="kumimoji-party-replacing">
          {say.say("pkumi.party.replacing")}{say.locale === "ja" ? "" : " "}
          <Link href={partyAddress(replacing)} className="underline underline-offset-2">
            {say.say("pkumi.party.continueThat")}
          </Link>
          .
        </p>
      )}
      <p className="min-h-5 text-sm text-muted" data-testid="kumimoji-party-names-note">
        {nobody ? say.say("pkumi.party.nobody") : ""}
      </p>
      <button type="submit" className={PLAY_BUTTON} disabled={nobody} data-testid="kumimoji-party-begin">
        <PressLabel words={say.say("pkumi.party.begin")} kanji="始" />
      </button>
    </form>
  );
}

/**
 * UNDER THE PASS SCREEN: the order of play, and ending the game for
 * everybody, which asks twice.
 */
export function KumimojiPartyOrder({ game, onEnd }: { game: PartyGame; onEnd: () => void }) {
  const say = useSpeaker();
  const [ending, setEnding] = useState(false);
  return (
    <>
      <ol className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm text-muted" data-testid="kumimoji-party-order" aria-label={say.say("pkumi.party.orderAria")}>
        {game.players.map((_, at) => (
          <li key={at} className={at === game.turn ? "font-semibold text-ink" : game.resigned.includes(at) ? "line-through" : ""} data-resigned={game.resigned.includes(at) ? "true" : undefined}>
            {seatName(say, game, at)}
            {isComputer(game, at) ? marked(say, "pkumi.party.bot") : ""}
            {game.resigned.includes(at) ? marked(say, "pkumi.party.resigned") : game.out.includes(at) ? marked(say, "pkumi.party.out") : ""}
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
        {ending ? (
          <>
            <span>{say.say("pkumi.party.endAsk")}</span>
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_STRONG}`} onClick={onEnd} data-testid="kumimoji-party-end-yes">
              {say.say("pkumi.party.endYes")}
            </button>
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_QUIET}`} onClick={() => setEnding(false)}>
              {say.say("pkumi.party.keepPlaying")}
            </button>
          </>
        ) : (
          <button type="button" className="text-muted underline underline-offset-2" onClick={() => setEnding(true)} data-testid="kumimoji-party-end">
            {say.say("pkumi.party.endGame")}
          </button>
        )}
      </div>
    </>
  );
}

/** A word in brackets after a name: " (bot)" in English, "（コンピュータ）" in Japanese. */
function marked(say: Speaker, key: PhraseKey): string {
  return say.locale === "ja" ? `（${say.say(key)}）` : ` (${say.say(key)})`;
}

/** The line over the finish: who won, how. */
function headline(game: PartyGame, say: Speaker): string {
  const winners = winnersOf(game).map((at) => seatName(say, game, at));
  if (game.ending === "tied") return say.say("pkumi.party.tied", { names: inALine(say, winners) });
  if (game.ending === "standing") return say.say("pkumi.party.standing", { name: winners[0] ?? "" });
  return winners.length === 1 ? say.say("pkumi.party.wins", { name: winners[0]! }) : say.say("pkumi.party.share", { names: inALine(say, winners) });
}

/**
 * THE FINISH: who won, and every player's crossword and what was left in
 * their hand, on the same grid as All tables. Play again deals a new bag to
 * the same players.
 */
export function KumimojiPartyFinish({
  game,
  theme,
  onAgain,
  cover = null,
}: {
  game: PartyGame;
  theme: BoardThemeTokens;
  onAgain?: () => void;
  /** The win's cover over every player's crossword, when the game ended on this page (`WinCover`); none where the page around draws its own. */
  cover?: { news: WinNews | null; onClose: () => void } | null;
}) {
  const say = useSpeaker();
  const all = <KumimojiPartyAll game={game} theme={theme} />;
  return (
    <div className="flex flex-col gap-4" data-testid="kumimoji-party-finish" data-ending={game.ending ?? ""}>
      <h2 className={SECTION_HEADING} data-testid="kumimoji-party-winner">
        <ResultMark kind={game.ending === "tied" ? RESULT_MARKS.other : RESULT_MARKS.success} />
        {headline(game, say)}
      </h2>
      {cover === null ? all : (
        <WinCoverOver news={cover.news} onClose={cover.onClose}>
          {all}
        </WinCoverOver>
      )}
      {/* Again deals a new bag in this browser; a table on several devices is set again from its set-up. */}
      {onAgain === undefined ? null : (
        <button type="button" className={PLAY_BUTTON} onClick={onAgain} data-testid="kumimoji-party-again">
          <PressLabel words={WIN_COVER_COPY.againSamePlayers} kanji="再" />
        </button>
      )}
      {/* Every crossword at the table as a wallpaper; a table on several devices offers its own beside its seats. */}
      {onAgain === undefined ? null : <TableWallpaper game="kumimoji" result={headline(game, say)} />}
    </div>
  );
}

/**
 * "CONTINUE THE PASS-AND-PLAY GAME", on Kumimoji's set-up screen, while this
 * browser keeps one half played (`kumimojiPartyKept.ts`): the local game's
 * answer to the Resume a solo game has there.
 */
export function KumimojiPartyResume() {
  const say = useSpeaker();
  const game = useKeptParty();
  if (game === null || game.ending !== null) return null;
  return (
    <Link href={partyAddress(game)} className={`${BUTTON_BASE} ${BUTTON_QUIET} w-full`} data-testid="kumimoji-party-continue">
      {say.say("pkumi.party.continueGame")} →
    </Link>
  );
}
