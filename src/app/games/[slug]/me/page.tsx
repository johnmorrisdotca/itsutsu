import { variantName } from "@/lib/gomoku/variantCopy";
import type { Metadata } from "next";
import Link from "@/components/ui/Link";
import { notFound } from "next/navigation";

import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { RecordPage } from "@/components/history/RecordPage";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { currentMemberId } from "@/lib/auth/currentSession";
import { findMemberById } from "@/lib/auth/members";
import { gamePath, historyPath, myGamePath, variantFor } from "@/lib/gomoku/slugs";
import { puzzleForAddress } from "@/lib/catalogue/settingAddress";
import { PuzzleMePage } from "@/components/puzzles/PuzzleMePage";
import { gameNameFor } from "@/lib/catalogue/gameKeys";
import { titleWithKanji } from "@/components/games/pageTitles";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { GameTrail } from "@/components/games/GameTrail";

// Whose games these are is read from the session on every request.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/games/[slug]/me">): Promise<Metadata> {
  const variant = variantFor((await params).slug);
  const say = await currentSpeaker();
  return {
    title: variant === null ? say.say("gamepages.yourGames") : titleWithKanji(say, "gamepages.titleYourGame", "自分の棋譜", { game: variantName(variant, say) }),
    robots: { index: false, follow: false },
  };
}

/**
 * The reader's own games of one game, at /games/<slug>/me.
 *
 * The same record as /games/<slug>/history with one filter already applied, so
 * it is the record component with `impliedPlayer` set rather than a second
 * listing that would drift from it. The filter still arrives as a chip, this
 * site's rule about a page a filter narrowed — it says what it was narrowed
 * to — but it is not one the chip's "×" can take off: this address always
 * means "my games", so the chip leads to the reader's own player page instead.
 *
 * NOTHING IS SHOWN TO SOMEBODY THIS PAGE CANNOT NAME. A reader with no session
 * — or a session with no member row behind it — has no games here to count,
 * and an unfiltered record would be every member's games wearing the word
 * "your". A record of noughts would be worse still: it reads as "you have
 * never played this" about somebody the page simply failed to identify. So it
 * says which of the two happened and offers the way out.
 */
export default async function MyGamesOfPage({ params, searchParams }: PageProps<"/games/[slug]/me">) {
  const { slug } = await params;
  // A puzzle's own page is your solves and races of it: see `PuzzleMePage`. A Gomoji's are one language's.
  const puzzle = puzzleForAddress(slug, await searchParams);
  if (puzzle !== null) return <PuzzleMePage kind={puzzle} />;
  const variant = variantFor(slug);
  if (variant === null) notFound();
  const say = await currentSpeaker();

  // By member id: a member who came in with an invite code has games of their own here too.
  const myId = await currentMemberId();
  const me = myId === null ? null : await findMemberById(myId);

  if (me === null) {
    return (
      <Page>
        <SiteHeader />
        <PageTitle
          title={say.say("gamepages.yourGamesTitle", { game: gameNameFor(variant, say) })}
          crumb={<GameTrail game={{ label: gameNameFor(variant, say), href: gamePath(variant) }} steps={[{ label: say.say("gamepages.yoursCrumb") }]} />}
          lead={
            myId === null
              ? say.say("gamepages.meUnknown")
              : say.say("gamepages.meNoPlayer")
          }
        />
        <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="my-games-unknown">
          <p className="text-sm">
            <Link href={historyPath(variant)} className="underline underline-offset-4">
              {say.say("gamepages.everyGameHere", { game: gameNameFor(variant, say) })}
            </Link>
          </p>
        </section>
      </Page>
    );
  }

  /*
   * The player is fixed by the address, not by the query: this collection IS
   * "my games of this game". Anything else a reader asks for — how they went,
   * which board, the sort — still comes from the query and is layered on top.
   *
   * `impliedPlayer` carries the filter to the query WITHOUT putting it in
   * `params` — `params` is what `RecordPage` turns into this page's own
   * address (and the Pager's, for page 2 onward), and a member's whole name
   * has no business there: this site shows only "Hanako M." elsewhere and
   * links to a person by id, never by name (see `playerPath`). Read as
   * `params` alone, this page's own address never carries who "me" is at all.
   */
  const asked = await searchParams;
  return (
    <RecordPage
      variant={variant}
      params={asked}
      impliedPlayer={{ name: me.name, memberId: me.id ?? null }}
      at={myGamePath(variant)}
    />
  );
}
