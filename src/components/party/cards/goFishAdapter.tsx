"use client";

import { rankOf, rankWords } from "@/lib/cardGames/cards";
import type { CardId } from "@/lib/cardGames/cardGames.types";
import { goFishTargets } from "@/lib/cardGames/goFish/goFish";
import { GO_FISH_RULES } from "@/lib/cardGames/goFish/goFishRules";
import type { GoFishEvent, GoFishGame, GoFishMove } from "@/lib/cardGames/goFish/goFish.types";

import type { CardAdapter, CardCentreProps } from "./cardTable.types";
import { LaidCard, TableWords } from "./CardTableParts";

/** One thing said at the table, in words: "Ann asked Ben for sevens and got two." */
export function goFishWords(event: GoFishEvent, name: (seat: number) => string): string {
  if (event.kind === "draw") return `${name(event.seat)} drew a card.`;
  if (event.kind === "book") return `${name(event.seat)} laid down a book of ${rankWords(event.rank)}.`;
  const asked = `${name(event.seat)} asked ${name(event.asked)} for ${rankWords(event.rank)}`;
  if (event.got > 0) return `${asked} and got ${event.got === 1 ? "one" : event.got}.`;
  if (event.fished === "caught") return `${asked}: go fish — and fished one up.`;
  if (event.fished === "missed") return `${asked}: go fish.`;
  return `${asked}: go fish, but the pond is empty.`;
}

/** The pond in the middle, face down with how many are left, and the last thing said at the table. */
function GoFishCentre({ game, players }: CardCentreProps<GoFishGame>) {
  const name = (seat: number) => players[seat] ?? `Player ${seat + 1}`;
  const last = game.log.filter((event) => event.kind !== "draw").slice(-1)[0];
  return (
    <>
      {game.stock.length === 0 ? null : <LaidCard card={null} left={42.5} top={4} testId="cards-pond" />}
      <TableWords left={20} top={25} width={60} testId="cards-pond-count">
        {game.stock.length === 0 ? "The pond is empty" : `${game.stock.length} in the pond`}
      </TableWords>
      {last === undefined ? null : (
        <TableWords left={5} top={34} width={90} testId="cards-said">
          {goFishWords(last, name)}
        </TableWords>
      )}
    </>
  );
}

/** Go Fish at the table: a rank from your hand, and the player to ask for it. */
export const GO_FISH_ADAPTER: CardAdapter<GoFishGame, GoFishMove> = {
  kind: "goFish",
  rules: GO_FISH_RULES,
  hand: (game, seat) => game.hands[seat] ?? [],
  chooses: () => 1,
  targets: goFishTargets,
  actions: (game, chosen, target, name) => {
    const rank = chosen.length === 1 ? rankOf(chosen[0]) : null;
    const move: GoFishMove | null = rank !== null && target !== null ? { ask: target, rank } : null;
    const ok = move !== null && GO_FISH_RULES.play(game, move) !== null;
    const label = rank !== null && target !== null ? `Ask ${name(target)} for ${rankWords(rank)}` : "Ask";
    return [{ label, move: ok ? move : null, testId: "cards-ask", strong: true, why: "Choose a card for its rank, then the player to ask." }];
  },
  // A card let go on a player, or tapped twice with only one player to ask: ask them for its rank.
  quick: (game, card: CardId, _chosen, target) => {
    const targets = goFishTargets(game);
    const to = target ?? (targets.length === 1 ? targets[0] : null);
    if (to === null) return null;
    const move: GoFishMove = { ask: to, rank: rankOf(card) };
    return GO_FISH_RULES.play(game, move) === null ? null : move;
  },
  status: (game, name) => (game.toPlay === null ? "" : `${name(game.toPlay)} to ask: choose a card, then a player.`),
  standing: (game, seat) => ({
    score: String(game.books[seat].length),
    note: game.books[seat].length === 0 ? undefined : game.books[seat].map((rank) => rankWords(rank)).join(", "),
  }),
  scoreWords: "Books, most wins",
  Centre: GoFishCentre,
};
