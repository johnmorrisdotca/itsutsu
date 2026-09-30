import { generateKumimoji } from "../generate.ts";
import { judgeWithWords } from "../judge.ts";
import type { KumimojiDeal, KumimojiLanguage, KumimojiLength, KumimojiLevel } from "../kumimoji.types.ts";
import { assignHandTile, deal, draw, isFinished, liftAll, liftToHand, mayDraw, mayTrade, moveOnTable, placeFromHand, sortHand, swapWithHand, tilesLeft, trade, type TilePlay } from "../play.ts";
import { KUMIMOJI_HANDS } from "../tiles.constants.ts";
import { tileFace } from "../tileFace.ts";
import { loadTileWords, type TileWords } from "../tileWords.ts";
import { boardModel } from "./board.ts";
import { KUMIMOJI_STYLE } from "./style.ts";

export type KumimojiTableOptions = {
  language?: KumimojiLanguage;
  /** The opening hand: 3, 7 or 11 tiles. */
  hand?: number;
  level?: KumimojiLevel;
  gameLength?: KumimojiLength;
  /** Every diagonal run of three or more must be a word too. */
  diagonals?: boolean;
  /** The seed the bag is dealt from; a new one each game when absent. */
  seed?: number;
  /** Told when the last tile is laid and every run is a word, with the time it took. */
  onFinish?: (result: { deal: KumimojiDeal; play: TilePlay; elapsedMs: number }) => void;
};

export type KumimojiTableHandle = {
  play: () => TilePlay | null;
  newGame: (options?: Omit<KumimojiTableOptions, "onFinish">) => Promise<void>;
  destroy: () => void;
};

/** What is picked up: a tile in the hand, or one on the table. */
type Held = { from: "hand"; at: number } | { from: "table"; square: string } | null;

function node<K extends keyof HTMLElementTagNameMap>(name: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const made = document.createElement(name);
  if (className !== undefined) made.className = className;
  if (text !== undefined) made.textContent = text;
  return made;
}

function button(text: string, onClick: () => void, primary = false): HTMLButtonElement {
  const made = node("button", primary ? "km-button km-primary" : "km-button", text);
  made.type = "button";
  made.addEventListener("click", onClick);
  return made;
}

