import { Paired } from "@/components/i18n/Paired";
import Link from "next/link";

import { BrandStones } from "@/components/layout/BrandMarks";
import { Page } from "@/components/layout/Page";
import { GAME_FAMILIES } from "@/lib/gomoku/families";
import { InviteFriends } from "@/components/mine/InviteFriends";
import { cookies } from "next/headers";

import { HereNowPanel } from "@/components/mine/HereNowPanel";
import { START_COPY } from "@/components/mine/mine.constants";
import { STONES } from "@/lib/gomoku/gomoku.constants";
import { OPEN_GAMES_SHOWN, fetchOpenSeats, fetchPosterCountries } from "@/lib/history/openGames";
import { SEAT_RATING, filterOpenSeats, posterOf, readOpenSeatFilter } from "@/lib/history/openSeatsFilter";
import type { GameSummary } from "@/lib/history/gameHistory.types";
import { ratingsByName } from "@/lib/rating/players";
import { playerKey } from "@/lib/rating/playerKey";
import { sweepOpenSeats } from "@/lib/bots/botSeats";
import { seatClaims } from "@/lib/history/seatCookie";
import { ignoredMemberIds } from "@/lib/social/ignores";
import { fetchHereNow } from "@/lib/social/presence";
import { fetchPlayedCounts } from "@/lib/history/gameCounts";
import { GameCatalogue } from "@/components/games/GameCatalogue";
import { readCatalogueView, type CatalogueView } from "@/lib/gomoku/catalogueView";
import type { CatalogueFamily } from "@/components/games/games.types";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import type { Speaker } from "@/lib/i18n/i18n";
import { currentMemberId, currentSession } from "@/lib/auth/currentSession";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { OpenGamesBoard } from "@/components/mine/OpenGamesBoard";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS } from "@/components/ui/ui.constants";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";

export const metadata = { title: "Games 種目" };

// Read from the database on every request, never at build time.
export const dynamic = "force-dynamic";


/**
 * THE GAMES. /games, and the one index of them there is.
 *
 * It was three. This page listed them by family, /rules listed them as cards
 * with an A–Z, and /games/all listed them as text — three indexes of one
 * collection, each reachable from somewhere the other two were not. They are
 * three VIEWS now, chosen in the query, because how a list is laid out is a
 * filter and not an identity.
 *
 * One plain choice still comes first, so nobody has to understand forty games
 * to start playing; the catalogue sits below for whoever wants to look around.
 */
