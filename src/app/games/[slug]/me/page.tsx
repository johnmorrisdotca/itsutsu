import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Page } from "@/components/layout/Page";
import { RecordPage } from "@/components/history/RecordPage";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { currentEmail } from "@/lib/auth/currentSession";
import { findMember } from "@/lib/auth/members";
import { historyPath, myGamePath, variantFor } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";

// Whose games these are is read from the session on every request.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/games/[slug]/me">): Promise<Metadata> {
  const variant = variantFor((await params).slug);
  return {
    title: variant === null ? "Your games" : `Your ${RULE_VARIANT_DISPLAY[variant].label} 自分の棋譜`,
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
  const variant = variantFor((await params).slug);
  if (variant === null) notFound();
  const copy = RULE_VARIANT_DISPLAY[variant];

  const email = await currentEmail();
  const me = email === null ? null : await findMember(email);

  if (me === null) {
    return (
      <Page width="standard" gap="gap-6">
        <SiteHeader />
        <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="my-games-unknown">
          <h1 className="text-lg font-semibold">Your games of {copy.label}</h1>
          <p className="max-w-prose text-sm text-muted">
            {email === null
              ? "This page counts your own games, and it does not know who you are yet."
              : "This page counts your own games, and there is no player on this account yet — finish one and it will have something to show."}
          </p>
          <p className="text-sm">
            <Link href={historyPath(variant)} className="underline underline-offset-4">
              Every game of {copy.label} played here
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