function clock(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * A GAME OF KUMIMOJI ALONE, IN PLAIN DOM: the bag dealt from a seed, your
 * hand, and a table to build your crossword on, every run judged as you lay
 * it. Tap a tile in your hand and then a square to lay it; tap a tile on the
 * table and then a square to move it, or tap it again to take it back. When
 * the hand is empty and every run is a word, Draw brings the next tile; a
 * tile you cannot use can be traded for three. Use every tile in the bag to
 * finish.
 *
 * The word list is fetched the first time a game in its language is dealt.
 */
export function mountKumimoji(target: HTMLElement, options: KumimojiTableOptions = {}): KumimojiTableHandle {
  let settings: Omit<KumimojiTableOptions, "onFinish"> = { ...options };
  let words: TileWords | null = null;
  let dealt: KumimojiDeal | null = null;
  let play: TilePlay | null = null;
  let held: Held = null;
  let started = 0;
  let finishedAt: number | null = null;
  let destroyed = false;

  const root = node("div", "km-root");
  const style = node("style");
  style.textContent = KUMIMOJI_STYLE;
  const status = node("p", "km-status");
  status.setAttribute("aria-live", "polite");
  const board = node("div", "km-board");
  const notes = node("p", "km-notes");
  const hand = node("div", "km-hand");
  const picker = node("div", "km-picker");
  const controls = node("div", "km-controls");
  root.append(style, status, board, notes, picker, hand, controls);
  target.append(root);

  const tick = setInterval(() => {
    if (play !== null && finishedAt === null) renderStatus();
  }, 1000);

  const verdictOf = (now: TilePlay) => judgeWithWords(now.tiles, words!, { diagonals: settings.diagonals === true });

  const change = (next: TilePlay) => {
    play = next;
    const verdict = verdictOf(next);
    if (finishedAt === null && isFinished(next, verdict)) {
      finishedAt = Date.now();
      options.onFinish?.({ deal: dealt!, play: next, elapsedMs: finishedAt - started });
    }
    render();
  };

  const tapSquare = (square: string) => {
    if (play === null || finishedAt !== null) return;
    const there = play.tiles.get(square);
    if (held === null) {
      if (there !== undefined) held = { from: "table", square };
      render();
      return;
    }
    if (held.from === "hand") {
      const at = held.at;
      const tile = play.hand[at];
      if (tile === undefined) return;
      // A wild is given a letter before it is laid.
      if (tile === "*") return;
      held = null;
      change(there === undefined ? placeFromHand(play, at, square) : swapWithHand(play, at, square));
      return;
    }
    const from = held.square;
    held = null;
    change(from === square ? liftToHand(play, square) : moveOnTable(play, from, square));
  };

  const tapHand = (at: number) => {
    if (play === null || finishedAt !== null) return;
    held = held?.from === "hand" && held.at === at ? null : { from: "hand", at };
    render();
  };

  board.addEventListener("click", (event) => {
    const square = (event.target as Element).closest("[data-square]")?.getAttribute("data-square");
    if (square !== null && square !== undefined) tapSquare(square);
  });
  hand.addEventListener("click", (event) => {
    const at = (event.target as Element).closest("[data-hand]")?.getAttribute("data-hand");
    if (at !== null && at !== undefined) tapHand(Number(at));
  });

  function renderStatus() {
    if (play === null) {
      status.textContent = "Dealing…";
      return;
    }
    const left = tilesLeft(play);
    const time = clock((finishedAt ?? Date.now()) - started);
    status.textContent = finishedAt !== null ? `Finished in ${time}. Every tile laid, every run a word.` : `${left} ${left === 1 ? "tile" : "tiles"} left in the bag · ${time}`;
  }

  function renderBoard(verdict: ReturnType<typeof verdictOf>) {
    const model = boardModel(play!.tiles, play!.tiles.size === 0 ? null : verdict, words!.glyphOf);
    const grid = node("div", "km-grid");
    grid.style.gridTemplateColumns = `repeat(${model.cols}, var(--km-square))`;
    grid.setAttribute("role", "grid");
    for (const square of model.squares) {
      const cell = node("button", "km-square");
      cell.type = "button";
      cell.dataset.square = square.square;
      if (square.tile !== null) {
        cell.classList.add("km-tile");
        if (square.wild) cell.classList.add("km-wild");
        if (square.mark !== null) cell.classList.add(`km-${square.mark}`);
        cell.textContent = square.glyph;
        cell.setAttribute("aria-label", `${square.glyph}${square.wild ? ", wild" : ""}`);
      } else {
        cell.setAttribute("aria-label", "Empty square");
      }
      if (held?.from === "table" && held.square === square.square) cell.classList.add("km-held");
      grid.append(cell);
    }
    board.replaceChildren(grid);
    notes.textContent = verdict.notWords.length > 0 ? `Not words: ${verdict.notWords.join(", ")}` : verdict.apart.size > 0 ? "Every tile must join the one crossword." : "";
  }

  function renderHand() {
    hand.replaceChildren();
    play!.hand.forEach((tile, at) => {
      const face = tileFace(tile);
      const made = node("button", "km-tile km-in-hand");
      made.type = "button";
      made.dataset.hand = String(at);
      made.textContent = words!.glyphOf(tile);
      if (face.wild) made.classList.add("km-wild");
      if (held?.from === "hand" && held.at === at) made.classList.add("km-held");
      made.setAttribute("aria-label", face.blank ? "Wild, no letter yet" : `${words!.glyphOf(tile)}${face.wild ? ", wild" : ""}`);
      hand.append(made);
    });
    if (play!.hand.length === 0 && finishedAt === null) hand.append(node("span", "km-empty", "No tiles in hand"));
  }

  function renderPicker() {
    picker.replaceChildren();
    if (held?.from !== "hand" || play === null) return;
    const at = held.at;
    const tile = play.hand[at];
    if (tile === undefined || !tileFace(tile).wild) return;
    picker.append(node("span", "km-picker-title", tile === "*" ? "Give the wild a letter:" : "Change the wild's letter:"));
    for (const sound of words!.wildOptions) {
      const code = words!.wildFor(sound);
      if (code === null) continue;
      picker.append(
        button(sound, () => {
          held = { from: "hand", at };
          change(assignHandTile(play!, at, code));
        }),
      );
    }
  }

  function renderControls(verdict: ReturnType<typeof verdictOf>) {
    controls.replaceChildren();
    if (finishedAt !== null) {
      controls.append(button("New game", () => void handle.newGame(), true));
      return;
    }
    const now = play!;
    const drawButton = button("Draw", () => {
      held = null;
      change(draw(now));
    }, true);
    drawButton.disabled = !mayDraw(now, verdict);
    const tradeButton = button("Trade for three", () => {
      if (held?.from !== "hand") return;
      const at = held.at;
      held = null;
      change(trade(now, at));
    });
    tradeButton.disabled = held?.from !== "hand" || !mayTrade(now);
    controls.append(
      drawButton,
      tradeButton,
      button("Sort", () => change(sortHand(now))),
      button("Lift all", () => {
        held = null;
        change(liftAll(now));
      }),
      button("New game", () => void handle.newGame()),
    );
  }

  function render() {
    if (destroyed) return;
    renderStatus();
    if (play === null || words === null) return;
    const verdict = verdictOf(play);
    renderBoard(verdict);
    renderPicker();
    renderHand();
    renderControls(verdict);
  }

  const handle: KumimojiTableHandle = {
    play: () => play,
    newGame: async (changed = {}) => {
      settings = { ...settings, ...changed, seed: undefined };
      const language = settings.language ?? "english";
      const size = settings.hand ?? KUMIMOJI_HANDS.quick;
      play = null;
      held = null;
      finishedAt = null;
      render();
      words = await loadTileWords(language);
      if (destroyed) return;
      // A seed deals one game: the next is dealt from a new one unless asked for by seed again.
      const seed = changed.seed ?? Math.floor(Math.random() * 2 ** 31);
      root.classList.toggle("km-japanese", language === "japanese");
      dealt = generateKumimoji(size, settings.level ?? "medium", seed, { language, gameLength: settings.gameLength, diagonals: settings.diagonals });
      started = Date.now();
      change(deal(dealt.givens, size));
    },
    destroy: () => {
      destroyed = true;
      clearInterval(tick);
      root.remove();
    },
  };

  void handle.newGame(settings);
  return handle;
}
