import { HITOTSU_COLOUR_LOOK, hitotsuCardShapes } from "../card.ts";
import { HITOTSU_CLASSIC, HITOTSU_ONE_HAND } from "../constants.ts";
import { hitotsuWords } from "../deck.ts";
import { freshSeed } from "../random.ts";
import { hitotsuComputer, hitotsuComputerJump } from "../computer.ts";
import { hitotsuWinners, playHitotsu, startHitotsu } from "../rules.ts";
import { callMatters, movesFor, playableFor, waysFor } from "../seat.ts";
import type { HitotsuCard, HitotsuColour, HitotsuGame, HitotsuMove, HitotsuNews, HitotsuOptions } from "../types.ts";
import { h, refill } from "./dom.ts";
import { injectStyle } from "./style.ts";
import { HITOTSU_STRINGS, type HitotsuStrings } from "./strings.ts";

export type HitotsuTableOptions = {
  /** Everybody at the table, seat 0 first: seat 0 is the person at this screen, the rest computers. Two to eight; four by default. */
  players?: readonly string[];
  /** The house rules: `HITOTSU_CLASSIC` (the default), `HITOTSU_PARTY`, or any mix. */
  rules?: HitotsuOptions;
  /** What wins: 200 or 500 points, or 1 for a single hand (the default). */
  size?: number;
  /** The seed the deals are shuffled from; a fresh one if not given. */
  seed?: number;
  /** Words to use instead of the built-in ones. */
  strings?: Partial<HitotsuStrings>;
  /** How long a computer thinks before it plays, in milliseconds. Long enough to jump in, where the table plays jump-in. */
  computerMs?: number;
  /** CSS variables for the table, such as `{ "--ht-felt": "#234" }`. */
  theme?: Record<`--ht-${string}`, string>;
  /** Called after every move, with the game it made. */
  onMove?: (game: HitotsuGame) => void;
};

export type HitotsuHandle = {
  /** The game as it stands. */
  game(): HitotsuGame;
  /** Deal again, with any options changed. */
  restart(options?: Omit<HitotsuTableOptions, "strings" | "theme" | "onMove">): void;
  destroy(): void;
};

const SVG = "http://www.w3.org/2000/svg";

