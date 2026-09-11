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
  "/my-games": "nav.play",
  "/games": "nav.games",
  "/rules": "nav.rules",
  "/learn": "nav.learn",
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
  { href: "/my-games", label: "Play" },
  { href: "/games", label: "Games" },
  { href: "/rules", label: "Rules" },
  { href: "/learn", label: "Learn" },
  { href: "/players", label: "Players" },
  { href: "/about", label: "About" },
] as const;

/** The site's sections, with the one the reader is in underlined. */
export function NavLinks() {
  const pathname = usePathname();
  const say = useSpeaker();
  return (
    <>
      {NAV.map((item) => {
        const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
            {item.href === "/my-games" ? <YourTurnBadge /> : null}
          </Link>
        );
      })}
    </>
  );
}
