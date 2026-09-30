// The Toranpu demo: every game is driven through the same few calls
// (newGame, rulesFor, and each rule's moves, play, computer), and the page
// knows nothing of any game's rules. Moves are matched to the cards you pick.
import { CARD_GAME_TABLES, isCard, newGame, rankWords, rulesFor } from "./dist/index.js";

const GAMES = {
  hearts: { name: "Hearts", blurb: "Avoid hearts and the queen of spades. Pass three cards, follow suit, lowest score wins." },
  spades: { name: "Spades", blurb: "Partners across the table bid tricks together. Spades are always trump." },
  euchre: { name: "Euchre", blurb: "Five cards, four players in partnerships, and the jacks of trump's colour on top." },
  cribbage: { name: "Cribbage", blurb: "Lay two to the crib, peg to thirty-one, then count fifteens, pairs and runs." },
  crazyEights: { name: "Crazy Eights", blurb: "Match the suit or the rank. Eights are wild and name the next suit." },
  goFish: { name: "Go Fish", blurb: "Ask a player for a rank. Collect books of four. Go fish when they have none." },
  bigTwo: { name: "Big Two", blurb: "Beat the cards on the table with singles, pairs, triples or five-card hands. Twos are high." },
  president: { name: "President", blurb: "Shed your cards first to become President. The last out swaps their best cards." },
  ginRummy: { name: "Gin Rummy", blurb: "Draw and discard to make sets and runs, then knock when your deadwood is low." },
};

const SUITS = { S: ["♠", false, "spades"], H: ["♥", true, "hearts"], D: ["♦", true, "diamonds"], C: ["♣", false, "clubs"] };
const NAMES = ["You", "Aiko", "Ben", "Chloé", "Dev", "Emi", "Finn", "Grace"];
const $ = (id) => document.getElementById(id);

let kind = "hearts";
let game = null;
let picked = [];
let timer = null;

const rules = () => rulesFor(kind);
const rankText = (card) => (card[0] === "T" ? "10" : card[0]);
const cardText = (card) => `${rankText(card)}${SUITS[card[1]][0]}`;
const cardsText = (cards) => cards.map(cardText).join(" ");

function cardEl(card, { small = false, button = false } = {}) {
  const el = document.createElement(button ? "button" : "div");
  el.className = `card${small ? " small" : ""}${SUITS[card[1]][1] ? " red" : ""}`;
  el.innerHTML = `<span>${rankText(card)}</span><span class="pip">${SUITS[card[1]][0]}</span>`;
  el.setAttribute("aria-label", cardText(card));
  return el;
}

/** Every card a move names, in any field. */
function cardsOf(move) {
  return Object.values(move).flatMap((value) => (Array.isArray(value) ? value.filter(isCard) : isCard(value) ? [value] : []));
}

function words(move, seat, names) {
  const mine = seat === 0;
  if ("pass" in move && Array.isArray(move.pass)) return mine ? `pass ${cardsText(move.pass)}` : "passes three cards";
  if ("crib" in move) return mine ? `lay ${cardsText(move.crib)} in the crib` : "lays two cards in the crib";
  if ("give" in move) return mine ? `give ${cardsText(move.give)}` : `gives ${move.give.length === 1 ? "a card" : `${move.give.length} cards`}`;
  if ("play" in move) {
    const cards = Array.isArray(move.play) ? move.play : [move.play];
    return `${mine ? "play" : "plays"} ${cardsText(cards)}${move.suit ? `, calling ${SUITS[move.suit][2]}` : ""}`;
  }
  if ("pass" in move) return mine ? "pass" : "passes";
  if ("draw" in move) return move.draw === "discard" ? (mine ? "take the discard" : "takes the discard") : mine ? "draw" : "draws";
  if ("discard" in move) return `${mine ? "discard" : "discards"} ${cardText(move.discard)}`;
  if ("knock" in move) return `${mine ? "knock, discarding" : "knocks, discarding"} ${cardText(move.knock)}`;
  if ("order" in move) return mine ? "order it up" : "orders it up";
  if ("call" in move) return `${mine ? "call" : "calls"} ${SUITS[move.call][2]}`;
  if ("bid" in move) return `${mine ? "bid" : "bids"} ${move.bid === 0 ? "nil" : move.bid}`;
  if ("ask" in move) return `${mine ? "ask" : "asks"} ${names[move.ask]} for ${rankWords(move.rank)}`;
  return JSON.stringify(move);
}