/** One card as an element: the design's shapes (`card.ts`) drawn into an SVG. */
export function cardElement(card: HitotsuCard | null, called?: HitotsuColour): HTMLElement {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 100 140");
  svg.setAttribute("aria-hidden", "true");
  for (const shape of hitotsuCardShapes(card, called)) {
    const el = document.createElementNS(SVG, shape.kind);
    for (const [name, value] of Object.entries(shape)) {
      if (value === undefined || name === "kind" || name === "text") continue;
      el.setAttribute(name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`), String(value));
    }
    if (shape.kind === "text") {
      el.setAttribute("text-anchor", "middle");
      el.textContent = shape.text;
    }
    svg.append(el);
  }
  const box = h("span", { class: "ht-card" });
  box.append(svg);
  return box;
}

function newsLine(news: readonly HitotsuNews[], t: HitotsuStrings, name: (seat: number) => string): string {
  return news
    .map((item) => {
      switch (item.kind) {
        case "caught":
          return t.news.caught(name(item.seat));
        case "took":
          return t.news.took(name(item.seat), item.count);
        case "challenge":
          return t.news.challenge(name(item.seat), name(item.by), item.guilty);
        case "swap":
          return t.news.swap(name(item.seat), name(item.with));
        case "rotate":
          return t.news.rotate;
        case "jump":
          return t.news.jump(name(item.seat));
        case "skipped":
          return t.news.skipped(name(item.seat), item.seat === 0);
        case "reversed":
          return t.news.reversed;
        case "drew":
          return t.news.drew(name(item.seat), item.count);
      }
    })
    .join(" ");
}

/**
 * Put a table of Hitotsu into an element: the person at this screen in seat
 * 0, computers in the rest. Tap a card that glows to play it (a wild asks for
 * a colour, a seven under sevens-and-zeros for a hand to swap with), tap the
 * stock to draw, and call Hitotsu! before the second-last card goes down.
 */
export function mountHitotsu(target: HTMLElement, options: HitotsuTableOptions = {}): HitotsuHandle {
  const doc = target.ownerDocument;
  injectStyle(doc);
  const t: HitotsuStrings = { ...HITOTSU_STRINGS, ...options.strings };
  const root = h("div", { class: "ht-root" });
  for (const [name, value] of Object.entries(options.theme ?? {})) root.style.setProperty(name, value);
  target.append(root);

  let settings = { players: options.players, rules: options.rules, size: options.size, seed: options.seed, computerMs: options.computerMs };
  let game: HitotsuGame;
  let chosen: HitotsuCard | null = null;
  let calling = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const deal = () => {
    const players = settings.players ?? [t.you, t.computer(1), t.computer(2), t.computer(3)];
    const started = startHitotsu(settings.size ?? HITOTSU_ONE_HAND, players, settings.seed ?? freshSeed(), settings.rules ?? HITOTSU_CLASSIC, players.map((_, seat) => seat !== 0));
    if (started === null) throw new Error("Hitotsu is played by two to eight, to 1, 200 or 500.");
    game = started;
    chosen = null;
    calling = false;
  };
  const name = (seat: number) => game.players[seat] ?? `${seat + 1}`;

  const play = (move: HitotsuMove) => {
    const next = playHitotsu(game, move);
    if (next === null) return;
    game = next;
    chosen = null;
    calling = false;
    options.onMove?.(game);
    render();
  };

  /** The computers' turn: after a pause (the person's chance to jump in), a computer jumps in or the one to play moves. */
  const schedule = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    if (game.phase === "over" || game.toPlay === null || !game.computers[game.toPlay]) return;
    const at = game.moves.length;
    timer = setTimeout(() => {
      if (game.moves.length !== at) return;
      play(hitotsuComputerJump(game) ?? hitotsuComputer(game));
    }, settings.computerMs ?? 900);
  };

  const press = (label: string, move: HitotsuMove | null, extra: Record<string, string | boolean> = {}) =>
    h("button", { type: "button", disabled: move === null, onclick: () => move !== null && play(move), ...extra }, label);

  function actions(): HTMLElement {
    const bar = h("div", { class: "ht-actions" });
    if (game.phase === "over") {
      bar.append(h("button", { type: "button", "data-strong": true, onclick: () => (deal(), render()) }, t.again));
      return bar;
    }
    const mine = movesFor(game, 0);
    if (chosen !== null) {
      const ways = waysFor(game, 0, chosen, calling);
      for (const way of ways) {
        if (way.colour !== undefined) bar.append(press(t.colour[way.colour], way, { "data-colour": true, style: `background:${HITOTSU_COLOUR_LOOK[way.colour].fill}` }));
        else if (way.swap !== undefined) bar.append(press(t.swapWith(name(way.swap)), way));
      }
      return bar;
    }
    if (callMatters(game, 0)) bar.append(h("button", { type: "button", "data-on": calling, "aria-pressed": String(calling), onclick: () => ((calling = !calling), render()) }, calling ? t.called : t.call));
    const find = (key: "take" | "challenge" | "pass") => mine.find((move) => key in move) ?? null;
    if (find("challenge") !== null) bar.append(press(t.challenge, find("challenge"), { "data-strong": true }));
    if (find("take") !== null) bar.append(press(t.take(game.pending), find("take")));
    if (find("pass") !== null) bar.append(press(t.keep, find("pass")));
    return bar;
  }

  function tapCard(card: HitotsuCard) {
    const ways = waysFor(game, 0, card, calling);
    if (ways.length === 1) play(ways[0]!);
    else if (ways.length > 1) {
      chosen = chosen === card ? null : card;
      render();
    }
  }

  function render() {
    const over = game.phase === "over";
    const winners = over ? hitotsuWinners(game) : [];
    const top = game.discard[game.discard.length - 1] ?? null;
    const drawMove = over ? null : (movesFor(game, 0).find((move) => "draw" in move) ?? null);
    const playable = over ? [] : playableFor(game, 0);
    const status = over
      ? t.won(winners.map(name).join(" & "))
      : game.toPlay === null
        ? ""
        : game.challenge !== null
          ? t.challengeOpen(name(game.toPlay), name(game.challenge.by))
          : game.pending > 0
            ? t.facing(name(game.toPlay), game.pending)
            : game.drawn !== null
              ? t.drew(name(game.toPlay))
              : game.toPlay === 0
                ? `${t.yourTurn}. ${t.follow(t.colour[game.colour])}`
                : t.toPlay(name(game.toPlay));

    const stock = h("button", { type: "button", class: "ht-stock", disabled: drawMove === null, "aria-label": t.draw, onclick: () => drawMove !== null && play(drawMove) }, cardElement(null), t.stock(game.stock.length));
    const pile = top === null ? h("span") : cardElement(top, top[0] === "W" ? game.colour : undefined);
    pile.setAttribute("aria-label", top === null ? "" : hitotsuWords(top));
    refill(
      root,
      h(
        "div",
        { class: "ht-seats" },
        ...game.players.map((player, seat) =>
          h("div", { class: "ht-seat", "data-turn": !over && game.toPlay === seat }, h("b", {}, player), h("span", {}, t.cards(game.hands[seat]?.length ?? 0)), h("span", {}, t.points(game.scores[seat] ?? 0))),
        ),
      ),
      h(
        "div",
        { class: "ht-felt" },
        h("div", { class: "ht-piles" }, stock, h("span", { class: "ht-dir", "aria-hidden": "true" }, game.direction === 1 ? "↻" : "↺"), pile),
        h("p", { class: "ht-status", "aria-live": "polite" }, status),
        h("p", { class: "ht-news" }, newsLine(game.news, t, name)),
      ),
      h(
        "div",
        { class: "ht-hand" },
        ...(game.hands[0] ?? []).map((card) => {
          const button = h("button", { type: "button", "aria-label": hitotsuWords(card), disabled: !playable.includes(card), "data-playable": playable.includes(card), title: game.toPlay !== 0 && playable.includes(card) ? t.jumpIn : undefined, onclick: () => tapCard(card) });
          button.append(cardElement(card));
          return button;
        }),
      ),
      actions(),
    );
    schedule();
  }

  deal();
  render();

  return {
    game: () => game,
    restart(next = {}) {
      settings = { ...settings, ...next };
      if (next.seed === undefined) settings.seed = undefined;
      deal();
      render();
    },
    destroy() {
      if (timer !== undefined) clearTimeout(timer);
      root.remove();
    },
  };
}

