import { TENKA_MOVES, TENKA_PHASES, TENKA_WORLD_ROUNDS } from "../tenka.constants.ts";
import type { TenkaChoice, TenkaContinentKey, TenkaGame, TenkaMove } from "../tenka.types.ts";
import { mustTrade, playTenka } from "../tenka.ts";
import { cardKind, cardTerritory, setsIn } from "../tenkaCards.ts";
import { mostAttackDice } from "../tenkaDice.ts";
import { TENKA_CONTINENTS, TENKA_TERRITORIES } from "../tenkaMap.ts";
import { sensibleTenkaMove } from "../tenkaPolicy.ts";
import { startTenka } from "../tenkaStart.ts";
import { NO_CHOICE, choiceNow, marksFor, tapTerritory } from "../tenkaTaps.ts";
import { armiesHeld, territoriesHeld, tenkaPlayerName } from "../tenkaTurn.ts";
import { ownerColour } from "./colours.ts";
import { continentView, nearestLand, tenkaMapModel } from "./mapModel.ts";
import { TENKA_STYLE } from "./style.ts";
import { tenkaMapSvg } from "./svg.ts";

export type TenkaTableOptions = {
  /** The names round the table, in seat order: two to six. */
  players?: readonly string[];
  /** Which seats the computer plays. By default every seat but the first. */
  computers?: readonly boolean[];
  /** Rounds before the count: 10, 20, or 60 for the whole world. */
  rounds?: number;
  /** The seed every deal and die is drawn from; a new one each game when absent. */
  seed?: number;
  /** A colour for each seat. */
  colours?: readonly string[];
  /** How long the computer waits before each of its moves, in milliseconds. */
  computerDelayMs?: number;
  /** Told of every game after a move. */
  onChange?: (game: TenkaGame) => void;
};

export type TenkaTableHandle = {
  game: () => TenkaGame;
  /** A new game at the same table, with any options changed. */
  newGame: (options?: Pick<TenkaTableOptions, "players" | "computers" | "rounds" | "seed">) => void;
  destroy: () => void;
};

const DEFAULT_PLAYERS = ["You", "Kaze", "Yama"];

function freshSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

function node<K extends keyof HTMLElementTagNameMap>(name: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const made = document.createElement(name);
  if (className !== undefined) made.className = className;
  if (text !== undefined) made.textContent = text;
  return made;
}

function button(text: string, onClick: () => void, primary = false): HTMLButtonElement {
  const made = node("button", primary ? "tk-button tk-primary" : "tk-button", text);
  made.type = "button";
  made.addEventListener("click", onClick);
  return made;
}

function territoryName(territory: number): string {
  return TENKA_TERRITORIES[territory]!.name;
}

/**
 * A WHOLE TABLE OF TENKA IN PLAIN DOM: the map, whose turn it is and what to
 * do, the players, your cards and the last dice, played against the
 * computer (or by people taking turns on one device, with `computers` all
 * false). No framework and no server; everything is in the element given.
 *
 * Tap your own territory to place an army; to attack or move, tap where
 * from, then where to, and choose from the buttons under the map.
 */
