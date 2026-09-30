import type { Appearance } from "@/components/board/board.types";
import { ResultMark } from "@/components/game/ResultMark";
import { RESULT_MARKS } from "@/components/game/resultMark.constants";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { GAME_STATUS, MOVE_KINDS, STONES, STONE_DISPLAY, WIN_REASONS } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { pairCount, pairPlayerOfMove, pairPlayerToMove, pairPlayers } from "@/lib/gomoku/party/pairGo";
import type { PairGoGame } from "@/lib/gomoku/party/pairGo.types";

import { PairStone } from "./PairStone";
import { PAIR_GO_COPY } from "./pairGo.constants";

/** A team as the table reads it: "Black (Aiko and Ben)". */
export function teamWords(game: PairGoGame, stone: Stone): string {
  const names = pairPlayers(game).filter((player) => player.stone === stone).map((player) => player.name);
  return `${STONE_DISPLAY[stone].label} (${names.join(" and ")})`;
}

/**
 * WHOSE MOVE IT IS, BY NAME: "Aiko (Black)" — or, once it is over, how it
 * ended and who won. While the last move was a pass it says whose, and that
 * another pass ends the game.
 */
export function PairGoTurnLine({ game, appearance }: { game: PairGoGame; appearance: Appearance }) {
  const { state } = game;
  if (state.status !== GAME_STATUS.playing) return <PairGoResult game={game} appearance={appearance} />;
  const player = pairPlayerToMove(game);
  if (player === null) return null;
  const last = state.moves.length - 1;
  const passedBy = state.moves[last]?.kind === MOVE_KINDS.pass ? pairPlayerOfMove(game, last) : null;
  return (
    <div className={`${PANEL_CLASS} flex flex-col gap-1`} data-testid="pairgo-turn" data-stone={player.stone} data-turn={player.turnOrder} aria-live="polite">
      <p className="flex items-center gap-2 text-base">
        <PairStone stone={player.stone} appearance={appearance} />
        <span className="min-w-0">
          <span className="font-semibold" data-testid="pairgo-turn-name">
            {player.name}
          </span>{" "}
          <span data-testid="pairgo-turn-colour">({STONE_DISPLAY[player.stone].label})</span>
          <span className="text-muted"> to play</span>
        </span>
      </p>
      {passedBy !== null ? (
        <p className="text-sm" data-testid="pairgo-passed">
          {PAIR_GO_COPY.passed(`${passedBy.name} (${STONE_DISPLAY[passedBy.stone].label})`)}
        </p>
      ) : (
        <p className="text-xs text-muted">{PAIR_GO_COPY.noTalking}</p>
      )}
    </div>
  );
}

/** How the game ended: the count after two passes, or a team's resignation. */
function PairGoResult({ game, appearance }: { game: PairGoGame; appearance: Appearance }) {
  const { state } = game;
  const winner = state.winner;
  if (winner === null) return null;
  const loser = winner === STONES.black ? STONES.white : STONES.black;
  const counted = state.winBy === WIN_REASONS.territory;
  const count = pairCount(game);
  const white = count.white + count.komi;
  const margin = Math.abs(count.black - white);
  return (
    <div className={`${PANEL_CLASS} flex flex-col gap-1`} data-testid="pairgo-result" data-winner={winner} data-by={state.winBy ?? ""}>
      <p className="flex items-center gap-2 text-base font-semibold">
        <ResultMark kind={RESULT_MARKS.success} />
        <PairStone stone={winner} appearance={appearance} />
        <span className="min-w-0">
          {teamWords(game, winner)} {counted ? `win by ${margin}` : "win"}
        </span>
      </p>
      {counted ? (
        <p className="text-sm" data-testid="pairgo-count">
          {PAIR_GO_COPY.counted} Black {count.black}; White {count.white} + {count.komi} komi = {white}.
        </p>
      ) : (
        <p className="text-sm">{teamWords(game, loser)} resigned.</p>
      )}
    </div>
  );
}
