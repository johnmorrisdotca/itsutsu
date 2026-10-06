"use client";

import { ResignedResult } from "@/components/play/ResignedResult";
import { resignedBy } from "@/lib/party/resign";
import { usePartyMarbles } from "./partyMarbles";
import { ResultMark } from "@/components/game/ResultMark";
import { RESULT_MARKS } from "@/components/game/resultMark.constants";
import type { Speaker } from "@/lib/i18n/i18n";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { partyPlayerName } from "@/lib/party/partyNames";
import { GHOST_LOSS, GHOST_PHASE, ghostStillIn } from "@/lib/party/superghost/superghost";
import type { GhostGame, GhostJudge, GhostRound } from "@/lib/party/superghost/superghost.types";

import { MarbleChip } from "./MarbleChip";
import { ghostShown } from "./party.constants";
import { ghostWords, marbleLabel } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/**
 * WHOSE TURN IT IS, by name, colour and letter — or who must name a word. At
 * the end, who is left, and how the last round went. One line while playing,
 * so the letters and the keyboard sit as high on a phone as they can; how a
 * round was lost is said where its letters were (`GhostRoundOver`).
 */
export function GhostTurnLine({ game, judge }: { game: GhostGame; judge: GhostJudge | null }) {
  const say = useSpeaker();
  const GHOST_COPY = ghostWords(say.locale);
  // Every place's marble as this table shows it, with any colour a player chose (`usePartyMarbles`).
  const marbles = usePartyMarbles();
  const last = game.rounds.at(-1) ?? null;
  if (resignedBy(game) !== null) return <ResignedResult game={game} seats={game.players.length} nameOf={(seat) => partyPlayerName(game, seat, say)} />;
  if (game.phase === GHOST_PHASE.finished) {
    const winner = game.winners[0];
    return (
      <div className={`${PANEL_CLASS} flex flex-col gap-1`} data-testid="ghost-winner" data-winners={game.winners.join(",")} aria-live="polite">
        <p className="flex items-center gap-2 text-base font-semibold">
          <ResultMark kind={RESULT_MARKS.success} />
          <MarbleChip player={winner} />
          <span>{GHOST_COPY.wins(partyPlayerName(game, winner, say))}</span>
        </p>
        {last === null ? null : <p className="text-sm text-muted">{roundWords(game, last, judge, say)}</p>}
      </div>
    );
  }
  const marble = marbles[game.toPlay];
  const answering = game.phase === GHOST_PHASE.answering;
  return (
    <div
      className={`${PANEL_CLASS} flex items-center gap-2 text-base`}
      data-testid="ghost-turn"
      data-player={game.toPlay}
      data-answering={answering ? "true" : undefined}
      aria-live="polite"
    >
      <MarbleChip player={game.toPlay} />
      <span className="min-w-0">
        <span className="font-semibold" data-testid="ghost-turn-name">
          {partyPlayerName(game, game.toPlay, say)}
        </span>
        <span className="text-muted">
          {answering ? GHOST_COPY.answering : GHOST_COPY.turn} · {say.say("party.turnTrail", { colour: marbleLabel(marble, say.locale), letter: marble.letter })}
        </span>
      </span>
    </div>
  );
}

/** How the last round was lost, said where its letters were until the next round's first letter goes down. */
export function GhostRoundOver({ game, judge }: { game: GhostGame; judge: GhostJudge | null }) {
  const say = useSpeaker();
  const last = game.rounds.at(-1);
  if (last === undefined || game.record !== "" || game.phase === GHOST_PHASE.finished) return null;
  return (
    <p className="text-center text-sm" data-testid="ghost-round-over" data-how={last.how}>
      {roundWords(game, last, judge, say)}
    </p>
  );
}

/** How a round was lost, in a sentence or two, and whether it put the loser out. */
function roundWords(game: GhostGame, round: GhostRound, judge: GhostJudge | null, say: Speaker): string {
  const GHOST_COPY = ghostWords(say.locale);
  const loser = partyPlayerName(game, round.loser, say);
  const word = round.word === null ? "" : ghostShown(round.word, game.language);
  const how =
    round.how === GHOST_LOSS.spelled
      ? GHOST_COPY.lost.spelled(loser, word)
      : round.how === GHOST_LOSS.named
        ? GHOST_COPY.lost.named(partyPlayerName(game, round.challenged ?? round.loser, say), word, loser)
        : `${GHOST_COPY.lost.caught(loser)}${judge === null ? "" : ` ${exampleFor(game, round, judge, say)}`}`;
  return ghostStillIn(game, round.loser) ? how : `${how} ${GHOST_COPY.isOut(loser)}`;
}

/** A word from the list with the fragment in it, or that it has none: said once the round is given up. */
function exampleFor(game: GhostGame, round: GhostRound, judge: GhostJudge, say: Speaker): string {
  const GHOST_COPY = ghostWords(say.locale);
  const found = judge.wordWith(round.fragment, game.shortest);
  return GHOST_COPY.lost.example(found === null ? null : ghostShown(found, game.language));
}
