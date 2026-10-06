"use client";

import { usePartyMarbles } from "./partyMarbles";
import { BOARD_THEMES } from "@/components/board/Board.constants";
import { BoardFrame } from "@/components/board/BoardFrame";
import { MANCALA_RULE_NAMES } from "@/lib/party/mancala/mancala.constants";
import { MANCALA_RULE_SETS, MANCALA_STATUS, legalPits } from "@/lib/party/mancala/mancala";
import { partyPlayerName } from "@/lib/party/partyNames";
import { MANCALA_HOLES, pitOwner, storeOf } from "@/lib/party/mancala/sowing";
import { centredBaseline } from "@/lib/ui/svgText";

import { BOARD_UNITS, COUNT_SIZE, NAME_BOTTOM, NAME_TOP, SEED_RADIUS, countAt, holeBox, pitCell, seedSpots } from "./mancalaLayout";
import { MANCALA_SEED_TONES } from "./party.constants";
import type { MancalaBoardProps } from "./party.types";
import { mancalaWords } from "@/components/party/partyWords";
import { useSpeaker } from "@/components/i18n/LocaleProvider";

const NAME_SIZE = 5.2;
const HOLES = Array.from({ length: MANCALA_HOLES }, (_, hole) => hole);

/**
 * MANCALA ON THE SITE'S OWN BOARD.
 *
 * "Every board is the same board" (AGENTS.md): the wood, the rim and the
 * shadow are `BoardFrame`, in the reader's own board theme, and what is drawn
 * inside is only what this game has — two rows of six cups, a store at each
 * end, each player's name along their own edge, and the seeds as small pale
 * stones. Every cup and store shows its count as a number too, so nobody has
 * to count seeds (`mancalaLayout.ts` has where each sits). No coordinates: a
 * pit is named by its owner and its place, "Ann's pit 3", never a letter.
 *
 * The player to move's pits that may be sown are ringed in their colour; the
 * hole the last seed fell in is ringed in the board's own mark. A pit is a
 * button, its whole column the target, and a screen reader hears whose pit
 * it is and how many seeds it holds.
 */
