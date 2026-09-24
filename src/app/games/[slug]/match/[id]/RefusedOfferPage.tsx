import Link from "next/link";

import { GameName } from "@/components/games/GameName";
import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import type { GameDetail } from "@/lib/history/gameHistory.types";
import { boardPhrase } from "@/lib/gomoku/boardWords";

/**
 * AN OFFER NOBODY TOOK UP, at the address it had.
 *
 * A refused offer is filed `status: finished` — that is how it leaves the
 * active-game cap, the lobby and every sweep — so without this page it fell
 * through to `FiledMatchPage`, the replay. That would have drawn a board, a
 * move list and a result line for a game nobody ever agreed to play:
 * "Unfinished 中断" over an empty board, reading as a game that was started and
 * given up. The whole promise of this feature is that declining costs nothing,
 * and a page that looks like a record of a failure is the promise broken by the
 * only screen that would ever be looked at.
 *
 * So it says the three things a reader needs and nothing that would read as a
 * result: what was offered, that it was refused, and that it cost neither
 * person anything. No board, no move list, no winner, no rating line — those
 * are the pieces that would make it look like a game.
 *
 * NOTHING IS A DEAD END, so it offers the two ways on: the queue, for the
 * person whose offer this was and who followed a link here from it, and the
 * setup screen, for anybody who wants to ask again. Asking again is the right
 * answer to a decline, and the page should say so.
 *
 * Its own file beside `FiledMatchPage.tsx`, which is the other page the match
 * address can turn out to be.
 */
export async function RefusedOfferPage({ game }: { game: GameDetail }) {
  /*
   * WHICH OF THE TWO IT WAS, and they are two columns rather than one for
   * exactly this: "they said no" and "I took it back" are different things to
   * be told, and a single timestamp would have meant both.
   */
  const declined = game.declinedAt !== null;
  return (
    <Page>
      <SiteHeader />
      {/* The title and the notice together carry `refused-offer`: what happened is said in the title. */}
      <section className="flex flex-col gap-6" data-testid="refused-offer">
        <PageTitle
          title={declined ? "This offer was declined" : "This offer was withdrawn"}
          kanji={declined ? "辞退" : "取消"}
        />
        <div className={`${PANEL_CLASS} flex flex-col gap-3`}>
          <p className="text-sm text-ink-soft">
            A game of <GameName variant={game.variant} /> on {boardPhrase(game.variant, game.size)} was
            offered here and{" "}
            {declined
              ? "the other player chose not to play it"
              : "the offer was taken back before it was answered"}
            . It was never started, so there is no result: nobody won, nobody lost, and no rating
            moved for either of them.
          </p>
          <p className="text-xs text-muted">
            Offers cost nothing to refuse, which is the point of them — ask again whenever you like.
          </p>
          <p className="flex flex-wrap gap-4 text-sm">
            <Link href="/play" className="font-medium underline underline-offset-4">
              Your games
            </Link>
            <Link href="/games/new" className="font-medium underline underline-offset-4">
              Set up a game 対局設定
            </Link>
          </p>
        </div>
      </section>
    </Page>
  );
}
