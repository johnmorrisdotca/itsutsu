"use client";

import { BOARD_THEMES } from "@/components/board/Board.constants";
import { usePartyMarbles } from "./partyMarbles";
import { BoardFrame } from "@/components/board/BoardFrame";
import { laidEnds } from "@/lib/party/mexicanTrain/dominoes";
import { TRAIN_PHASES, mayLay, mexicanOf, openEnd, trainPlayerName } from "@/lib/party/mexicanTrain/mexicanTrain";
import { centredBaseline } from "@/lib/ui/svgText";

import { DominoFace } from "./DominoFace";
import { TRAIN_COPY } from "./party.constants";
import { HUB_HEIGHT, TABLE_UNITS, rowBoxes, tileX } from "./trainLayout";
import type { TrainTableProps } from "./train.types";

const NAME_SIZE = 3.1;
const SMALL_SIZE = 2.5;
const NAME_MOST = 10;

/** A name cut to what a row's label has room for. */
function shortName(name: string): string {
  return name.length <= NAME_MOST ? name : `${name.slice(0, NAME_MOST - 1)}…`;
}

/**
 * THE MEXICAN TRAIN TABLE ON THE SITE'S OWN WOOD.
 *
 * "Every board is the same board" (AGENTS.md): the wood, the rim and the
 * shadow are `BoardFrame`, in the reader's own board theme, and inside it the
 * hub with the round's engine double, and a row for every train
 * (`trainLayout.ts`). Nothing here is secret: every hand is shown only as how
 * many tiles it holds.
 *
 * A TRAIN SHOWS ITS LAST FEW TILES AND HOW MANY CAME BEFORE THEM. A train
 * grows to a dozen tiles and more, and nine of them on a phone would either
 * wrap the table into a different shape every turn or scroll it sideways. The
 * only thing a player needs of a train is its open end and what lies just
 * before it, so each row keeps the same place and size all game, the open end
 * always at the right, and "+7" says how much is hidden behind it.
 *
 * While a tile is held — chosen, or being dragged — every train it may go on
 * is lit, and each lit row is a target: a tap lays the tile there, and a drag
 * dropped on it does the same (`data-train`, read by the hand's drag).
 */
