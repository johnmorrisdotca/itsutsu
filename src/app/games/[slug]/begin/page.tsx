import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GameName } from "@/components/games/GameName";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Doorstep, type BeginAction } from "@/components/live/Doorstep";
import { DOORSTEP_COPY } from "@/components/live/live.constants";
import { describeGameProse, describeSeating, playerWord } from "@/components/live/doorstepSays";
import { beginLink, changeLink, type SetUpKnown } from "@/components/live/setUpAddress";
import { readSetUpAsked } from "@/components/live/setUpAsked";
import { setUpFrom } from "@/components/live/setUpFrom";
import { creationFor, openerIn, seatsFor } from "@/components/live/setUpStart";
import { sittingAt } from "@/components/live/sittingAt";
import { currentEmail } from "@/lib/auth/currentSession";
import { gameDefaultsFor } from "@/lib/auth/members";
import { rulesPath, variantFor } from "@/lib/gomoku/slugs";
import { RATING_REFUSALS } from "@/lib/rating/rateable.constants";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/games/[slug]/begin">): Promise<Metadata> {
  const { slug } = await params;
  const variant = variantFor(slug);
  return {
    /*
     * The heading the page itself draws, rather than the same words typed again:
     * this file already imports `DOORSTEP_COPY` for the refusals below, and the
     * tab and the heading naming one page are the case where a second copy shows
     * up as the site disagreeing with itself in a browser's own tab strip.
     */
    title: variant === null ? DOORSTEP_COPY.title : `Begin ${RULE_VARIANT_DISPLAY[variant].label}`,
  };
}

/**
 * THE DOORSTEP, at /games/<game>/begin — what is about to be played, before
 * anything is written.
 *
 * John, after asking several times: "we go straight to the game rather than the
 * Doorstep screen which confirms settings… show the settings before the board,
 * as the board means we're playing!!!!"
 *
 * IT RENDERS ENTIRELY FROM ITS OWN ADDRESS. Every rule the game will be played
 * under is in the query — see `SET_UP_PARAMS` and `draftParams` — so this page
 * is a pure reading of a link. That is what makes the three promises true at
 * once: reaching it writes nothing, reloading it writes nothing, and pointing
 * the same query back at /games/new is a way out with every choice still made.
 * A draft held in a cookie or a store could do none of the three.
 *
 * WHAT IT READS, AND WHAT IT DOES NOT. Nothing extra for an ordinary game. For a
 * rematch, a fork or a named opponent it makes exactly the reads the setup screen
 * before it made, through the same `setUpFrom` — so the pair of pages costs what
 * the one page cost. The one addition is a posted seat being taken, which has a
 * row of its own and has to: the draft matches such a seat on the game, the board
 * and the pace, so describing that game from the draft would be right about the
 * headline and silent about the rest.
 *
 * The game is in the PATH because by this point it is settled, and this site puts
 * identity in the path. That is not in tension with /games/new offering the game
 * as a choice: there it is a question, and here it is the subject.
 */
export default async function DoorstepPage({ params, searchParams }: PageProps<"/games/[slug]/begin">) {
  const [{ slug }, asked] = await Promise.all([params, searchParams]);
  const variant = variantFor(slug);
  if (variant === null) notFound();

  const email = await currentEmail();
  const defaults = await gameDefaultsFor(email);
  const want = readSetUpAsked(asked);
  const from = await setUpFrom({ variant, asked, defaults });

  /*
   * A seat somebody has already posted, where the address names one. Read here
   * rather than trusted, so that the page states the game that actually exists —
   * and says plainly when it has gone, which is a race two people asking for the
   * same game will lose sometimes.
   */
  const noticeboard = want.sit === null ? null : await sittingAt(want.sit, variant);
  const seat = noticeboard?.seat ?? null;
  const gone = noticeboard?.gone ?? null;

  const known: SetUpKnown = {
    against: from.opponent === null ? null : from.opponent.id,
    rematch: from.again === null ? null : from.again.id,
    from: from.fork === null ? null : { id: from.fork.id, move: from.fork.move },
    /* A seat that has gone is not carried back: there is nothing there to sit at. */
    sit: seat?.id ?? null,
  };

  /*
   * The rules being stated. A posted seat's own rules where one is being taken,
   * because those are the rules somebody would be agreeing to; otherwise the
   * draft the address carries, which is what Begin will send.
   */
  const rules = seat?.rules ?? from.initial;
  const { mine, screen } = seatsFor({ again: from.again, fork: from.fork });
  const seating = describeSeating(rules, {
    opponent: seat !== null ? seat.who : (from.opponent?.name ?? null),
    computer: seat === null && (from.opponent?.computer ?? false),
    mine: seat?.mine ?? mine,
    opener: seat?.opener ?? openerIn(from.carry),
    screen,
  });

  /*
   * WHY THIS GAME COULD NEVER COUNT, WHERE THAT IS ALREADY SETTLED.
   *
   * A board at one screen moves no rating whatever the draft says: the write
   * path reads the seats before it asks the names and never reaches
   * `recordResult`. The one press that gets there from here is a fork with
   * nobody to hand the second seat to, which `seatsFor` has just answered for
   * the seating sentence — so both halves of this page read the same fact, and
   * neither can print "Rated" two lines under "Both seats are yours".
   *
   * Null otherwise, and that is not a guess: every other press makes a game
   * between two people, where the rating is a choice and the draft holds it.
   */
  const refused = screen ? RATING_REFUSALS.hotSeat : null;

  /*
   * WHAT BEGIN WILL DO — decided on the server, and the only thing on this page
   * that writes. `creationFor` is the same function the Start button used to send
   * its body through, unchanged: the request is identical, it has simply moved one
   * screen along so that nothing is written before somebody has read what it says.
   */
  const creation = creationFor({
    rules: from.initial,
    source: from.asPlayed,
    opponent: from.opponent,
    again: from.again,
    fork: from.fork,
    carry: from.carry,
  });
  const begin: BeginAction =
    seat !== null
      ? { kind: "sit", id: seat.id, who: playerWord(seat.who, false), instead: creation.body }
      : { kind: "create", body: creation.body };

  const copy = RULE_VARIANT_DISPLAY[variant];
  /*
   * Why the address could not be honoured in full. `setUpFrom`'s own problem
   * first — a rematch of a swept game, a fork past the end of one — then a posted
   * seat that has gone, which is this page's own.
   */
  const problem = from.problem ?? (gone === null ? null : DOORSTEP_COPY.gone[gone]);

  return (
    <Page width="standard" gap="gap-6">
      <SiteHeader />
      <div className="flex flex-col gap-1">
        {/*
          The game's name, leading to the game — the site's standing rule, and
          worth keeping here of all places: somebody about to begin a game they
          have not played before is the reader most likely to want its front door,
          and this is the last moment before reading turns into a move.
        */}
        <h1 className="text-2xl font-semibold" data-testid="doorstep-title">
          <GameName variant={variant} kanji className="no-underline hover:underline" />
        </h1>
        {/* And what the game IS, in its own words, above what this one will be. */}
        <p className="max-w-prose text-sm text-muted">
          {copy.tagline}{" "}
          <Link href={rulesPath(variant)} className="underline underline-offset-4">
            How it is played
          </Link>
          .
        </p>
      </div>
      <Doorstep
        variant={rules.variant}
        address={beginLink(from.initial, known)}
        rules={rules}
        refused={refused}
        prose={describeGameProse(rules, refused)}
        seating={seating}
        change={changeLink(from.initial, known)}
        begin={begin}
        signedIn={email !== null}
        problem={problem}
      />
    </Page>
  );
}
