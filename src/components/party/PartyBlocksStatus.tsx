"use client";

import { ResignedResult } from "@/components/play/ResignedResult";
import { resignedBy } from "@/lib/party/resign";
import { usePartyMarbles } from "./partyMarbles";
import { ResultMark } from "@/components/game/ResultMark";
import { RESULT_MARKS } from "@/components/game/resultMark.constants";
import { PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { BLOCKS_STATUS, blocksLeaders, blocksScores } from "@/lib/gomoku/party/partyBlocks";
import type { PartyBlocksState } from "@/lib/gomoku/party/partyBlocks.types";
import { partyPlayerName } from "@/lib/gomoku/party/partyRace";

import { MarbleChip } from "./MarbleChip";
import { blocksWords, marbleLabel, partyScreenWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import type { Speaker } from "@/lib/i18n/i18n";

/** Names joined as a sentence says them: "Aiko", "Aiko and Ben", "Aiko, Ben and Chloe". */
function namesOf(game: PartyBlocksState, players: readonly number[], say: Speaker): string {
  return say.list(players.map((player) => partyPlayerName(game.players, player, say)));
}

/**
 * WHOSE TURN IT IS, BY NAME AND COLOUR — "Ben's turn · Blue (B)" — and who is
 * sitting the rest of the game out; or, once nobody can lay a piece, who won
 * and by how many squares.
 */
export function PartyBlocksTurnLine({ game }: { game: PartyBlocksState }) {
  const say = useSpeaker();
  const PARTY_BLOCKS_COPY = blocksWords(say.locale);
  // Every place's marble as this table shows it, with any colour a player chose (`usePartyMarbles`).
  const marbles = usePartyMarbles();
  if (resignedBy(game) !== null) return <ResignedResult game={game} seats={game.players.length} nameOf={(seat) => partyPlayerName(game.players, seat, say)} />;
  if (game.status === BLOCKS_STATUS.over) {
    const leaders = blocksLeaders(game);
    const squares = blocksScores(game)[leaders[0]].squares;
    return (
      <div className={`${PANEL_CLASS} flex flex-col gap-1`} data-testid="blocks-result" data-winners={leaders.join(",")}>
        <p className="flex items-center gap-2 text-base font-semibold">
          <ResultMark kind={RESULT_MARKS.success} />
          {leaders.map((player) => (
            <MarbleChip key={player} player={player} />
          ))}
          <span className="min-w-0">
            {leaders.length === 1 ? PARTY_BLOCKS_COPY.won(namesOf(game, leaders, say), squares) : PARTY_BLOCKS_COPY.shared(namesOf(game, leaders, say), squares)}
          </span>
        </p>
        <p className="text-sm">{PARTY_BLOCKS_COPY.ended}</p>
      </div>
    );
  }
  const marble = marbles[game.toPlay];
  const out = game.out.flatMap((isOut, player) => (isOut ? [player] : []));
  return (
    <div className={`${PANEL_CLASS} flex flex-col gap-1`} data-testid="blocks-turn" data-player={game.toPlay} aria-live="polite">
      <p className="flex items-center gap-2 text-base">
        <MarbleChip player={game.toPlay} />
        <span className="min-w-0">
          <span className="font-semibold" data-testid="blocks-turn-name">
            {partyPlayerName(game.players, game.toPlay, say)}
          </span>
          <span className="text-muted">
            {say.say("party.turnSuffix")} · {say.say("party.turnTrail", { colour: marbleLabel(marble, say.locale), letter: marble.letter })}
          </span>
        </span>
      </p>
      {out.length > 0 ? (
        <p className="text-sm" data-testid="blocks-sitting-out">
          {PARTY_BLOCKS_COPY.sittingOut(namesOf(game, out, say))}
        </p>
      ) : null}
    </div>
  );
}

/** The four at the table in turn order: each one's squares covered, pieces left, and whether they are out. */
export function PartyBlocksPlayers({ game }: { game: PartyBlocksState }) {
  const say = useSpeaker();
  const PARTY_BLOCKS_COPY = blocksWords(say.locale);
  const PARTY_COPY = partyScreenWords(say.locale);
  const playing = game.status === BLOCKS_STATUS.playing;
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="blocks-players">
      <h2 className={SECTION_TITLE}>
        {say.say("party.players")} {say.pairsWithKanji ? <span className="font-mincho normal-case tracking-normal">席</span> : null}
      </h2>
      <ol className="flex flex-col gap-1.5">
        {blocksScores(game).map((score) => (
          <li
            key={game.players[score.player].corner}
            className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm ${playing && score.player === game.toPlay ? "bg-rule/60 font-semibold" : ""}`}
            data-testid="blocks-player"
            data-player={score.player}
            data-squares={score.squares}
            data-out={game.out[score.player] ? "true" : "false"}
          >
            <MarbleChip player={score.player} />
            <span className="min-w-0 flex-1 truncate">{partyPlayerName(game.players, score.player, say)}</span>
            {playing && game.out[score.player] ? <span className="shrink-0 text-xs text-ochre">{PARTY_BLOCKS_COPY.out}</span> : null}
            <span className="shrink-0 text-xs text-muted tabular-nums">
              {PARTY_BLOCKS_COPY.squares(score.squares)} · {PARTY_BLOCKS_COPY.piecesLeft(score.piecesLeft)}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted">
        {say.count("party.blocks.laid", game.moves.length)} {PARTY_COPY.kept}
      </p>
    </section>
  );
}