function log(text) {
  const li = document.createElement("li");
  li.textContent = text;
  $("log").append(li);
  $("log").scrollTop = $("log").scrollHeight;
}

function makeMove(move) {
  const seat = rules().toPlay(game);
  const next = rules().play(game, move);
  if (next === null) return;
  const names = rules().seats(game).players;
  log(`${names[seat]}: ${words(move, seat, names)}`);
  game = next;
  picked = [];
  render();
}

function pile(label, cards, small = true) {
  const box = document.createElement("div");
  box.className = "pile";
  box.innerHTML = `<span class="label">${label}</span>`;
  const row = document.createElement("div");
  row.className = "cards";
  for (const card of cards) row.append(cardEl(card, { small }));
  box.append(row);
  return box;
}

function renderFelt(names) {
  const felt = $("felt");
  felt.replaceChildren();
  const g = game;
  const plays = (list) => list.map((p) => p.card);
  if (g.trick?.length) felt.append(pile(`Trick: ${g.trick.map((p) => names[p.seat]).join(", ")}`, plays(g.trick), false));
  else if (g.lastTrick?.plays?.length) felt.append(pile(`Last trick, taken by ${names[g.lastTrick.winner]}`, plays(g.lastTrick.plays)));
  if (g.pile?.cards) felt.append(pile(`To beat (${names[g.pile.seat]})`, g.pile.cards, false));
  if (g.run?.length) felt.append(pile(`Count ${g.count}`, plays(g.run), false));
  if (g.discard?.length) felt.append(pile("Discard", [g.discard[g.discard.length - 1]], false));
  if (g.suit && kind === "crazyEights") felt.append(Object.assign(document.createElement("div"), { className: "pile", innerHTML: `<span class="label">Suit to follow</span><span style="font-size:32px">${SUITS[g.suit][0]}</span>` }));
  if (g.upcard && g.phase !== "playing" && g.trump === null) felt.append(pile("Turned up", [g.upcard], false));
  if (g.trump) felt.append(Object.assign(document.createElement("div"), { className: "pile", innerHTML: `<span class="label">Trump</span><span style="font-size:32px">${SUITS[g.trump][0]}</span>` }));
  if (g.starter) felt.append(pile("Starter", [g.starter], false));
  if (g.stock) felt.append(Object.assign(document.createElement("div"), { className: "pile", innerHTML: `<span class="label">Stock</span><span>${g.stock.length} cards</span>` }));
}

