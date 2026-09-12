import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Paired } from "@/components/i18n/Paired";
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
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/games/[slug]/begin">): Promise<Metadata> {
  const { slug } = await params;
  const variant = variantFor(slug);
  return {
    title: variant === null ? "Before the first stone" : `Begin ${RULE_VARIANT_DISPLAY[variant].label}`,
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
        <h1 className="text-2xl font-semibold" data-testid="doorstep-title">
          <Paired
            en={copy.label}
            kanji={copy.kanji}
            kanjiClassName="text-lg font-normal opacity-70"
          />
        </h1>
        {/*
          The game's own tagline and the way through to how it is played. Somebody
          about to begin a game they have not played before is exactly who wants the
          rules, and the doorstep is the last moment before that stops being reading
          and starts being a move.
        */}
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
        prose={describeGameProse(rules)}
        seating={seating}
        change={changeLink(from.initial, known)}
        begin={begin}
        signedIn={email !== null}
        problem={problem}
      />
    </Page>
  );
}