export function MancalaBoard({ game, appearance, holes: drawn = null, landing = null, onPit, readOnly = false }: MancalaBoardProps) {
  const say = useSpeaker();
  const MANCALA_COPY = mancalaWords(say.locale);
  // Every place's marble as this table shows it, with any colour a player chose (`usePartyMarbles`).
  const marbles = usePartyMarbles();
  const theme = BOARD_THEMES[appearance.boardTheme];
  const holes = drawn ?? game.holes;
  const sowing = drawn !== null;
  const playing = game.status === MANCALA_STATUS.playing;
  const legal = new Set(!readOnly && playing ? legalPits(game) : []);
  const sow = !readOnly && playing && !sowing ? onPit : undefined;
  const mover = marbles[game.toPlay];
  const lastHole = !sowing && game.last !== null ? (game.last.path.at(-1) ?? null) : null;
  const cup = theme.dark ? "rgba(255,255,255,0.10)" : "rgba(58,32,8,0.20)";
  const rim = theme.dark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.28)";
  const ruleSet = MANCALA_RULE_NAMES[game.ruleSet];

  return (
    <BoardFrame size={8} theme={theme} flipped={false} inset={0} lattice={false} shape="rhombus" coordinates={false}>
      <svg
        viewBox={`0 0 ${BOARD_UNITS} ${BOARD_UNITS}`}
        className="absolute inset-0 h-full w-full touch-manipulation select-none"
        data-testid="mancala-board"
        data-rules={game.ruleSet}
        role="group"
        aria-label={say.say("party.mancala.ruleAria", { rules: ruleSet })}
      >
        {/* EACH PLAYER'S NAME ALONG THEIR OWN EDGE, with their colour and the way their seeds go. */}
        {[1, 0].map((seat) => {
          const marble = marbles[seat];
          const y = seat === 0 ? NAME_BOTTOM : NAME_TOP;
          const name = `${partyPlayerName(game, seat, say)} ${seat === 0 ? "→" : "←"}`;
          return (
            <g key={seat} data-testid="mancala-edge" data-seat={seat} aria-hidden="true">
              <circle cx={8} cy={y} r={3.2} fill={marble.fill} stroke="rgba(0,0,0,0.35)" strokeWidth={0.3} />
              <text x={8} y={centredBaseline(y, 3.6)} fontSize={3.6} fontWeight={700} textAnchor="middle" fill={marble.ink}>
                {marble.letter}
              </text>
              <text x={13} y={centredBaseline(y, NAME_SIZE)} fontSize={NAME_SIZE} fontWeight={600} fill={theme.line}>
                {name}
              </text>
            </g>
          );
        })}

        {HOLES.map((hole) => {
          const owner = pitOwner(hole);
          const box = holeBox(hole);
          const seeds = holes[hole];
          const store = owner === null;
          const seat = store ? (hole === storeOf(0) ? 0 : 1) : owner;
          const may = legal.has(hole);
          const count = countAt(hole);
          const ring = may ? mover.fill : hole === landing || hole === lastHole ? theme.winning : rim;
          return (
            <g
              key={hole}
              data-testid={store ? "mancala-store" : "mancala-hole"}
              data-hole={hole}
              data-seat={seat}
              data-seeds={seeds}
              data-last={hole === lastHole ? "true" : undefined}
            >
              <rect
                x={box.x}
                y={box.y}
                width={box.w}
                height={box.h}
                rx={store ? 5 : 4.6}
                fill={cup}
                stroke={ring}
                strokeWidth={may || hole === landing || hole === lastHole ? 0.9 : 0.35}
              />
              {seedSpots(hole, seeds).map((spot, seed) => (
                <g key={seed}>
                  <circle cx={spot.x} cy={spot.y} r={SEED_RADIUS} fill={MANCALA_SEED_TONES[(seed * 7 + hole) % MANCALA_SEED_TONES.length]} stroke="rgba(0,0,0,0.45)" strokeWidth={0.25} />
                  <circle cx={spot.x - SEED_RADIUS * 0.35} cy={spot.y - SEED_RADIUS * 0.35} r={SEED_RADIUS * 0.35} fill="rgba(255,255,255,0.7)" />
                </g>
              ))}
              <text
                x={count.x}
                y={centredBaseline(count.y, COUNT_SIZE)}
                fontSize={COUNT_SIZE}
                fontWeight={700}
                textAnchor="middle"
                fill={theme.line}
                className="tabular-nums"
                data-testid="mancala-count"
                aria-hidden="true"
              >
                {seeds}
              </text>
              <title>{store ? say.say("party.mancala.storeOf", { name: partyPlayerName(game, seat, say), store: game.ruleSet === MANCALA_RULE_SETS.kalah ? MANCALA_COPY.store : MANCALA_COPY.taken, seeds: MANCALA_COPY.seeds(seeds) }) : say.say("party.mancala.pitOf", { name: partyPlayerName(game, seat, say), seeds: MANCALA_COPY.seeds(seeds) })}</title>
            </g>
          );
        })}

        {/*
          THE PITS AS BUTTONS, over everything, each its whole column: a tap
          anywhere in it sows it. Only the player to move's pits that may be
          sown answer; the rest are there to be named, and say they may not.
        */}
        {readOnly
          ? null
          : HOLES.filter((hole) => pitOwner(hole) !== null).map((hole) => {
              const cell = pitCell(hole);
              const owner = pitOwner(hole)!;
              const may = legal.has(hole) && sow !== undefined;
              const place = owner === 0 ? hole + 1 : hole - 6;
              return (
                <rect
                  key={hole}
                  x={cell.x}
                  y={cell.y}
                  width={cell.w}
                  height={cell.h}
                  fill="transparent"
                  className={may ? "cursor-pointer outline-none" : "outline-none"}
                  role="button"
                  tabIndex={may ? 0 : -1}
                  aria-disabled={may ? undefined : true}
                  aria-label={say.say("party.mancala.pitAria", { name: partyPlayerName(game, owner, say), place: String(place), seeds: MANCALA_COPY.seeds(holes[hole]) })}
                  data-testid="mancala-pit"
                  data-pit={hole}
                  data-seeds={holes[hole]}
                  data-legal={legal.has(hole) ? "true" : undefined}
                  onClick={may ? () => sow(hole) : undefined}
                  onKeyDown={(event) => {
                    if (!may || (event.key !== "Enter" && event.key !== " ")) return;
                    event.preventDefault();
                    sow(hole);
                  }}
                />
              );
            })}
      </svg>
    </BoardFrame>
  );
}