function render() {
  clearTimeout(timer);
  const r = rules();
  const { players: names, computers } = r.seats(game);
  const toPlay = r.toPlay(game);
  const over = r.over(game);

  $("seats").replaceChildren(
    ...names.map((name, seat) => {
      const el = document.createElement("div");
      el.className = `seat${seat === toPlay ? " turn" : ""}`;
      const held = game.hands?.[seat]?.length;
      const score = game.scores?.[game.scores.length === 2 && names.length === 4 ? seat % 2 : seat];
      const extra = [
        computers[seat] ? "computer" : "",
        held !== undefined ? `${held} card${held === 1 ? "" : "s"}` : "",
        score !== undefined ? `score ${score}` : "",
        game.bids?.[seat] != null ? `bid ${game.bids[seat]}` : "",
        game.books ? `${game.books[seat].length} books` : "",
      ].filter(Boolean);
      el.innerHTML = `<div class="name">${name}</div><div class="meta">${extra.join(" · ")}</div>`;
      return el;
    }),
  );
  renderFelt(names);

  const mine = !over && toPlay === 0;
  const offered = mine ? r.moves(game) : [];
  const hand = game.hands?.[0] ?? [];
  const usable = new Set(offered.flatMap(cardsOf));
  $("hand").replaceChildren(
    ...hand.map((card) => {
      const el = cardEl(card, { button: true });
      // Dimmed only while some cards may be played and this is not one of them.
      el.disabled = !usable.has(card);
      if (usable.size === 0) el.classList.add("idle");
      if (picked.includes(card)) el.classList.add("picked");
      el.addEventListener("click", () => {
        picked = picked.includes(card) ? picked.filter((c) => c !== card) : [...picked, card];
        render();
      });
      return el;
    }),
  );

  const same = (a, b) => a.length === b.length && a.every((c) => b.includes(c));
  const fitting = offered.filter((move) => cardsOf(move).length === 0 || same(cardsOf(move), picked));
  $("moves").replaceChildren(
    ...fitting.map((move) => {
      const button = document.createElement("button");
      button.textContent = words(move, 0, names).replace(/^./, (c) => c.toUpperCase());
      if (cardsOf(move).length === 0) button.className = "quiet";
      button.addEventListener("click", () => makeMove(move));
      return button;
    }),
  );

  if (over) {
    const won = r.winners(game).map((seat) => names[seat]);
    $("status").textContent = `Game over. ${won.join(" and ")} ${won.length === 1 && won[0] !== "You" ? "wins" : "win"}.`;
    return;
  }
  if (computers[toPlay]) {
    $("status").textContent = `${names[toPlay]} is thinking…`;
    timer = setTimeout(() => makeMove(r.computer(game)), 550);
  } else {
    const first = offered[0] ?? {};
    $("status").textContent = Array.isArray(first.pass)
      ? `Your turn: pick ${first.pass.length} cards to pass.`
      : "crib" in first
        ? "Your turn: pick two cards for the crib."
        : "give" in first
          ? `Your turn: pick ${first.give.length === 1 ? "a card" : `${first.give.length} cards`} to give.`
          : offered.some((m) => cardsOf(m).length > 0)
            ? "Your turn: pick a card, then choose what to do."
            : "Your turn.";
  }
}

function deal() {
  const count = Number($("players").value);
  const players = NAMES.slice(0, count);
  const seed = Number($("seed").value) || 1 + Math.floor(Math.random() * 1e6);
  $("seed").value = String(seed);
  game = newGame(kind, { players, seed, computers: players.map((_, seat) => seat > 0) });
  picked = [];
  $("log").replaceChildren();
  log(`${GAMES[kind].name} for ${count}, seed ${seed}.`);
  history.replaceState(null, "", `#${kind}/${count}/${seed}`);
  render();
}

function choose(next, count) {
  kind = next;
  const table = CARD_GAME_TABLES[kind];
  $("players").replaceChildren(
    ...Array.from({ length: table.mostPlayers - table.fewestPlayers + 1 }, (_, at) => {
      const n = table.fewestPlayers + at;
      return Object.assign(document.createElement("option"), { value: n, textContent: n, selected: n === (count ?? table.defaultPlayers) });
    }),
  );
  for (const button of $("games").children) button.setAttribute("aria-selected", String(button.dataset.kind === kind));
  $("blurb").textContent = GAMES[kind].blurb;
}

for (const [key, { name }] of Object.entries(GAMES)) {
  const button = Object.assign(document.createElement("button"), { textContent: name, role: "tab" });
  button.dataset.kind = key;
  button.addEventListener("click", () => {
    choose(key);
    $("seed").value = "";
    deal();
  });
  $("games").append(button);
}
$("deal").addEventListener("click", () => {
  $("seed").value = "";
  deal();
});

const [hashKind, hashCount, hashSeed] = location.hash.slice(1).split("/");
if (hashKind in GAMES) {
  choose(hashKind, Number(hashCount) || undefined);
  $("seed").value = hashSeed ?? "";
} else choose(kind);
deal();
