"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { Paired } from "@/components/i18n/Paired";
import { TableEnding } from "@/components/play/GameEnding";
import { resignDots } from "@/lib/party/resignTables";
import { PartySeatColour } from "./PartySeatColour";

import { AskIfAway } from "@/components/game/AskIfAway";
import { WinCoverOver, useWinMoment } from "@/components/game/WinCover";
import { tableNews } from "@/components/game/winNews";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_STRONG, PANEL_CLASS, SECTION_TITLE, PLAY_SURFACE } from "@/components/ui/ui.constants";
import { DOTS_STATUS, dotsAgain, dotsLineCount, dotsPlayerName, drawLine } from "@/lib/party/dotsAndBoxes/dotsAndBoxes";
import type { DotsGame as DotsGameState } from "@/lib/party/dotsAndBoxes/dotsAndBoxes.types";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { TableWallpaper } from "./TableWallpaper";
import { resultLine } from "@/components/game/winNews";
import { DotsBoard } from "./DotsBoard";
import { DotsSetUp } from "./DotsSetUp";
import { DotsTurnLine } from "./DotsTurnLine";
import { MarbleChip } from "./MarbleChip";
import { useKeptDotsGame } from "./dotsStore";
import type { PartyTableGameProps } from "./party.types";
import { dotsWords, partyScreenWords } from "./partyWords";
import { PlayingNow } from "@/components/layout/PlayingNow";

/**
 * DOTS AND BOXES PASSED ROUND THE TABLE, at /games/dots-and-boxes/pass-and-play.
 *
 * Set up first — how many, which board, names — then the game, kept in this
 * browser after every line (`dotsStore.ts`, on `keptInBrowser`) and nowhere
 * else: no account is asked, nothing is rated, no server is told. Leave half
 * way and it is here when you come back, and waiting on My games meanwhile.
 *
 * Nothing is hidden in this game, so there is no screen to cover the board
 * between turns: whoever holds the device draws for the name the turn line
 * says, and hands it on — or keeps it, when they have just closed a box. The
 * rules are all in `lib/party/dotsAndBoxes/dotsAndBoxes.ts`; this asks it what
 * a line does, and draws the answer.
 */