export function TrainTable({ game, appearance, holding = null, onTrain, readOnly = false }: TrainTableProps) {
  // Every place's marble as this table shows it, with any colour a player chose (`usePartyMarbles`).
  const marbles = usePartyMarbles();
  const theme = BOARD_THEMES[appearance.boardTheme];
  const ink = theme.line;
  const band = theme.dark ? "rgba(255,255,255,0.06)" : "rgba(58,32,8,0.07)";
  const lit = theme.dark ? "rgba(160,220,150,0.28)" : "rgba(82,102,75,0.26)";
  const mexican = mexicanOf(game);
  const rows = rowBoxes(game.trains.length);
  const playing = game.phase === TRAIN_PHASES.playing;
  const lastOpen = game.uncovered.length === 0 ? null : game.uncovered[game.uncovered.length - 1];
  const engineSize = HUB_HEIGHT * 0.5;

  return (
    <BoardFrame size={8} theme={theme} flipped={false} inset={0} lattice={false} shape="rhombus" coordinates={false}>
      <svg
        viewBox={`0 0 ${TABLE_UNITS} ${TABLE_UNITS}`}
        className="surface-light absolute inset-0 h-full w-full touch-manipulation select-none"
        data-testid="train-table"
        data-engine={game.engine}
        data-round={game.round}
        data-boneyard={game.boneyard.length}
        role="group"
        aria-label={`${TRAIN_COPY.round(game.round + 1, game.rounds)}. ${TRAIN_COPY.engine(game.engine)}. ${TRAIN_COPY.boneyard(game.boneyard.length)}.`}
      >
        {/* THE HUB, along the top: the round, the engine double in its station, and the boneyard. */}
        <g data-testid="train-hub" aria-hidden="true">
          <text x={3} y={centredBaseline(HUB_HEIGHT * 0.36, NAME_SIZE)} fontSize={NAME_SIZE} fontWeight={700} fill={ink}>
            {TRAIN_COPY.round(game.round + 1, game.rounds)}
          </text>
          <text x={3} y={centredBaseline(HUB_HEIGHT * 0.66, SMALL_SIZE)} fontSize={SMALL_SIZE} fill={ink} opacity={0.8}>
            {TRAIN_COPY.engine(game.engine)}
          </text>
          <circle cx={TABLE_UNITS / 2} cy={HUB_HEIGHT / 2} r={HUB_HEIGHT * 0.46} fill={band} stroke={ink} strokeOpacity={0.35} strokeWidth={0.3} />
          <DominoFace x={TABLE_UNITS / 2 - engineSize} y={HUB_HEIGHT / 2 - engineSize / 2} size={engineSize} ends={[game.engine, game.engine]} lie="across" testId="train-engine" />
          <DominoFace x={TABLE_UNITS - 13} y={HUB_HEIGHT * 0.2} size={3} ends={[0, 0]} lie="down" faceDown />
          <text x={TABLE_UNITS - 8.5} y={centredBaseline(HUB_HEIGHT * 0.5, NAME_SIZE)} fontSize={NAME_SIZE} fontWeight={700} fill={ink} data-testid="train-boneyard">
            {game.boneyard.length}
          </text>
        </g>

        {game.trains.map((train, at) => {
          const row = rows[at];
          const isMexican = at === mexican;
          const marble = isMexican ? null : marbles[at];
          const target = !readOnly && playing && holding !== null && mayLay(game, holding, at);
          const toMove = playing && !isMexican && at === game.toPlay;
          const shown = train.laid.slice(Math.max(0, train.laid.length - row.fits));
          const hidden = train.laid.length - shown.length;
          const mid = row.y + row.height / 2;
          const tileY = mid - row.tile / 2;
          const owner = isMexican ? TRAIN_COPY.mexicanTrain : TRAIN_COPY.their(trainPlayerName(game, at));
          const label = isMexican ? TRAIN_COPY.mexicanTrain : shortName(trainPlayerName(game, at));
          const tap = target && onTrain !== undefined ? () => onTrain(at) : undefined;
          return (
            <g
              key={at}
              data-testid="train-row"
              data-train={at}
              data-mexican={isMexican ? "true" : undefined}
              data-open={train.open ? "true" : "false"}
              data-laid={train.laid.length}
              data-end={openEnd(game, at)}
              data-target={target ? "true" : undefined}
              role={tap === undefined ? undefined : "button"}
              tabIndex={tap === undefined ? undefined : 0}
              aria-label={`${owner}: ${TRAIN_COPY.tiles(train.laid.length)}, open end ${openEnd(game, at)}${train.open && !isMexican ? ", marker out" : ""}`}
              className={tap === undefined ? undefined : "cursor-pointer outline-none"}
              onClick={tap}
              onKeyDown={(event) => {
                if (tap === undefined || (event.key !== "Enter" && event.key !== " ")) return;
                event.preventDefault();
                tap();
              }}
            >
              <rect x={1} y={row.y + 0.3} width={TABLE_UNITS - 2} height={row.height - 0.6} rx={1.4} fill={target ? lit : at % 2 === 0 ? band : "transparent"} stroke={target ? theme.winning : toMove ? (marble?.fill ?? ink) : "none"} strokeWidth={target || toMove ? 0.5 : 0} />
              {/* The owner's marble and name, or the Mexican Train's own mark. */}
              <circle cx={4.5} cy={mid} r={Math.min(2.6, row.height * 0.3)} fill={marble?.fill ?? ink} stroke="rgba(0,0,0,0.35)" strokeWidth={0.25} />
              <text x={4.5} y={centredBaseline(mid, 2.8)} fontSize={2.8} fontWeight={700} textAnchor="middle" fill={marble?.ink ?? "var(--ivory)"}>
                {marble?.letter ?? "M"}
              </text>
              <text x={8.2} y={centredBaseline(isMexican ? mid : mid - row.height * 0.17, NAME_SIZE)} fontSize={NAME_SIZE} fontWeight={600} fill={ink}>
                {label}
              </text>
              {isMexican ? null : (
                <text x={8.2} y={centredBaseline(mid + row.height * 0.22, SMALL_SIZE)} fontSize={SMALL_SIZE} fill={ink} opacity={0.8} data-testid="train-hand-count">
                  {TRAIN_COPY.tiles(game.hands[at]?.length ?? 0)}
                </text>
              )}
              {/* THE MARKER, out: anybody may lay on this train until its owner does. */}
              {train.open && !isMexican ? (
                <g data-testid="train-marker">
                  <line x1={22} y1={mid + row.height * 0.3} x2={22} y2={mid - row.height * 0.32} stroke={ink} strokeWidth={0.35} />
                  <path d={`M22 ${mid - row.height * 0.32} l3 1.1 l-3 1.1 z`} fill="var(--shu)" />
                </g>
              ) : null}
              {hidden > 0 ? (
                <text x={row.tilesX - 1.2} y={centredBaseline(mid, SMALL_SIZE)} fontSize={SMALL_SIZE} fontWeight={600} textAnchor="end" fill={ink} data-testid="train-more">
                  {TRAIN_COPY.more(hidden)}
                </text>
              ) : null}
              {shown.length === 0 ? (
                <g aria-hidden="true">
                  <rect x={tileX(row, 0)} y={tileY} width={row.tile * 2} height={row.tile} rx={row.tile * 0.14} fill="none" stroke={ink} strokeOpacity={0.45} strokeWidth={0.3} strokeDasharray="0.8 0.6" />
                  <text x={tileX(row, 0) + row.tile / 2} y={centredBaseline(mid, SMALL_SIZE)} fontSize={SMALL_SIZE} textAnchor="middle" fill={ink} opacity={0.7}>
                    {game.engine}
                  </text>
                </g>
              ) : (
                shown.map((laid, index) => {
                  const ends = laidEnds(laid);
                  const last = index === shown.length - 1;
                  const waiting = last && lastOpen === at;
                  return (
                    <DominoFace
                      key={`${train.laid.length - shown.length + index}`}
                      x={tileX(row, index)}
                      y={tileY}
                      size={row.tile}
                      ends={ends}
                      lie="across"
                      ring={waiting ? "var(--shu)" : last && target ? theme.winning : null}
                      testId="train-tile"
                      dataTile={laid}
                    />
                  );
                })
              )}
              <title>{`${owner}: ${train.laid.length === 0 ? `empty, starts with ${game.engine}` : `open end ${openEnd(game, at)}`}`}</title>
            </g>
          );
        })}
      </svg>
    </BoardFrame>
  );
}
