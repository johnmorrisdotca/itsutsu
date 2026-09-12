"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { YourTurnBadge } from "@/components/mine/YourTurnBadge";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";

/**
 * What each section is called, for a reader who is not reading English.
 *
 * Keyed by address rather than written into `NAV` itself. That was originally
 * to keep out of the way of the change that stripped the kanji from this bar,
 * and it earned its keep — that change rewrote every row of `NAV` and deleted
 * the branch that drew the kanji, and merged against this table without
 * touching it.
 *
 * It is worth keeping for the reason rather than the history: an address with
 * no phrase here keeps its English label, so adding a section can never break
 * the bar. It only leaves that one word untranslated until somebody writes it.
 */
const NAV_PHRASE: Readonly<Record<string, PhraseKey>> = {
  "/play": "nav.play",
  "/games": "nav.games",
  "/players": "nav.players",
  "/about": "nav.about",
};

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
  { href: "/play", label: "Play" },
  /*
   * NEW GAME, WHICH THE BAR HAS NEVER HAD, AND EVERY SITE THIS WAS MODELLED ON
   * DOES. ItsYourTurn puts it in the left rail directly under Game Status, and
   * for good reason: the moment you notice you have nothing to move is the
   * moment you want another game, and until now the answer to that was three
   * pages — Games, pick one, then its setup screen.
   *
   * It sits between Play and Games on purpose, and the three read as a
   * progression rather than as a list: Play is the games I have going, New game
   * is another one of my own, Games is the catalogue of what there is. Putting
   * it beside Play also puts the two "my own play" rows together, so Games keeps
   * being about the site's games rather than about mine.
   *
   * ONE LINK AND NOTHING MORE, which it could not have been a week ago. /games/new
   * used to be one of several ways in and the only one that settled anything; now
   * every way in lands there, so a row in the bar pointing at it is the whole
   * feature rather than a fourth door with its own behaviour to keep in step.
   */
  { href: "/games/new", label: "New game" },
  { href: "/games", label: "Games" },
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
  { href: "/players", label: "Players" },
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
  { href: "/xp", label: "XP" },
  { href: "/about", label: "About" },
] as const;

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
  const matches = NAV.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  if (matches.length === 0) return null;
  return matches.reduce((best, item) => (item.href.length > best.href.length ? item : best)).href;
}

/** The site's sections, with the one the reader is in underlined. */
export function NavLinks() {
  const pathname = usePathname();
  const say = useSpeaker();
  const here = currentHref(pathname);
  return (
    <>
      {NAV.map((item) => {
        const current = item.href === here;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={`whitespace-nowrap underline-offset-4 hover:underline ${
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
            {NAV_PHRASE[item.href] === undefined ? item.label : say.say(NAV_PHRASE[item.href])}
            {/* The count of games waiting on you belongs beside the page that
                holds them, not beside the one that starts new ones. */}
            {item.href === "/play" ? <YourTurnBadge /> : null}
          </Link>
        );
      })}
    </>
  );
}
