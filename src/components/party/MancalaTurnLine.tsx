import { ResignedResult } from "@/components/play/ResignedResult";
import { resignedBy } from "@/lib/party/resign";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { ResultMark } from "@/components/game/ResultMark";
import { RESULT_MARKS } from "@/components/game/resultMark.constants";
import { MANCALA_RULE_NAMES } from "@/lib/party/mancala/mancala.constants";
import { MANCALA_STATUS } from "@/lib/party/mancala/mancala";
import { partyPlayerName } from "@/lib/party/partyNames";
import type { MancalaGame } from "@/lib/party/mancala/mancala.types";
import { storeOf } from "@/lib/party/mancala/sowing";

import { MarbleChip } from "./MarbleChip";
import { mancalaWords } from "@/components/party/partyWords";
import type { Speaker } from "@/lib/i18n/i18n";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

/** What the last sowing did, in a line, or null when it did nothing worth saying. */
function lastSaid(game: MancalaGame, say: Speaker): { kind: "again" | "captured" | "grandSlam"; text: string } | null {
  const MANCALA_COPY = mancalaWords(say.locale);
  const last = game.last;
  if (last === null) return null;
  const name = partyPlayerName(game, last.by, say);
  if (last.again && game.status === MANCALA_STATUS.playing) return { kind: "again", text: MANCALA_COPY.again(name) };
  if (last.captured > 0) return { kind: "captured", text: MANCALA_COPY.captured(name, last.captured) };
  if (last.grandSlam) return { kind: "grandSlam", text: MANCALA_COPY.grandSlam(name, partyPlayerName(game, last.by === 0 ? 1 : 0, say)) };
  return null;
}

/**
 * WHOSE TURN IT IS, by name and marble (their colour and letter, as on the
 * board's edge), and which rules are being
 * played — and, under it, what the last seed did: another turn, so many
 * captured, or a grand slam that took nothing. At the end, who won and by how
 * many seeds, and why it ended.
 *
 * The line about the last seed waits while a sowing is still being drawn
 * (`sowing`), so it is said as the seed lands rather than before.
 */
export function MancalaTurnLine({ game, sowing }: { game: MancalaGame; sowing: boolean }) {
  const say = useSpeaker();
  const MANCALA_COPY = mancalaWords(say.locale);
  const rules = MANCALA_RULE_NAMES[game.ruleSet];
  const said = sowing ? null : lastSaid(game, say);

  if (resignedBy(game) !== null) return <ResignedResult game={game} seats={game.players.length} nameOf={(seat) => partyPlayerName(game, seat, say)} />;
  if (game.status === MANCALA_STATUS.finished) {
    const [near, far] = [game.holes[storeOf(0)], game.holes[storeOf(1)]];
    const winner = game.winners.length === 1 ? game.winners[0] : null;
    const score = winner === null ? say.say("party.mancala.scoreEach", { seeds: MANCALA_COPY.seeds(near) }) : say.say("party.mancala.scoreTo", { seeds: MANCALA_COPY.seeds(winner === 0 ? near : far), other: String(winner === 0 ? far : near) });
    return (
      <div className={`${PANEL_CLASS} flex flex-col gap-1`} data-testid="mancala-winner" data-winners={game.winners.join(",")} data-ending={game.ending ?? undefined} aria-live="polite">
        <p className="flex flex-wrap items-center gap-2 text-base font-semibold">
          <ResultMark kind={winner === null ? RESULT_MARKS.other : RESULT_MARKS.success} />
          {game.winners.map((seat) => (
            <MarbleChip key={seat} player={seat} />
          ))}
          <span>{winner === null ? say.say("party.mancala.draw", { score }) : say.say("party.mancala.wins", { name: partyPlayerName(game, winner, say), score })}</span>
        </p>
        <p className="text-sm text-muted">
          {say.sentence(rules)} {game.ending === null ? null : MANCALA_COPY.ending[game.ending]}
        </p>
      </div>
    );
  }

  return (
    <p className={`${PANEL_CLASS} flex items-center gap-2 text-base`} data-testid="mancala-turn" data-player={game.toPlay} aria-live="polite">
      <MarbleChip player={game.toPlay} />
      <span className="flex min-w-0 flex-col">
        <span>
          <span className="font-semibold" data-testid="mancala-turn-name">
            {partyPlayerName(game, game.toPlay, say)}
          </span>
          <span className="text-muted">
            {say.say("party.turnSuffix")} · <span data-testid="mancala-rules-name">{rules}</span>
          </span>
        </span>
        {/* Always in its place and two lines tall, hidden when there is nothing to say, so the board never moves under a finger. */}
        <span
          className={`min-h-10 text-sm font-semibold ${said === null ? "invisible" : ""}`}
          data-testid={said === null ? undefined : "mancala-result"}
          data-kind={said?.kind}
          aria-hidden={said === null ? true : undefined}
        >
          {said?.text ?? MANCALA_COPY.again(partyPlayerName(game, game.toPlay, say))}
        </span>
      </span>
    </p>
  );
}
