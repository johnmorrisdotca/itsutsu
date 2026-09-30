"use client";

import { cardValue, cribbagePlayable, dealerOf, otherOf } from "@/lib/cardGames/cribbage/cribbage";
import { CRIBBAGE_RULES } from "@/lib/cardGames/cribbage/cribbageRules";
import type { CribbageCount, CribbageGame, CribbageHandScore, CribbageMove, CribbagePeg } from "@/lib/cardGames/cribbage/cribbage.types";
import type { CardId } from "@/lib/cardGames/cardGames.types";

import type { CardAdapter, CardCentreProps } from "./cardTable.types";
import { LaidCard, TableWords } from "./CardTableParts";

const SMALL = 6.2;

/** What one card in the pegging scored, in a line: "Ben: fifteen and a pair for 4". */
function pegWords(peg: CribbagePeg, name: string): string {
  return `${name}: ${peg.why.join(" and ")} for ${peg.points}`;
}

/** What a show counted, by kind, where it counted anything: "fifteens 4, a run 3, nobs 1". */
function countWords(count: CribbageCount): string {
  const parts: string[] = [];
  if (count.fifteens > 0) parts.push(`fifteens ${count.fifteens}`);
  if (count.pairs > 0) parts.push(`pairs ${count.pairs}`);
  if (count.runs > 0) parts.push(`runs ${count.runs}`);
  if (count.flush > 0) parts.push(`flush ${count.flush}`);
  if (count.nobs > 0) parts.push(`nobs ${count.nobs}`);
  return parts.length === 0 ? "nothing" : parts.join(", ");
}

/** The hand shown, or the crib, in a row of small cards with the starter set apart at its end. */
function ShownRow({ label, cards, starter, count, top }: { label: string; cards: readonly CardId[]; starter: CardId; count: CribbageCount; top: number }) {
  return (
    <>
      <TableWords left={1} top={top + 1} width={26}>
        {label} · {count.total}
      </TableWords>
      {cards.map((card, at) => (
        <LaidCard key={card} card={card} left={28 + 6.6 * at} top={top} width={SMALL} testId="cards-shown" />
      ))}
      <LaidCard card={starter} left={28 + 6.6 * 4 + 2} top={top} width={SMALL} />
      <TableWords left={64} top={top + 1} width={35}>
        {countWords(count)}
      </TableWords>
    </>
  );
}

/** The last hand's show: the other player's hand, the dealer's, and the dealer's crib, each with the starter and what it counted. */
function Show({ result, players }: { result: CribbageHandScore; players: readonly string[] }) {
  const pone = otherOf(result.dealer);
  const name = (seat: number) => players[seat] ?? "";
  return (
    <>
      <TableWords left={5} top={1} width={90} testId="cards-show">
        The show: {name(pone)} {result.counts[pone].total}, {name(result.dealer)} {result.counts[result.dealer].total}, and the crib {result.cribCount.total}
      </TableWords>
      <ShownRow label={`${name(pone)}'s hand`} cards={result.hands[pone]} starter={result.starter} count={result.counts[pone]} top={8} />
      <ShownRow label={`${name(result.dealer)}'s hand`} cards={result.hands[result.dealer]} starter={result.starter} count={result.counts[result.dealer]} top={21} />
      <ShownRow label={`${name(result.dealer)}'s crib`} cards={result.crib} starter={result.starter} count={result.cribCount} top={34} />
    </>
  );
}

/**
 * THE TABLE: while the crib is laid, the last hand's show (once there has
 * been one), both hands and the crib counted; then, in the pegging, the
 * starter on the left, the crib face down on the right, and between them the
 * cards played since the count was last nought, with the count and what the
 * last card scored.
 */
function CribbageCentre({ game, players }: CardCentreProps<CribbageGame>) {
  const dealer = dealerOf(game.deal);
  const last = game.results.at(-1);
  const shown = (game.phase === "crib" && last !== undefined) || (game.phase === "over" && last !== undefined && game.results.length === game.deal + 1);
  if (shown) return <Show result={last!} players={players} />;
  if (game.phase === "crib") {
    return (
      <>
        {game.crib.length === 0 ? null : <LaidCard card={null} left={84} top={6} testId="cards-crib" />}
        <TableWords left={20} top={22} width={60} testId="cards-crib-words">
          Laying two cards each to {players[dealer]}&apos;s crib
        </TableWords>
      </>
    );
  }
  const step = 7;
  const start = 50 - (step * Math.max(0, game.run.length - 1) + 13) / 2;
  return (
    <>
      {game.starter === null ? null : <LaidCard card={game.starter} left={3} top={6} testId="cards-starter" />}
      <TableWords left={0} top={26} width={19}>
        The starter
      </TableWords>
      <LaidCard card={null} left={84} top={6} testId="cards-crib" />
      <TableWords left={81} top={26} width={19}>
        {players[dealer]}&apos;s crib
      </TableWords>
      {game.run.map((play, at) => (
        <LaidCard key={play.card} card={play.card} left={start + step * at} top={6} testId="cards-run-card" />
      ))}
      <TableWords left={30} top={28} width={40} testId="cards-peg-count">
        Count: {game.count}
      </TableWords>
      {game.peg === null ? null : (
        <TableWords left={10} top={36} width={80} testId="cards-peg">
          {pegWords(game.peg, players[game.peg.seat] ?? "")}
        </TableWords>
      )}
    </>
  );
}

/** Cribbage at the table: two cards laid to the crib, then the pegging a card at a time, and the show counted for both. */
export const CRIBBAGE_ADAPTER: CardAdapter<CribbageGame, CribbageMove> = {
  kind: "cribbage",
  rules: CRIBBAGE_RULES,
  hand: (game, seat) => game.hands[seat] ?? [],
  chooses: (game) => (game.phase === "crib" ? 2 : 1),
  actions: (game, chosen, _target, name) => {
    if (game.phase === "crib") {
      const move: CribbageMove | null = chosen.length === 2 ? { crib: [chosen[0], chosen[1]] } : null;
      return [{ label: "Lay to the crib", move, testId: "cards-crib-lay", strong: true, why: `Choose two cards for ${name(dealerOf(game.deal))}'s crib (${chosen.length} chosen).` }];
    }
    const card = chosen.length === 1 ? chosen[0] : null;
    const ok = card !== null && game.count + cardValue(card) <= 31;
    return [{ label: "Play", move: ok ? { play: card } : null, testId: "cards-play", strong: true, why: card === null ? "Choose a card to play." : "That card would take the count past thirty-one." }];
  },
  quick: (game, card) => {
    if (game.phase !== "pegging" || game.toPlay === null) return null;
    return cribbagePlayable(game.hands[game.toPlay], game.count).includes(card) ? { play: card } : null;
  },
  status: (game, name) => {
    if (game.toPlay === null) return "";
    if (game.phase === "crib") return `${name(game.toPlay)}: lay two cards to ${name(dealerOf(game.deal))}'s crib.`;
    return `${name(game.toPlay)} to play: the count is ${game.count}.`;
  },
  standing: (game, seat) => ({ score: String(game.scores[seat]), note: game.phase !== "over" && seat === dealerOf(game.deal) ? "deals" : undefined }),
  scoreWords: "Points, first to the total wins",
  Centre: CribbageCentre,
};