export default async function LobbyPage({ searchParams }: PageProps<"/games">) {
  const asked = await searchParams;
  const filter = readOpenSeatFilter(asked);
  // How the catalogue below is laid out. A filter, so it lives in the query.
  const view = readCatalogueView(asked);
  const say = await currentSpeaker();

  /**
   * WHO IS ASKING, BEFORE ANYTHING ELSE IS ASKED.
   *
   * This page is open without an invite, and everything below this line is a
   * database read for the lobby — the posted seats, who is here, what has been
   * played. A stranger is shown none of it, so a stranger must not pay for any
   * of it: the catalogue they came for is tables in this repository and needs
   * no query at all.
   *
   * MEASURED RATHER THAN REASONED. The reads were in one `Promise.all` with
   * `currentEmail()` and ran whatever the answer was, and a signed-out request
   * to /games answered 500 against a database that was not there — on the one
   * page a stranger is most likely to open. It would not have failed in
   * production, where the database IS there; it would have quietly cost a
   * handful of queries per visitor to build a lobby nobody was going to see,
   * which is this repo's own "cost per call times call count" all over again.
   *
   * THE QUESTION IS "IS THERE A SESSION", NOT "IS THERE AN ADDRESS", and the
   * difference is a person. This asked `currentEmail()`, which is null for a
   * browser holding an INVITE session — somebody who redeemed a code and never
   * signed in with Google, which is how everybody John invites gets in. They
   * were shown the stranger's page: "playing one needs an invite", and a link
   * to the door they had already come through. No lobby, no open seats, no way
   * to start a game. The masthead beside it said "Sign out", because
   * `SiteHeader` asks `currentSession()` — two halves of one page disagreeing
   * about the same reader.
   *
   * `email === null` means both "a stranger" and "a member who joined by
   * code", which is exactly the fault AGENTS.md calls Nothing Answers What It
   * Cannot Answer. So the gate for the lobby is the session, and the address
   * is carried on as `signedIn` for the parts that genuinely need a name.
   */
  const session = await currentSession();
  if (session === null) {
    return <PublicCatalogue view={view} say={say} />;
  }
  const email = session.email ? session.email.trim().toLowerCase() : null;

  const claims = seatClaims((await cookies()).getAll());
  /*
   * A seat that has sat on this board longer than the grace period is taken by
   * one of the computer players, so a game posted on a quiet evening is still a
   * game by the morning. Throttled and not awaited: the listing below is what
   * the reader came for.
   *
   * Below the check above, deliberately. It takes seats on behalf of the
   * computer players — it WRITES — and an anonymous page view is the last
   * thing that should set that going.
   */
  sweepOpenSeats();

  const claimed = [...claims.keys()];
  const [mine, counts, seatGames, here] = await Promise.all([
    currentMemberId(),
    fetchPlayedCounts(),
    fetchOpenSeats(claimed),
    fetchHereNow(),
  ]);
  /*
   * Who this reader has shut out, by id, because a seat is keyed by member
   * and the list is kept by address. An invite holder has no address, so
   * there is nobody for them to ignore.
   *
   * The list of possible OPPONENTS went with the sentence: it belonged to a
   * form that is not on this page any more, and the setup screen builds it
   * from the one place that builds it. This page used to keep a copy, and the
   * copy asked this set of member ids whether it held an ADDRESS — a question
   * with only one answer, so the ignore list did nothing here at all.
   */
  const ignored = email === null ? new Set<string>() : await ignoredMemberIds(email);

  /*
   * Two seats never belong on somebody's board: their own, and one posted by
   * a member they ignore.
   *
   * Their own, because you cannot sit across from yourself, and the sentence
   * above was offering to — "Sit down with John Morris" on John's own screen,
   * against a seat he had posted himself. The server refuses that, so the
   * offer was one the site would then reject, which is a worse thing to show
   * somebody than no offer at all. It had been excluded by the browser's own
   * seat cookies, and a cookie is the wrong key: a seat belongs to the
   * account on every device, so posting on a phone and reading the board on a
   * laptop offered it straight back.
   *
   * The ignore list is a rule about who may reach you, and a seat is a way in
   * — and it was not working at all: the list is kept by address, a seat is
   * keyed by member id, and asking a set of addresses whether it holds an id
   * is a question with only one answer.
   */
  const theirs = (game: GameSummary) => {
    const poster = game.openSeat === STONES.black ? game.whiteMemberId : game.blackMemberId;
    if (poster === null) return true;
    if (mine !== null && poster === mine) return false;
    return !ignored.has(poster);
  };
  /*
   * Narrowed first, and then cut — in that order, which is the whole of what
   * went wrong here twice. The seats a reader cannot sit in are taken out of
   * the list before either reader of it decides how much to take: the board
   * shows the newest thirty of what is left, and the sentence keeps one of
   * each kind. A list cut to thirty and then narrowed has lost seats the
   * narrowing would have kept, and one kept per kind and then narrowed loses
   * a whole kind whenever the one kept was the reader's own.
   */
  const usable = seatGames.filter(theirs);

  /*
   * The rating a reader asked to filter posters by. Looked up once, for
   * every name on the board, only when the filter actually asks for a
   * rating — a filter left at "any" has nothing to gain from a query the
   * narrowing itself never reads.
   */
  const ratingsByKey =
    filter.rating === SEAT_RATING.any
      ? new Map<string, number | null>()
      : await ratingsByName(usable.map((game) => posterOf(game).name));
  const narrowed = filterOpenSeats(usable, filter, (name) => ratingsByKey.get(playerKey(name)) ?? null);
  const openSeats = narrowed.slice(0, OPEN_GAMES_SHOWN);
  // The flag beside a name, for exactly the rows this page is about to show.
  const countryByMemberId = await fetchPosterCountries(openSeats.map((game) => posterOf(game).memberId));

  /*
   * The catalogue's own view of the same families, with what has been played
   * of each. Built here because this is where the counts are read; the
   * component below is handed rows and asks the database nothing.
   */
  const families: CatalogueFamily[] = GAME_FAMILIES.map((family) => ({
    title: family.title,
    kanji: family.kanji,
    blurb: family.blurb,
    played: family.games.reduce((n, game) => n + (counts.get(game)?.played ?? 0), 0),
    games: family.games.map((variant) => {
      const copy = RULE_VARIANT_DISPLAY[variant];
      const count = counts.get(variant);
      return {
        variant,
        label: copy.label,
        kanji: copy.kanji,
        tagline: copy.tagline,
        inspiredBy: copy.inspiredBy,
        played: count?.played,
        last: count?.last ?? undefined,
      };
    }),
  }));

  return (
    <Page width="standard">
      <SiteHeader />

      {/*
        * Starting a game comes first, and that is the fix rather than a
        * preference. "Your games" grows without limit as somebody plays, so
        * anything under it is pushed further down every week — John found the
        * dropdown a full scroll below the fold, which is the same complaint
        * that made this panel one sentence in the first place. A section whose
        * height is fixed cannot bury anything, and a section that grows cannot
        * bury what is above it.
        */}
      {/*
        THE LOBBY IS FOR MEMBERS; THE CATALOGUE BELOW IS FOR ANYBODY.

        This page became open without an invite when a game stopped having a
        /rules page of its own — it is what the /rules index was, and John's
        rule is that reading is open and playing is gated: "strangers should be
        able to browse the site, the games, the rules etc... they need to
        register to play."

        Everything in this section is the playing half. Posted seats are
        members offering games and carry their names; who is here is members;
        the form starts a game. None of it is anything a stranger can act on,
        and all of it names people. So it is not drawn for them at all, rather
        than drawn and then refused — an offer the site would turn down is a
        worse thing to show somebody than no offer.

        Decided HERE and not in `proxy.ts`, which is that file's own rule:
        an addition belongs after the gate has already said yes, never inside
        the deciding. A section that only ever renders for a member cannot turn
        a no into a yes.
      */}
      <section className="flex flex-col gap-4" data-testid="lobby-start">
        <h2 className="flex items-baseline gap-2 text-lg font-semibold">
          <Paired en={START_COPY.title.label} kanji={START_COPY.title.kanji} kanjiClassName="text-sm font-normal opacity-70" />
        </h2>
        <p className="max-w-prose text-sm text-muted">{START_COPY.lead}</p>
        {/*
          A way in rather than a form. This was a sentence with dropdowns in
          it, which settled some of a game and left the rest to be discovered
          at a board that already looked like a game — John's words for it were
          "very bad design", and he was right: a thing you are still deciding
          should not be sitting on a board that has already started.

          So the lobby offers the door and /games/new is the room. Everything a
          game will be played under is settled there, and nothing is written
          until it is all decided.
        */}
        <div className={`${PANEL_CLASS} flex flex-wrap items-center gap-3`} data-testid="lobby-start-ways">
          <Link href="/games/new" className={`${BUTTON_BASE} ${BUTTON_STRONG} px-4 py-2`} data-testid="lobby-set-up">
            Play 対局
          </Link>
          <span className="text-xs text-muted">
            The game, the board, the pace and who it is against — settled before it exists.
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-[3fr_2fr]">
          <OpenGamesBoard
            games={openSeats}
            shown={narrowed.length}
            total={usable.length}
            filter={filter}
            countryByMemberId={countryByMemberId}
          />
          <HereNowPanel here={here} me={email} />
        </div>
      </section>

      {/*
        The games you have going are their own page now, at /play. This one
        is for starting another, and for meeting the games themselves: the
        sentence, the open seats, the room, and the whole catalogue underneath.
      */}
      <InviteFriends />

      <BrandStones className="py-1 opacity-80" />

      {/*
        LEARN IS OFFERED HERE, PROMINENTLY, AND THAT IS WHY IT LEFT THE
        NAVIGATION. A word in the bar was five words of chrome on every page of
        the site for a shelf most readers want exactly once — when they have
        met a game and want to get better at it. This is where they have just
        met one.

        Written before the bar was shortened, not after: `gamesRoot.coverage`
        fails the build if this section stops leading to /learn, so "it is
        reachable now" is a test rather than the opinion of whoever removed the
        link.
      */}
      <section className={`${PANEL_CLASS} flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2`} data-testid="games-learn">
        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex items-baseline gap-2 text-base font-semibold">
            <Paired en="Learn how to play them" kanji="学び" kanjiClassName="text-sm font-normal opacity-70" />
          </span>
          <span className="max-w-prose text-sm text-muted">
            The shapes that win, the moves that force, and the mistakes everyone makes once.
            Each guide names the games it applies to.
          </span>
        </span>
        <Link
          href="/learn"
          className={`${BUTTON_BASE} ${BUTTON_QUIET} shrink-0 px-4 py-2`}
          data-testid="games-learn-link"
        >
          The learning shelf →
        </Link>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="flex items-baseline gap-2 text-lg font-semibold">
          {/*
            `nav.everyGame` names this heading now. It used to name the page at
            /games/all, which has become the plain-list VIEW below — so the
            phrase did not die with the page, it moved down to the section
            whose list it was always describing.
          */}
          <Paired en={say.say("nav.everyGame")} kanji="全種目" kanjiClassName="text-sm font-normal opacity-70" />
        </h2>
        <p className="max-w-prose text-sm text-muted">
          {/*
            The count lives on the plain list rather than here, and that is the
            gate's doing rather than a preference: a number beside the word
            "games" has to lead to those games, and a count of RULE SETS has
            nowhere to lead. The list view states it with the exception written
            against it, once, where it is a fact about the catalogue and not a
            promise this sentence cannot keep.
          */}
          Almost every game here is five in a row with one idea changed. Every name below leads to
          that game — its rules, its record, its standings and a board — and the three ways of
          looking at the list are the same games arranged differently.
        </p>
        <GameCatalogue view={view} families={families} signedIn />
      </section>
  </Page>
  );
}