export function DotsGame({ appearance, gameHref, online }: PartyTableGameProps) {
  const say = useSpeaker();
  const DOTS_COPY = dotsWords(say.locale);
  const PARTY_COPY = partyScreenWords(say.locale);
  const hydrated = useHydrated();
  const [game, keep] = useKeptDotsGame();
  // The cover over the board, when the last box is closed here (`WinCover`); never on a finished table opened again.
  const moment = useWinMoment(game === undefined || game === null ? "unknown" : game.status === DOTS_STATUS.playing ? "playing" : "ended");

  // Not read yet: the server has no browser to ask, so it draws the room the game will take and says nothing.
  if (game === undefined) {
    return <section className="min-h-[28rem]" data-testid="dots-game" {...readyMark(false)} aria-busy="true" />;
  }
  if (game === null) {
    return (
      <section className="flex flex-col gap-4" data-testid="dots-game" data-state="set-up">
        <DotsSetUp appearance={appearance} onStart={(fresh) => keep(fresh)} ready={readyMark(hydrated)} online={online} />
      </section>
    );
  }

  const onLine = (line: number) => {
    const next = drawLine(game, line);
    if (next !== null) keep(next);
  };

  return (
    <section
      className={`${PLAY_SURFACE} grid gap-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-start`}
      // A table for the size chooser (`BoardScale`): at Large and Full the board takes the room and the side keeps a width of its own.
      data-scale-desk
      data-testid="dots-game"
      data-state={game.status}
      data-players={game.players.length}
      data-lines={game.lines.length}
      {...readyMark(hydrated)}
    >
      <div className="flex min-w-0 flex-col gap-3" data-scale-board data-bare-board>
        <DotsTurnLine game={game} />
        {/* Quiet around the game while it is played (`PlayingNow`). */}
        <PlayingNow on={moment.playing} />
        <WinCoverOver
          news={
            moment.open
              ? tableNews({
                  names: game.players.map((_, seat) => dotsPlayerName(game, seat, say)),
                  winners: game.winners,
                  you: null,
                  next: { label: PARTY_COPY.again, onPress: () => keep(dotsAgain(game)) },
                })
              : null
          }
          onClose={moment.close}
        >
          <DotsBoard game={game} appearance={appearance} onLine={onLine} />
        </WinCoverOver>
        {game.status === DOTS_STATUS.playing ? <p className="text-xs text-muted">{DOTS_COPY.tap}</p> : null}
      </div>

      <aside className="flex min-w-0 flex-col gap-4">
        {/* The colour of whoever is to play, on their turn (`PartySeatColour`); furniture in just the board. */}
        {game.status === DOTS_STATUS.playing ? (
          <div data-chrome>
            <PartySeatColour seat={game.toPlay} name={dotsPlayerName(game, game.toPlay, say)} playing={game.players.length} />
          </div>
        ) : null}
        <TableScores game={game} dotsCopy={DOTS_COPY} partyCopy={PARTY_COPY} />
        <div className="flex flex-wrap gap-2">
          {game.status === DOTS_STATUS.playing ? null : (
            <button type="button" onClick={() => keep(dotsAgain(game))} className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="dots-again">
              {PARTY_COPY.again}
            </button>
          )}
          <TableEnding
            prefix="dots"
            game={game}
            playing={game.status === DOTS_STATUS.playing}
            toPlay={game.toPlay}
            seats={game.players.length}
            nameOf={(seat) => dotsPlayerName(game, seat, say)}
            onResign={(seat) => keep(resignDots(game, seat))}
            onNewGame={() => keep(null)}
          />
        </div>
        {/* The finished board as a desktop or phone wallpaper, as every board game offers its positions. */}
        {game.status === DOTS_STATUS.playing ? null : (
          <TableWallpaper game="dotsAndBoxes" result={resultLine(game.players.map((_, seat) => dotsPlayerName(game, seat, say)), game.winners)} />
        )}
        <p className="text-sm">
          <Link href={gameHref} className="underline underline-offset-4">
            {DOTS_COPY.about} →
          </Link>
        </p>
      </aside>
      {/*
        "ARE YOU STILL THERE?", as every board a person plays on asks
        (`idleWatch.coverage.test.ts`). There is no clock to stop here and
        nothing to poll, so it only says what is true: the game waits, kept.
      */}
      <AskIfAway watching={game.status === DOTS_STATUS.playing} detail={PARTY_COPY.idleDetail} kept={PARTY_COPY.idleKept} />
    </section>
  );
}

/** Who is at the table, in turn order, with the boxes each holds — the one whose turn it is marked. */
function TableScores({ game, dotsCopy, partyCopy }: { game: DotsGameState; dotsCopy: ReturnType<typeof dotsWords>; partyCopy: ReturnType<typeof partyScreenWords> }) {
  const say = useSpeaker();
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="dots-players">
      <h2 className={SECTION_TITLE}>
        <Paired en={say.say("party.players")} kanji="席" kanjiClassName="normal-case tracking-normal" inReadersLanguage />
      </h2>
      <ol className="flex flex-col gap-1.5">
        {game.players.map((_, seat) => (
          <li
            key={seat}
            className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm ${
              seat === game.toPlay && game.status === DOTS_STATUS.playing ? "bg-rule/60 font-semibold" : ""
            }`}
            data-testid="dots-player"
            data-player={seat}
            data-boxes={game.scores[seat]}
          >
            <MarbleChip player={seat} />
            <span className="min-w-0 flex-1 truncate">{dotsPlayerName(game, seat, say)}</span>
            <span className="shrink-0 text-xs text-muted tabular-nums">{dotsCopy.boxes(game.scores[seat])}</span>
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted">
        {dotsCopy.drawn(game.lines.length, dotsLineCount(game.size))} {partyCopy.kept}
      </p>
    </section>
  );
}
