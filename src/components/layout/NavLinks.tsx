"use client";

import Link from "@/components/ui/Link";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { YourTurnBadge } from "@/components/mine/YourTurnBadge";
import { BUTTON_BASE, BUTTON_STRONG, TAP_HEIGHT } from "@/components/ui/ui.constants";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";
import { useSitePathname } from "@/lib/stranger/useSitePathname";

/** The one screen a game is set up on — see the button after the tabs. */
const NEW_GAME_HREF = "/games/new";

/*
 * The site's own sections, for everybody who is in. The features board is
 * deliberately absent: it is the operator's now, and lives as a tab of the
 * Admin page rather than as a section of the site.
 */
export const NAV = [
  /*
   * Two entries where there was one, and Play keeps its word. It used to mean
   * both "the games I have going" and "start another", on a page that did both
   * and grew a section every time somebody played — so everything under the
   * queue sank a little further every week.
   *
   * John's call on the wording, and it is the better one: Play already means
   * going to play your games, so it points at them. Games is the catalogue,
   * which is what the word says. Neither needed a new phrase.
   *
   * And there is no kanji in the bar at all now. Play carried 遊ぶ while Rules,
   * Learn, Players and About beside it carried nothing — which read as
   * deliberate while Play stood alone and as an oddity next to Games. John,
   * asked about the one other survivor: "fine drop them all now." So the
   * navigation reads in one language.
   *
   * Only the navigation and the front door. A kanji paired with a heading
   * elsewhere — a game's name, a section title, the rules pages — is the
   * site's own voice and stays.
   */
  /*
   * "MY GAMES", WHICH IS WHAT THE PAGE IS CALLED. John, 2026-09-24: "Play, New
   * Game and Games is confusing... we have 3 different tabs to play games...
   * I don't know what is what." They are ItsYourTurn's and GoldToken's three:
   * My Games, Start a Game and the list of games. The tab said Play and the page
   * said My games, and Play was also the word on every button that starts one.
   */
  { href: "/play", phrase: "nav.play" },
  { href: "/games", phrase: "nav.games" },
  /*
   * RULES AND LEARN ARE GONE FROM HERE, AND NEITHER IS GONE FROM THE SITE.
   *
   * Rules pointed at an index of forty rules pages. There is no such index any
   * more, because a game's rules belong to the game: they are at
   * /games/<slug>/rules, reached from the game, which every name on this site
   * leads to. A row in the bar for "the rules of some game or other" was
   * asking a reader to pick a game from a page about rules, when what they
   * always had in mind was a game.
   *
   * Learn left for a different reason. It is a shelf of guides most readers
   * want exactly once — after meeting a game, wanting to get better at it —
   * and it was costing a word of chrome on every page of the site to serve
   * that. It is offered from /games now, in a section of its own, which is
   * where somebody has just met a game. Its lessons keep their addresses:
   * /learn/<slug> is untouched, and a game's rules page still names the guides
   * that cover it.
   *
   * Both rows came out AFTER `gamesRoot.coverage.test.ts` was written and
   * watched to fail. That file now fails the build if either route in
   * disappears, so "it is still reachable" is a test rather than the opinion
   * of whoever did the removing.
   */
  { href: "/players", phrase: "nav.players" },
  /*
   * XP, BESIDE PLAYERS BECAUSE IT IS THE OTHER LADDER.
   *
   * Players holds the rating — how well somebody plays, pooled and per variant.
   * This holds the experience — that they turned up and tried things. They are
   * two independent standings and neither can be bought with the other, so they
   * read as a pair rather than as one under the other.
   *
   * No row in `NAV_PHRASE` for it, and that is the table's own design: an
   * address with no phrase keeps its English label, so a section can be added
   * without touching the dictionaries. "XP" is also the word a Japanese player
   * uses for it — 経験値 is paired with the heading on the page itself, where
   * there is room for two scripts and the bar has room for one.
   */
  { href: "/xp", phrase: "nav.xp" },
  { href: "/about", phrase: "nav.about" },
] as const satisfies readonly { href: string; phrase: PhraseKey }[];

