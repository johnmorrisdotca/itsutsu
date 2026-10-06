"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { HEARTS_RULES } from "@/lib/cardGames/hearts/heartsRules";
import { passOffset } from "@/lib/cardGames/hearts/hearts";
import type { HeartsGame, HeartsMove } from "@/lib/cardGames/hearts/hearts.types";
import type { Speaker } from "@/lib/i18n/i18n";

import type { CardAdapter, CardCentreProps } from "./cardTable.types";
import { LaidCard, TableWords, trickPlace } from "./CardTableParts";

/** Where this deal's three cards go, in words: "to the left", "across", or nowhere. */
function passWords(game: HeartsGame, say: Speaker): string {
  const seats = game.players.length;
  const offset = passOffset(game.deal, seats);
  if (offset === 0) return say.say("ctable.hearts.passNowhere");
  if (offset === 1) return say.say("ctable.hearts.passLeft");
  if (offset === seats - 1) return say.say("ctable.hearts.passRight");
  return say.say("ctable.hearts.passAcross");
}

/**
 * THE TRICK ON THE TABLE, from the viewer's seat: each card where its player
 * sits, theirs at the foot. Between tricks, the last one stays in place and
 * says who took it, until the next card is played.
 */
function HeartsCentre({ game, viewer, players }: CardCentreProps<HeartsGame>) {
  const say = useSpeaker();
  const seats = game.players.length;
  const showing = game.trick.length > 0 ? game.trick : (game.lastTrick?.plays ?? []);
  const taken = game.trick.length === 0 && game.lastTrick !== null ? game.lastTrick.winner : null;
  return (
    <>
      {showing.map((play) => (
        <LaidCard key={play.card} card={play.card} {...trickPlace(play.seat, viewer ?? 0, seats)} testId="cards-trick-card" />
      ))}
      {taken === null ? null : (
        <TableWords left={30} top={22} width={40} testId="cards-trick-taken">
          {say.say("ctable.tookTrick", { name: players[taken] })}
        </TableWords>
      )}
      {game.phase === "passing" ? (
        <TableWords left={20} top={21} width={60}>
          {say.say("ctable.hearts.passing", { where: passWords(game, say) })}
        </TableWords>
      ) : null}
    </>
  );
}

/** Hearts at the table: three cards passed, then one played a trick. */
export const HEARTS_ADAPTER: CardAdapter<HeartsGame, HeartsMove> = {
  kind: "hearts",
  rules: HEARTS_RULES,
  hand: (game, seat) => game.hands[seat] ?? [],
  chooses: (game) => (game.phase === "passing" ? 3 : 1),
  actions: (game, chosen, _target, _name, say) => {
    if (game.phase === "passing") {
      const move: HeartsMove = { pass: [...chosen] };
      const ok = chosen.length === 3 && HEARTS_RULES.play(game, move) !== null;
      return [{ label: say.say("ctable.hearts.passButton", { where: passWords(game, say) }), move: ok ? move : null, testId: "cards-pass", strong: true, why: say.say("ctable.hearts.passWhy", { count: String(chosen.length) }) }];
    }
    const move: HeartsMove | null = chosen.length === 1 ? { play: chosen[0] } : null;
    const ok = move !== null && HEARTS_RULES.play(game, move) !== null;
    return [{ label: say.say("ctable.play"), move: ok ? move : null, testId: "cards-play", strong: true, why: chosen.length === 0 ? say.say("ctable.chooseCard") : say.say("ctable.hearts.cannotPlay") }];
  },
  quick: (game, card) => {
    if (game.phase !== "playing") return null;
    const move: HeartsMove = { play: card };
    return HEARTS_RULES.play(game, move) === null ? null : move;
  },
  // The three cards passed in, marked until the first trick of the deal is taken.
  arrived: (game, seat) => (game.phase === "playing" && game.lastTrick === null ? (game.received[seat] ?? []) : []),
  status: (game, name, say) => {
    if (game.toPlay === null) return "";
    if (game.phase === "passing") return say.say("ctable.hearts.passStatus", { name: name(game.toPlay), where: passWords(game, say) });
    const key = game.trick.length === 0 ? (game.heartsBroken ? "ctable.hearts.toLeadBroken" : "ctable.toLead") : game.heartsBroken ? "ctable.hearts.toPlayBroken" : "ctable.toPlay";
    return say.say(key, { name: name(game.toPlay) });
  },
  standing: (game, seat, say) => ({ score: String(game.scores[seat]), note: game.phase === "over" ? undefined : say.say("ctable.hearts.thisDeal", { points: String(game.points[seat]) }) }),
  scoreWords: (say) => say.say("ctable.hearts.scoreWords"),
  Centre: HeartsCentre,
};
