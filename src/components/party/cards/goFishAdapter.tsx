"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { ranksNamed } from "@/lib/cardGames/cardSay";
import { rankOf } from "@/lib/cardGames/cards";
import { playerNumberName } from "@/lib/gomoku/seatWords";
import type { Speaker } from "@/lib/i18n/i18n";
import type { CardId } from "@/lib/cardGames/cardGames.types";
import { goFishTargets } from "@/lib/cardGames/goFish/goFish";
import { GO_FISH_RULES } from "@/lib/cardGames/goFish/goFishRules";
import type { GoFishEvent, GoFishGame, GoFishMove } from "@/lib/cardGames/goFish/goFish.types";

import type { CardAdapter, CardCentreProps } from "./cardTable.types";
import { LaidCard, TableWords } from "./CardTableParts";

/** One thing said at the table, in words: "Ann asked Ben for sevens and got two." */
export function goFishWords(event: GoFishEvent, name: (seat: number) => string, say: Speaker): string {
  if (event.kind === "draw") return say.say("ctable.fish.drew", { name: name(event.seat) });
  const rank = ranksNamed(event.rank, say);
  if (event.kind === "book") return say.say("ctable.fish.book", { name: name(event.seat), rank });
  const asked = { name: name(event.seat), other: name(event.asked), rank };
  if (event.got > 0) return event.got === 1 ? say.say("ctable.fish.gotOne", asked) : say.say("ctable.fish.gotMany", { ...asked, count: String(event.got) });
  if (event.fished === "caught") return say.say("ctable.fish.caught", asked);
  if (event.fished === "missed") return say.say("ctable.fish.missed", asked);
  return say.say("ctable.fish.emptyPond", asked);
}

/** The pond in the middle, face down with how many are left, and the last thing said at the table. */
function GoFishCentre({ game, players }: CardCentreProps<GoFishGame>) {
  const say = useSpeaker();
  const name = (seat: number) => players[seat] ?? playerNumberName(say, seat + 1);
  const last = game.log.filter((event) => event.kind !== "draw").slice(-1)[0];
  return (
    <>
      {game.stock.length === 0 ? null : <LaidCard card={null} left={42.5} top={4} testId="cards-pond" />}
      <TableWords left={20} top={25} width={60} testId="cards-pond-count">
        {game.stock.length === 0 ? say.say("ctable.fish.pondEmpty") : say.say("ctable.fish.pond", { count: String(game.stock.length) })}
      </TableWords>
      {last === undefined ? null : (
        <TableWords left={5} top={34} width={90} testId="cards-said">
          {goFishWords(last, name, say)}
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
  actions: (game, chosen, target, name, say) => {
    const rank = chosen.length === 1 ? rankOf(chosen[0]) : null;
    const move: GoFishMove | null = rank !== null && target !== null ? { ask: target, rank } : null;
    const ok = move !== null && GO_FISH_RULES.play(game, move) !== null;
    const label = rank !== null && target !== null ? say.say("ctable.fish.askFor", { name: name(target), rank: ranksNamed(rank, say) }) : say.say("ctable.fish.ask");
    return [{ label, move: ok ? move : null, testId: "cards-ask", strong: true, why: say.say("ctable.fish.askWhy") }];
  },
  // A card let go on a player, or tapped twice with only one player to ask: ask them for its rank.
  quick: (game, card: CardId, _chosen, target) => {
    const targets = goFishTargets(game);
    const to = target ?? (targets.length === 1 ? targets[0] : null);
    if (to === null) return null;
    const move: GoFishMove = { ask: to, rank: rankOf(card) };
    return GO_FISH_RULES.play(game, move) === null ? null : move;
  },
  status: (game, name, say) => (game.toPlay === null ? "" : say.say("ctable.fish.askStatus", { name: name(game.toPlay) })),
  standing: (game, seat, say) => ({
    score: String(game.books[seat].length),
    note: game.books[seat].length === 0 ? undefined : say.joined(game.books[seat].map((rank) => ranksNamed(rank, say))),
  }),
  scoreWords: (say) => say.say("ctable.fish.scoreWords"),
  Centre: GoFishCentre,
};