/**
 * WHICH ROW THE READER IS IN, WHERE ONE ADDRESS SITS UNDER ANOTHER.
 *
 * `startsWith` alone said "you are in Games" about /games/new as well as "you
 * are in New game", so both rows underlined themselves on the setup screen and
 * the bar claimed the reader was in two places. The longest match wins instead:
 * the most specific row that could be talking about this address is the one
 * that is.
 *
 * Computed once for the whole bar rather than asked per row, because "am I the
 * current one" is a question about the WHOLE list and no row can answer it
 * alone — which is exactly why asking it per row gave two answers.
 */
function currentHref(pathname: string): string | null {
  // Setting a game up is New game's, the button beside these, not the catalogue's.
  if (pathname === NEW_GAME_HREF) return null;
  const matches = NAV.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  if (matches.length === 0) return null;
  return matches.reduce((best, item) => (item.href.length > best.href.length ? item : best)).href;
}

/** The site's sections, with the one the reader is in underlined. */
export function NavLinks() {
  const pathname = useSitePathname();
  const say = useSpeaker();
  const here = currentHref(pathname);
  return (
    <>
      {/*
        THE TABS IN A BOX OF THEIR OWN ON A PHONE, SO NEW GAME CAN STAND BESIDE
        THEM. John, 2026-09-28, at a phone header where the button had a row
        to itself: "The New Game button is still alone". Below `sm` the tabs
        take what the button leaves and wrap inside that, so on the narrowest
        phones they go to two short lines with the button beside both, never
        under them. At `sm` and up the box is `contents`, and the bar is the
        one flat row of tabs and button it always was.
      */}
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1 sm:contents">
        {NAV.map((item) => {
          const current = item.href === here;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current ? "page" : undefined}
              // While a game is played only My games stays, the way to the others waiting (`PlayingNow`).
              data-quiet-in-play={item.href === "/play" ? undefined : ""}
              /*
               * `relative` so the waiting count has something to hang off.
               *
               * The badge is a pip over this link's top corner rather than a word
               * appended to the bar, because the bar has no room for one: it is
               * read in the browser and arrives after the page, and in the flow
               * those pixels wrapped the whole masthead at an iPad's width. See
               * `YourTurnBadge`, which carries the measurement. A positioned
               * inline element with no offsets of its own draws exactly as it did
               * before, so every row keeps the class and only Play uses it.
               */
              className={`relative whitespace-nowrap underline-offset-4 hover:underline ${
                current ? "font-semibold underline decoration-moss decoration-2" : ""
              }`}
            >
              {/*
                No kanji here any more. Play was the last entry carrying one and
                John asked for it to go, so the branch that drew them went with
                it rather than sitting unused and untyped — every remaining entry
                is one word, Admin included.

                One word each, in the reader's own language: a Japanese reader
                gets 遊ぶ where an English reader gets Play. That is the same
                decision, not a reversal of it — what he took out of the bar was
                two scripts at once, and there is still only ever one here.
              */}
              {say.say(item.phrase)}
              {/* The count of games waiting on you belongs beside the page that
                  holds them, not beside the one that starts new ones. */}
              {item.href === "/play" ? <YourTurnBadge /> : null}
            </Link>
          );
        })}
      </span>
      {/*
        NEW GAME IS A BUTTON, NOT A TAB. John, 2026-09-24: "New Game should be
        prominent, since its a good page." A tab among tabs read as a third
        place to play; a button reads as the one thing to do. Every other way
        in — a game's Play, a player's Play, the empty My games — lands on the
        same screen, so this is the door and they are shortcuts to it.
      */}
      <Link
        href={NEW_GAME_HREF}
        aria-current={pathname === NEW_GAME_HREF ? "page" : undefined}
        className={`${BUTTON_BASE} ${BUTTON_STRONG} ${TAP_HEIGHT} shrink-0 px-2.5 py-1 text-[0.8125rem] whitespace-nowrap sm:px-3 sm:text-sm`}
        data-testid="nav-new-game"
        data-quiet-in-play
      >
        {say.say("nav.newGame")}
      </Link>
    </>
  );
}