/**
 * /games for somebody with no invite: the catalogue, and nothing that needs a
 * database.
 *
 * A SEPARATE COMPONENT RATHER THAN A HANDFUL OF CONDITIONS, because the
 * property worth having is one somebody can check by reading: there is no
 * query in here. Written as `{signedIn ? … : null}` around each panel above,
 * the reads would still have happened — they are awaited before any of it is
 * drawn — and the page would have gone on costing a stranger the whole lobby
 * to render none of it.
 *
 * The families carry no counts and no last game, which is not an omission. A
 * count of matches is members' activity and the last game names two of them,
 * and both would be a database read on a page that now has no reason to make
 * one. What a stranger came for is which games exist and what they are, and
 * that is a table in this repository.
 */
function PublicCatalogue({ view, say }: { view: CatalogueView; say: Speaker }) {
  const families: CatalogueFamily[] = GAME_FAMILIES.map((family) => ({
    title: family.title,
    kanji: family.kanji,
    blurb: family.blurb,
    // Nought here means "not counted", and it is never printed: the family
    // line and the last game are both drawn only for a member.
    played: 0,
    games: family.games.map((variant) => {
      const copy = RULE_VARIANT_DISPLAY[variant];
      return {
        variant,
        label: copy.label,
        kanji: copy.kanji,
        tagline: copy.tagline,
        inspiredBy: copy.inspiredBy,
      };
    }),
  }));

  return (
    <Page width="standard">
      <SiteHeader />

      {/*
        What a stranger gets where a member gets the lobby: the one sentence
        that says how this place works, and the door. Not a greyed-out copy of
        the panel they cannot use — an offer the site would refuse is a worse
        thing to show somebody than no offer at all.
      */}
      <section
        className={`${PANEL_CLASS} flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2`}
        data-testid="games-join"
      >
        <span className="max-w-prose text-sm text-muted">
          Every game here is free to read about — the rules, what it is, where it came from, and
          the family it belongs to. Playing one needs an invite.
        </span>
        <Link href="/join" className={`${BUTTON_BASE} ${BUTTON_QUIET} shrink-0 px-4 py-2`}>
          I have an invite →
        </Link>
      </section>

      <BrandStones className="py-1 opacity-80" />

      {/* Open too, and the best thing to read next if a game has caught them. */}
      <section
        className={`${PANEL_CLASS} flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2`}
        data-testid="games-learn"
      >
        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex items-baseline gap-2 text-base font-semibold">
            <Paired en="Learn how to play them" kanji="学び" kanjiClassName="text-sm font-normal opacity-70" />
          </span>
          <span className="max-w-prose text-sm text-muted">
            The shapes that win, the moves that force, and the mistakes everyone makes once.
            Each guide names the games it applies to.
          </span>
        </span>
        <Link href="/learn" className={`${BUTTON_BASE} ${BUTTON_QUIET} shrink-0 px-4 py-2`} data-testid="games-learn-link">
          The learning shelf →
        </Link>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="flex items-baseline gap-2 text-lg font-semibold">
          <Paired en={say.say("nav.everyGame")} kanji="全種目" kanjiClassName="text-sm font-normal opacity-70" />
        </h2>
        <p className="max-w-prose text-sm text-muted">
          Almost every game here is five in a row with one idea changed. Every name below leads to
          that game, and the three ways of looking at the list are the same games arranged
          differently.
        </p>
        <GameCatalogue view={view} families={families} signedIn={false} />
      </section>
  </Page>
  );
}
