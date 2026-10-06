import Link from "@/components/ui/Link";

import { PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { stoneName } from "@/lib/gomoku/seatWords";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { messageIn } from "@/lib/history/reactions.constants";
import { conversationFor, spokenCount } from "@/lib/history/conversation";
import type { GameDetail } from "@/lib/history/gameHistory.types";

/**
 * What the two of them said, printed against the moves they said it at.
 *
 * The messages were being kept and thrown away: every reaction row carries
 * the move it was sent at, and the record page has never shown any of it. A
 * finished game is not only its stones — "😱" at move nineteen is part of the
 * game, and it is part of it *there*, which is why this is not a list at the
 * bottom of the page.
 *
 * Each remark links to the position it was made at, so the board goes to the
 * move somebody was reacting to. That is the whole reason to group by move
 * rather than by the clock.
 */
export async function Conversation({
  game,
  basePath,
  hidden = new Set<string>(),
}: {
  game: GameDetail;
  /** The replay's own address; a move hangs off it. */
  basePath: string;
  /** Colours whose messages this reader has asked not to see. */
  hidden?: ReadonlySet<string>;
}) {
  const entries = conversationFor(game.reactions, { hidden });
  if (entries.length === 0) return null;
  const say = await currentSpeaker();

  const nameFor = (stone: string) =>
    stone === "black"
      ? game.blackName.trim() || stoneName(say, "black")
      : game.whiteName.trim() || stoneName(say, "white");

  // A row of emoji is a reaction; a game with words typed into it is a talk.
  const spoken = spokenCount(game.reactions);

  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="conversation">
      <h2 className={SECTION_TITLE}>
        {say.pairsWithKanji ? (
          <>
            {say.say(spoken > 0 ? "replay.said" : "replay.sent")}{" "}
            <span className="font-mincho text-[0.8rem] font-normal tracking-normal">対話</span>
          </>
        ) : (
          say.say(spoken > 0 ? "replay.said" : "replay.sent")
        )}
      </h2>

      <ol className="flex flex-col gap-2">
        {entries.map((entry) => (
          <li
            key={entry.moveNumber ?? "before"}
            className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-rule pt-2 first:border-t-0 first:pt-0"
            data-testid="conversation-entry"
          >
            <span className="w-24 shrink-0 text-xs text-muted">
              {entry.moveNumber === null ? (
                say.say("replay.beforeGame")
              ) : (
                <Link
                  href={`${basePath}/${entry.moveNumber}`}
                  className="underline-offset-4 hover:underline"
                  data-testid="conversation-move"
                >
                  {say.say("replay.moveNumber", { move: String(entry.moveNumber) })}
                </Link>
              )}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              {entry.said.map((one) => (
                <span key={one.id} className="flex flex-wrap items-baseline gap-2 text-sm">
                  <span aria-hidden className="text-base leading-none">
                    {one.emoji}
                  </span>
                  <span className="font-medium">{nameFor(one.stone)}</span>
                  {(one.text ?? "").trim() !== "" ? (
                    <span className="min-w-0 text-ink-soft">{messageIn(say, one.text ?? "")}</span>
                  ) : null}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
