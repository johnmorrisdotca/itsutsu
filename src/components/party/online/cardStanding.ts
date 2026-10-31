import type { CardGameKind } from "@/lib/cardGames/cardGames.constants";
import type { Speaker } from "@/lib/i18n/i18n";

type Standing = { scores?: readonly number[]; penalties?: readonly number[]; books?: readonly (readonly unknown[])[]; hands?: readonly (readonly unknown[])[] };

/**
 * How a seat stands at each card game, for its row in a table's seat list: free of the
 * adapters, which draw cards and are loaded in the browser only. Partners share a score.
 */
export function cardStanding(kind: CardGameKind): (game: Standing, seat: number, say: Speaker) => string {
  if (kind === "war") return (game, seat, say) => say.count("party.online.cardsHeld", game.hands?.[seat]?.length ?? 0);
  if (kind === "goFish") return (game, seat, say) => say.count("party.online.books", game.books?.[seat]?.length ?? 0);
  if (kind === "bigTwo") return (game, seat, say) => say.say("party.dice.points", { points: String(game.penalties?.[seat] ?? 0) });
  const partners = kind === "spades" || kind === "euchre";
  return (game, seat, say) => say.say("party.dice.points", { points: String(game.scores?.[partners ? seat % 2 : seat] ?? 0) });
}
