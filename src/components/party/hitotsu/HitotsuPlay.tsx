"use client";

import { GAME_ENDING_COPY } from "@/components/play/gameEnding.constants";
import { resignedBy, resignWinners } from "@/lib/party/resign";
import { TableEnding } from "@/components/play/GameEnding";
import { resignHitotsu } from "@/lib/party/resignTables";
import { useState } from "react";

import type { Appearance } from "@/components/board/board.types";
import { FeltPatches } from "@/components/board/FeltPatches";
import { useFeltChoice } from "@/components/board/useFeltChoice";
import { useCardSounds } from "@/components/cards/useCardSounds";
import { AskIfAway } from "@/components/game/AskIfAway";
import { WinCoverOver, useWinMoment } from "@/components/game/WinCover";
import { resultLine, tableNews } from "@/components/game/winNews";
import Link from "@/components/ui/Link";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS, PLAY_SURFACE } from "@/components/ui/ui.constants";
import { HITOTSU_ONE_HAND, type HitotsuGame, type HitotsuMove, hitotsuWinners, playHitotsu, startHitotsu } from "@johnmorrisdotca/hitotsu";

import { CardScores } from "../cards/CardScores";
import { seatName } from "../cards/cardAdapters";
import { freshCardSeed } from "../cards/cardTableStores";
import { TableWallpaper } from "../TableWallpaper";
import { HitotsuDesk } from "./HitotsuDesk";
import { hitotsuNewsLine, hitotsuStatus } from "./hitotsuPresses";
import { HitotsuSeats } from "./HitotsuSeats";
import { HitotsuTableTop } from "./HitotsuTableTop";
import { useHitotsuComputer } from "./useHitotsuComputer";
import { cardTableWords, hitotsuScreenWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * A GAME OF HITOTSU ROUND ONE DEVICE, with a computer in any seat nobody sits
 * in: everybody else along the top, the table in the middle, and the hand of
 * whoever holds the device along the foot — as the family card games are
 * played (`CardPlay`), with the deck of its own.
 *
 * HIDDEN HANDS. With one person at the table, their hand is always theirs to
 * see, and they may jump in from it at anybody's turn where the table plays
 * jump-in. With two or more, whenever a different person's turn comes the
 * table covers every hand and asks for the device to be passed on by name,
 * and shows that player's cards only once they say they have it.
 */
export function HitotsuPlay({ game, keep, appearance, gameHref, ready }: { game: HitotsuGame; keep: (game: HitotsuGame | null) => void; appearance: Appearance; gameHref: string; ready: { "data-ready": string } }) {
  const say = useSpeaker();
  const CARD_TABLE_COPY = cardTableWords(say.locale);
  const HITOTSU_COPY = hitotsuScreenWords(say.locale);
  const names = game.players.map((_, seat) => seatName(game.players, game.computers, seat));
  const name = (seat: number) => names[seat] ?? `Player ${seat + 1}`;
  const over = game.phase === "over";
  const toPlay = over ? null : game.toPlay;
  const people = game.players.map((_, seat) => seat).filter((seat) => !game.computers[seat]);
  const [handedTo, setHandedTo] = useState<number | null>(people.length === 1 ? people[0] : null);
  const { felt, chooseFelt } = useFeltChoice(appearance);
  const sound = useCardSounds(game.hands.reduce((sum, hand) => sum + hand.length, 0));
  const personToPlay = toPlay !== null && !game.computers[toPlay];
  const covered = !over && people.length > 1 && personToPlay && handedTo !== toPlay;
  const viewer = people.length === 1 ? people[0] : covered ? null : personToPlay ? toPlay : handedTo;
  const thinking = useHitotsuComputer(game, keep);
  const moment = useWinMoment(over ? "ended" : "playing");
  const resigned = resignedBy(game);
  const winners = resigned !== null ? resignWinners(game.players.length, resigned) : over ? hitotsuWinners(game) : [];
  const play = (move: HitotsuMove) => {
    const next = playHitotsu(game, move);
    if (next !== null) keep(next);
  };
  const again = () => {
    const fresh = startHitotsu(game.size, game.players, freshCardSeed(), game.options, game.computers);
    if (fresh !== null) keep(fresh);
  };
  const news = hitotsuNewsLine(game, name);

  return (
    <section
      className={`${PLAY_SURFACE} flex flex-col gap-3`}
      data-testid="hitotsu-game"
      data-state={over ? "finished" : "playing"}
      data-moves={game.moves.length}
      data-to-play={toPlay ?? undefined}
      data-viewer={viewer ?? undefined}
      data-covered={covered ? "true" : "false"}
      {...ready}
    >
      <div className="flex min-h-16 flex-col gap-0.5">
        <p className="text-base font-semibold" data-testid="hitotsu-status" aria-live="polite">
          {over ? (resigned !== null ? `${HITOTSU_COPY.over}: ${GAME_ENDING_COPY.resignedResult(name(resigned), winners.map(name))}` : `${HITOTSU_COPY.over}: ${HITOTSU_COPY.won(winners.map(name).join(" and "))}`) : thinking && toPlay !== null ? HITOTSU_COPY.thinking(name(toPlay)) : hitotsuStatus(game, name)}
        </p>
        <p className="text-sm text-muted" data-testid="hitotsu-news">
          {news}
        </p>
      </div>
      <HitotsuSeats
        seats={names.map((_, seat) => seat).filter((seat) => seat !== viewer)}
        names={names}
        computers={game.computers}
        counts={game.hands.map((hand) => hand.length)}
        scores={game.scores}
        toPlay={toPlay}
      />
      <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-3" data-width-reason="a card table wider than a hand of cards spreads the pile past where the eye can take it in with the hand" data-scale-board data-bare-board data-testid="hitotsu-board">
        <WinCoverOver
          news={moment.open ? tableNews({ names, winners, you: people.length === 1 ? people[0]! : null, next: { label: HITOTSU_COPY.again, onPress: again } }) : null}
          onClose={moment.close}
        >
          <HitotsuTableTop game={game} appearance={{ ...appearance, felt }} />
        </WinCoverOver>
        {/* Beside the table in just the board on a desk, where under it would run past the window's foot (globals.css). */}
        {covered && toPlay !== null ? (
          <div className={`${PANEL_CLASS} flex flex-col items-center gap-2 text-center`} data-testid="hitotsu-pass-device" data-bare-beside>
            <p className="text-lg font-semibold">{HITOTSU_COPY.passTo(name(toPlay))}</p>
            <p className="text-sm text-muted">{HITOTSU_COPY.passNote}</p>
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_STRONG}`} onClick={() => setHandedTo(toPlay)} data-testid="hitotsu-ready">
              {HITOTSU_COPY.ready(name(toPlay))}
            </button>
          </div>
        ) : viewer === null || over ? null : (
          <div data-bare-beside>
            <HitotsuDesk game={game} seat={viewer} active label={people.length === 1 ? HITOTSU_COPY.yourHand : HITOTSU_COPY.handOf(name(viewer))} name={name} onMove={play} />
          </div>
        )}
      </div>
      <CardScores names={names} scoreWords={game.size === HITOTSU_ONE_HAND ? HITOTSU_COPY.handWords : HITOTSU_COPY.scoreWords} standing={(seat) => ({ score: String(game.scores[seat]) })} winners={winners} />
      <div className="flex flex-wrap items-center gap-2">
        {over ? (
          <button type="button" onClick={again} className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="hitotsu-again">
            {HITOTSU_COPY.again}
          </button>
        ) : null}
        <FeltPatches felt={felt} wood={appearance.boardTheme} onChoose={chooseFelt} />
        <button type="button" onClick={sound.toggle} aria-pressed={sound.on} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="card-sound" data-on={sound.on ? "true" : "false"}>
          {sound.on ? CARD_TABLE_COPY.soundOn : CARD_TABLE_COPY.soundOff}
        </button>
        <TableEnding
          prefix="hitotsu"
          game={game}
          playing={!over}
          toPlay={game.toPlay}
          seats={game.players.length}
          nameOf={name}
          onResign={(seat) => keep(resignHitotsu(game, seat))}
          onNewGame={() => keep(null)}
        />
      </div>
      {over ? <TableWallpaper game="hitotsu" result={resultLine(names, winners)} /> : null}
      <p className="text-xs text-muted">{HITOTSU_COPY.kept}</p>
      <p className="text-sm">
        <Link href={gameHref} className="underline underline-offset-4">
          {HITOTSU_COPY.about} →
        </Link>
      </p>
      <AskIfAway watching={!over} detail={HITOTSU_COPY.idleDetail} kept={HITOTSU_COPY.idleKept} />
    </section>
  );
}
