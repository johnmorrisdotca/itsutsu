"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import type { Speaker } from "@/lib/i18n/i18n";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";
import { cardValue, cribbagePlayable, dealerOf, otherOf } from "@/lib/cardGames/cribbage/cribbage";
import { CRIBBAGE_RULES } from "@/lib/cardGames/cribbage/cribbageRules";
import type { CribbageCount, CribbageGame, CribbageHandScore, CribbageMove, CribbagePeg } from "@/lib/cardGames/cribbage/cribbage.types";
import type { CardId } from "@/lib/cardGames/cardGames.types";

import type { CardAdapter, CardCentreProps } from "./cardTable.types";
import { LaidCard, TableWords } from "./CardTableParts";

const SMALL = 6.2;

/**
 * Why a card scored, as the package words it ("fifteen", "a pair", "a run of 3"): English from the package, so each
 * reason it can give is looked up here and said in the reader's language. One it does not know is shown as it came.
 */
function whyWords(why: string, say: Speaker): string {
  const run = /^a run of (\d+)$/.exec(why);
  if (run !== null) return say.say("ctable.crib.whyRun", { n: run[1] });
  const known: Record<string, PhraseKey> = {
    fifteen: "ctable.crib.whyFifteen",
    "thirty-one": "ctable.crib.whyThirtyOne",
    "a pair": "ctable.crib.whyPair",
    "three alike": "ctable.crib.whyThree",
    "four alike": "ctable.crib.whyFour",
    "his heels": "ctable.crib.whyHeels",
    "last card": "ctable.crib.whyLast",
    go: "ctable.crib.whyGo",
  };
  const key = known[why];
  return key === undefined ? why : say.say(key);
}

/** What one card in the pegging scored, in a line: "Ben: fifteen and a pair for 4". */
function pegWords(peg: CribbagePeg, name: string, say: Speaker): string {
  return say.say("ctable.crib.peg", { name, why: say.list(peg.why.map((why) => whyWords(why, say))), points: String(peg.points) });
}

/** What a show counted, by kind, where it counted anything: "fifteens 4, a run 3, nobs 1". */
function countWords(count: CribbageCount, say: Speaker): string {
  const parts: string[] = [];
  if (count.fifteens > 0) parts.push(say.say("ctable.crib.fifteens", { n: String(count.fifteens) }));
  if (count.pairs > 0) parts.push(say.say("ctable.crib.pairs", { n: String(count.pairs) }));
  if (count.runs > 0) parts.push(say.say("ctable.crib.runs", { n: String(count.runs) }));
  if (count.flush > 0) parts.push(say.say("ctable.crib.flush", { n: String(count.flush) }));
  if (count.nobs > 0) parts.push(say.say("ctable.crib.nobs", { n: String(count.nobs) }));
  return parts.length === 0 ? say.say("ctable.crib.nothing") : say.joined(parts);
}

/** The hand shown, or the crib, in a row of small cards with the starter set apart at its end. */
function ShownRow({ label, cards, starter, count, top, say }: { label: string; cards: readonly CardId[]; starter: CardId; count: CribbageCount; top: number; say: Speaker }) {
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
        {countWords(count, say)}
      </TableWords>
    </>
  );
}

/** The last hand's show: the other player's hand, the dealer's, and the dealer's crib, each with the starter and what it counted. */
function Show({ result, players }: { result: CribbageHandScore; players: readonly string[] }) {
  const say = useSpeaker();
  const pone = otherOf(result.dealer);
  const name = (seat: number) => players[seat] ?? "";
  return (
    <>
      <TableWords left={5} top={1} width={90} testId="cards-show">
        {say.say("ctable.crib.show", { pone: name(pone), a: String(result.counts[pone].total), dealer: name(result.dealer), b: String(result.counts[result.dealer].total), c: String(result.cribCount.total) })}
      </TableWords>
      <ShownRow label={say.say("ctable.crib.handOf", { name: name(pone) })} cards={result.hands[pone]} starter={result.starter} count={result.counts[pone]} top={8} say={say} />
      <ShownRow label={say.say("ctable.crib.handOf", { name: name(result.dealer) })} cards={result.hands[result.dealer]} starter={result.starter} count={result.counts[result.dealer]} top={21} say={say} />
      <ShownRow label={say.say("ctable.crib.cribOf", { name: name(result.dealer) })} cards={result.crib} starter={result.starter} count={result.cribCount} top={34} say={say} />
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
  const say = useSpeaker();
  const dealer = dealerOf(game.deal);
  const last = game.results.at(-1);
  const shown = (game.phase === "crib" && last !== undefined) || (game.phase === "over" && last !== undefined && game.results.length === game.deal + 1);
  if (shown) return <Show result={last!} players={players} />;
  if (game.phase === "crib") {
    return (
      <>
        {game.crib.length === 0 ? null : <LaidCard card={null} left={84} top={6} testId="cards-crib" />}
        <TableWords left={20} top={22} width={60} testId="cards-crib-words">
          {say.say("ctable.crib.laying", { name: players[dealer] })}
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
        {say.say("ctable.crib.starter")}
      </TableWords>
      <LaidCard card={null} left={84} top={6} testId="cards-crib" />
      <TableWords left={81} top={26} width={19}>
        {say.say("ctable.crib.cribOf", { name: players[dealer] })}
      </TableWords>
      {game.run.map((play, at) => (
        <LaidCard key={play.card} card={play.card} left={start + step * at} top={6} testId="cards-run-card" />
      ))}
      <TableWords left={30} top={28} width={40} testId="cards-peg-count">
        {say.say("ctable.crib.count", { count: String(game.count) })}
      </TableWords>
      {game.peg === null ? null : (
        <TableWords left={10} top={36} width={80} testId="cards-peg">
          {pegWords(game.peg, players[game.peg.seat] ?? "", say)}
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
  actions: (game, chosen, _target, name, say) => {
    if (game.phase === "crib") {
      const move: CribbageMove | null = chosen.length === 2 ? { crib: [chosen[0], chosen[1]] } : null;
      return [{ label: say.say("ctable.crib.lay"), move, testId: "cards-crib-lay", strong: true, why: say.say("ctable.crib.layWhy", { name: name(dealerOf(game.deal)), count: String(chosen.length) }) }];
    }
    const card = chosen.length === 1 ? chosen[0] : null;
    const ok = card !== null && game.count + cardValue(card) <= 31;
    return [{ label: say.say("ctable.play"), move: ok ? { play: card } : null, testId: "cards-play", strong: true, why: card === null ? say.say("ctable.chooseCard") : say.say("ctable.crib.pastThirtyOne") }];
  },
  quick: (game, card) => {
    if (game.phase !== "pegging" || game.toPlay === null) return null;
    return cribbagePlayable(game.hands[game.toPlay], game.count).includes(card) ? { play: card } : null;
  },
  status: (game, name, say) => {
    if (game.toPlay === null) return "";
    if (game.phase === "crib") return say.say("ctable.crib.layStatus", { name: name(game.toPlay), dealer: name(dealerOf(game.deal)) });
    return say.say("ctable.crib.playStatus", { name: name(game.toPlay), count: String(game.count) });
  },
  standing: (game, seat, say) => ({ score: String(game.scores[seat]), note: game.phase !== "over" && seat === dealerOf(game.deal) ? say.say("ctable.dealerNote") : undefined }),
  scoreWords: (say) => say.say("ctable.pointsFirst"),
  Centre: CribbageCentre,
};
