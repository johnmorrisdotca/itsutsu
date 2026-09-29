// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import type { PartyRules } from "../party.types";

import type { OnlineRules } from "./online.types";

/**
 * A party kind's rules (`PartyRules`) as a table on several devices asks them.
 * A new party kind — Mancala, Tenka — joins with this and the four
 * things `PartyRules` does not say: whose turn it is, how many moves have been
 * made, a move's shape, and where the names go.
 */
export function fromPartyRules<S, M>(
  rules: PartyRules<S, M>,
  spec: { sizes: readonly number[]; counts: readonly number[] },
  own: Pick<OnlineRules<S, M>, "toPlay" | "moveCount" | "readMove" | "named">,
): OnlineRules<S, M> {
  return {
    sizes: spec.sizes,
    counts: spec.counts,
    // A table of blank names: the names are the seats', written in for a page by `named`.
    start: (size, count) => (spec.counts.includes(count) ? rules.start(size, new Array<string>(count).fill("")) : null),
    encode: rules.encode,
    decode: (text) => rules.decode(text),
    toPlay: (game) => (rules.over(game) ? null : own.toPlay(game)),
    winners: (game) => (rules.over(game) ? rules.winners(game) : []),
    moveCount: own.moveCount,
    readMove: own.readMove,
    play: rules.play,
    named: own.named,
  };
}
