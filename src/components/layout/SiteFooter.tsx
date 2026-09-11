import Link from "next/link";
import { Suspense } from "react";

import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { languageOptions } from "@/lib/i18n/dictionaries";
import { LANG_PARAM, type PhraseKey } from "@/lib/i18n/i18n.constants";
import { STAGE, versionStamps } from "@/lib/version";

import { LanguagePicker } from "./LanguagePicker";

/*
 * Champions is not here any more, and its absence is the point.
 *
 * A word in the colophon was the ONLY route to the per-game ladders, which is
 * the opposite of what a colophon is for: the page answering a reader's whole
 * errand about a game — who is best at it, where everybody stands, its family
 * — was reachable from the bottom of every page and from nowhere anybody stood
 * when they actually wanted it. Meanwhile the rules page, which every game
 * name on this site leads to by a rule the build enforces, had a text link to
 * it and no ladder on it.
 *
 * So the ladder moved to where the question gets asked rather than the link
 * moving to where the ladder was. Each game's own page now carries its
 * standings and leads on to the whole of them; /players still links the index
 * from the site-wide ladder, and /games/all lists every game's.
 *
 * The order mattered and was kept: `gameFrontDoor.coverage.test.ts` was
 * written BEFORE this row came out, and watched to fail — it fails if a game's
 * page stops carrying its ladder or stops leading to the whole of it. So "it
 * is reachable now" is a test rather than the opinion of whoever did the
 * removing, which is how something quietly becomes unreachable.
 */
/*
 * Rules and Every game went the same way, for the same reason, under the same
 * condition.
 *
 * Rules pointed at an index of rules pages, and there is no such index now: a
 * game's rules are a facet of the game, at /games/<slug>/rules, and the way to
 * them is the game. Every game pointed at /games/all, which was a second index
 * of the same forty games laid out as text — it is a VIEW of /games now,
 * /games?view=list, reached from a switch on the page itself, because how a
 * list is arranged is a filter rather than a different collection.
 *
 * So what is left is four: the catalogue, the record, the people, and the
 * colophon's own page about the site. Each is a section rather than a document
 * about one, which is what the foot of a page is for.
 *
 * `gamesRoot.coverage.test.ts` was written and watched to fail BEFORE these
 * two rows came out, the same way this file's Champions row was handled. It
 * fails the build if /games stops leading to the games, if the catalogue stops
 * offering the plain list, or if a game's page stops leading to its rules.
 *
 * Two phrases went with them, and that is the cascade rather than a side
 * effect: a key nothing renders still lands on the Japanese review sheet as a
 * row somebody is asked to read. `nav.rules` survives — it names the rules of
 * a game now — and `nav.everyGame` does not, because nothing says it.
 */
const LINKS: readonly { href: string; phrase: PhraseKey }[] = [
  { href: "/games", phrase: "nav.games" },
  { href: "/history", phrase: "nav.record" },
  { href: "/players", phrase: "nav.players" },
  { href: "/about", phrase: "nav.about" },
];

/**
 * The colophon, at the foot of every page: the way a Japanese book ends with
 * its 奥付, the edition page. The stage in a word, and the edition in three
 * numeral systems — the site's own, the Roman, and the everyday Japanese —
 * small and quiet, because it is a stamp, not a banner.
 */
export async function SiteFooter() {
  const stamps = versionStamps();
  const say = await currentSpeaker();
  return (
    <footer
      data-chrome
      className="mt-auto flex w-full flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-rule pt-5 text-xs text-muted"
      data-testid="site-footer"
    >
      <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span>
          Itsutsu <span className="font-mincho">五つ</span>
        </span>
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="underline-offset-4 hover:underline">
            {say.say(link.phrase)}
          </Link>
        ))}
        {/*
          The colophon is where a book says what edition and what language it
          is, so it is where this site does too. Suspended because the picker
          reads the query to carry it across, the way the rules index suspends
          its filter for the same reason.
        */}
        <Suspense fallback={null}>
          <LanguagePicker
            options={languageOptions()}
            current={say.locale}
            param={LANG_PARAM}
            label={say.say("site.language")}
          />
        </Suspense>
      </span>
      {/*
        The edition leads to what is in it. A colophon names the edition and
        this one can be asked what that edition brought, which is a better
        home for the answer than a seventh word in the row opposite.
      */}
      <Link
        href="/releases"
        className="flex flex-wrap items-baseline gap-x-3 font-mono tabular-nums underline-offset-4 hover:underline"
        title={`Version ${stamps.semver} — what has shipped`}
        data-testid="version-link"
      >
        <span className="font-sans font-semibold text-ink-soft">{STAGE}</span>
        <span data-testid="site-version">{stamps.semver}</span>
        <span className="opacity-70">{stamps.roman}</span>
        <span className="font-mincho opacity-70">{stamps.kanji}</span>
      </Link>
    </footer>
  );
}