export function mountTenka(target: HTMLElement, options: TenkaTableOptions = {}): TenkaTableHandle {
  let players = options.players ?? DEFAULT_PLAYERS;
  let computers = options.computers ?? players.map((_, seat) => seat !== 0);
  let rounds = options.rounds ?? TENKA_WORLD_ROUNDS;
  const colours = options.colours;
  const delay = options.computerDelayMs ?? 450;

  const begin = (seed: number): TenkaGame => {
    const game = startTenka(rounds, players, seed);
    if (game === null) throw new Error(`Tenka is played by two to six, for 10, 20 or 60 rounds; not ${players.length} for ${rounds}.`);
    return game;
  };

  let game = begin(options.seed ?? freshSeed());
  let choice: TenkaChoice = NO_CHOICE;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let focus: TenkaContinentKey | null = null;

  const root = node("div", "tk-root");
  const style = node("style");
  style.textContent = TENKA_STYLE;
  const status = node("p", "tk-status");
  status.setAttribute("aria-live", "polite");
  const zoom = node("div", "tk-zoom");
  zoom.setAttribute("role", "group");
  zoom.setAttribute("aria-label", "Look at");
  const board = node("div", "tk-board");
  const controls = node("div", "tk-controls");
  const dice = node("div", "tk-dice");
  const side = node("div", "tk-side");
  const main = node("div", "tk-main");
  main.append(status, zoom, board, controls, dice);
  root.append(style, main, side);
  target.append(root);

  const make = (move: TenkaMove) => {
    const next = playTenka(game, move);
    if (next === null) return;
    game = next;
    choice = choiceNow(game, choice);
    options.onChange?.(game);
    render();
  };

  const tap = (territory: number) => {
    if (computers[game.toPlay] || game.phase === TENKA_PHASES.over) return;
    const tapped = tapTerritory(game, choice, territory);
    choice = tapped.choice;
    if (tapped.move !== null) make(tapped.move);
    else render();
  };

  board.addEventListener("click", (event) => {
    const hit = (event.target as Element).closest("[data-territory]");
    if (hit !== null) {
      tap(Number(hit.getAttribute("data-territory")));
      return;
    }
    // A press on the sea takes the nearest territory within a fingertip, so an island never has to be hit exactly.
    const svg = board.querySelector("svg");
    if (svg === null) return;
    const box = svg.getBoundingClientRect();
    const view = svg.viewBox.baseVal;
    const scale = box.width / view.width;
    const near = nearestLand(view.x + (event.clientX - box.left) / scale, view.y + (event.clientY - box.top) / scale, 24 / scale);
    if (near !== null) tap(near);
  });

  const who = (seat: number) => tenkaPlayerName(game, seat);

  const armiesPicker = (least: number, most: number, start: number, act: (armies: number) => void, label: (armies: number) => string) => {
    let armies = Math.min(most, Math.max(least, start));
    const row = node("div", "tk-row");
    const slider = node("input");
    slider.type = "range";
    slider.min = String(least);
    slider.max = String(most);
    slider.value = String(armies);
    slider.disabled = least === most;
    slider.setAttribute("aria-label", "Armies");
    const go = button(label(armies), () => act(armies), true);
    slider.addEventListener("input", () => {
      armies = Number(slider.value);
      go.textContent = label(armies);
    });
    row.append(slider, go);
    return row;
  };

  function renderControls() {
    controls.replaceChildren();
    if (game.phase === TENKA_PHASES.over) {
      controls.append(button("New game", () => handle.newGame(), true));
      return;
    }
    if (computers[game.toPlay]) return;
    const now = choiceNow(game, choice);
    const hand = game.hands[game.toPlay]!;
    switch (game.phase) {
      case TENKA_PHASES.reinforce: {
        const sets = setsIn(hand);
        if (sets.length > 0) controls.append(button(mustTrade(game) ? "Trade cards (you must)" : "Trade cards", () => make({ kind: TENKA_MOVES.trade, cards: sets[0]! }), mustTrade(game)));
        if (!mustTrade(game) && now.placedOn !== null && game.reserve > 1) {
          controls.append(button(`All ${game.reserve} on ${territoryName(now.placedOn)}`, () => make({ kind: TENKA_MOVES.place, territory: now.placedOn!, armies: game.reserve })));
        }
        break;
      }
      case TENKA_PHASES.attack: {
        if (now.from !== null && now.to !== null) {
          const most = mostAttackDice(game.armies[now.from]!);
          controls.append(
            button(`Attack with ${most} ${most === 1 ? "die" : "dice"}`, () => make({ kind: TENKA_MOVES.attack, from: now.from!, to: now.to!, dice: most }), true),
            button("Blitz", () => make({ kind: TENKA_MOVES.blitz, from: now.from!, to: now.to! })),
          );
        }
        controls.append(button("Stop attacking", () => make({ kind: TENKA_MOVES.endAttack })));
        break;
      }
      case TENKA_PHASES.occupy: {
        const taking = game.occupying!;
        const most = game.armies[taking.from]! - 1;
        controls.append(armiesPicker(taking.least, most, most, (armies) => make({ kind: TENKA_MOVES.occupy, armies }), (armies) => `Move ${armies} in`));
        break;
      }
      case TENKA_PHASES.fortify: {
        if (now.from !== null && now.to !== null) {
          const most = game.armies[now.from]! - 1;
          controls.append(
            armiesPicker(1, most, now.armies, (armies) => {
              const from = now.from!;
              const to = now.to!;
              const chosen = playTenka(game, { kind: TENKA_MOVES.fortify, from, to });
              if (chosen === null) return;
              game = chosen;
              make({ kind: TENKA_MOVES.shift, armies });
            }, (armies) => `Move ${armies} to ${territoryName(now.to!)}`),
          );
        }
        controls.append(button("End turn", () => make({ kind: TENKA_MOVES.endTurn })));
        break;
      }
      default:
        break;
    }
  }

  function statusLine(): string {
    if (game.phase === TENKA_PHASES.over) {
      const names = game.winners.map(who);
      return names.length === 1 ? `${names[0]} takes the world.` : `A tie between ${names.join(" and ")}.`;
    }
    const name = who(game.toPlay);
    const round = `Round ${game.round} of ${game.rounds}. `;
    if (computers[game.toPlay]) return `${round}${name} is playing…`;
    const now = choiceNow(game, choice);
    switch (game.phase) {
      case TENKA_PHASES.setUp:
        return `${round}${name}: place an army on one of your territories (${game.setUpLeft[game.toPlay]} left).`;
      case TENKA_PHASES.reinforce:
        return mustTrade(game) ? `${round}${name}: five cards or more, so trade a set first.` : `${round}${name}: place ${game.reserve} ${game.reserve === 1 ? "army" : "armies"} on your territories.`;
      case TENKA_PHASES.attack:
        if (now.from === null) return `${round}${name}: tap a territory of yours with two armies or more to attack from, or stop attacking.`;
        if (now.to === null) return `${round}${name}: attacking from ${territoryName(now.from)}. Tap a neighbour to attack.`;
        return `${round}${name}: ${territoryName(now.from)} attacks ${territoryName(now.to)}.`;
      case TENKA_PHASES.occupy:
        return `${round}${name}: ${territoryName(game.occupying!.to)} is taken. How many move in?`;
      case TENKA_PHASES.fortify:
        if (now.from === null) return `${round}${name}: move armies once between two of your joined territories, or end your turn.`;
        if (now.to === null) return `${round}${name}: moving from ${territoryName(now.from)}. Tap where to.`;
        return `${round}${name}: from ${territoryName(now.from)} to ${territoryName(now.to)}.`;
      default:
        return round + name;
    }
  }

  function renderDice() {
    dice.replaceChildren();
    const roll = game.lastRoll;
    if (roll === null) return;
    const line = node("p", "tk-roll");
    const faces = (values: readonly number[], kind: string) => {
      const group = node("span", `tk-faces tk-${kind}`);
      for (const value of values) group.append(node("span", "tk-die", String(value)));
      return group;
    };
    line.append(
      node("span", undefined, `${territoryName(roll.from)} `),
      faces(roll.attackDice, "attack"),
      node("span", undefined, " against "),
      faces(roll.defendDice, "defend"),
      node("span", undefined, ` ${territoryName(roll.to)}${roll.throws > 1 ? `, ${roll.throws} throws` : ""}: lost ${roll.attackerLost} and ${roll.defenderLost}${roll.took ? ", taken" : ""}.`),
    );
    dice.append(line);
  }

  function renderSide() {
    side.replaceChildren();
    const list = node("ol", "tk-players");
    game.players.forEach((_, seat) => {
      const item = node("li", seat === game.toPlay && game.phase !== TENKA_PHASES.over ? "tk-player tk-to-play" : "tk-player");
      if (game.out[seat]) item.classList.add("tk-out");
      const marble = node("span", "tk-marble");
      marble.style.background = ownerColour(seat, colours);
      item.append(marble, node("span", "tk-name", who(seat)), node("span", "tk-count", `${territoriesHeld(game.owners, seat)} lands, ${armiesHeld(game, seat)} armies, ${game.hands[seat]!.length} cards`));
      list.append(item);
    });
    side.append(list);
    const human = game.players.findIndex((_, seat) => !computers[seat]);
    const shown = !computers[game.toPlay] ? game.toPlay : human;
    if (shown >= 0) {
      const hand = game.hands[shown]!;
      const cards = node("div", "tk-hand");
      cards.append(node("p", "tk-hand-title", hand.length === 0 ? `No cards in hand (${who(shown)}).` : `Cards in hand (${who(shown)})`));
      for (const card of hand) {
        const territory = cardTerritory(card);
        cards.append(node("span", `tk-card tk-${cardKind(card)}`, territory === null ? "Wild" : `${cardKind(card)}: ${territoryName(territory)}`));
      }
      side.append(cards);
    }
  }

  function renderZoom() {
    zoom.replaceChildren();
    const places: { key: TenkaContinentKey | null; name: string }[] = [{ key: null, name: "World" }, ...TENKA_CONTINENTS.map((one) => ({ key: one.key, name: one.name }))];
    for (const place of places) {
      const pick = button(place.name, () => {
        focus = place.key;
        render();
      });
      pick.setAttribute("aria-pressed", String(focus === place.key));
      zoom.append(pick);
    }
  }

  function render() {
    status.textContent = statusLine();
    const marks = computers[game.toPlay] ? marksFor(game, NO_CHOICE) : marksFor(game, choice);
    board.replaceChildren(tenkaMapSvg(tenkaMapModel(game, marks, colours), { view: continentView(focus), pixels: board.clientWidth || undefined }));
    renderZoom();
    renderControls();
    renderDice();
    renderSide();
    schedule();
  }

  function schedule() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    if (game.phase === TENKA_PHASES.over || !computers[game.toPlay]) return;
    timer = setTimeout(() => {
      timer = null;
      make(sensibleTenkaMove(game, Math.random));
    }, delay);
  }

  const handle: TenkaTableHandle = {
    game: () => game,
    newGame: (changed = {}) => {
      players = changed.players ?? players;
      computers = changed.computers ?? (changed.players === undefined ? computers : players.map((_, seat) => seat !== 0));
      rounds = changed.rounds ?? rounds;
      game = begin(changed.seed ?? freshSeed());
      choice = NO_CHOICE;
      options.onChange?.(game);
      render();
    },
    destroy: () => {
      if (timer !== null) clearTimeout(timer);
      resized?.disconnect();
      root.remove();
    },
  };

  // Counters are sized for the map's width on the screen, so a change of width draws it again.
  let drawnWidth = 0;
  const resized = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => {
    if (board.clientWidth === drawnWidth) return;
    drawnWidth = board.clientWidth;
    render();
  });
  resized?.observe(board);

  render();
  return handle;
}
