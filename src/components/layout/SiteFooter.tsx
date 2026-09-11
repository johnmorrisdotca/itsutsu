import Link from "next/link";

import { STAGE, versionStamps } from "@/lib/version";

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
const LINKS = [
  { href: "/about", label: "About" },
  { href: "/rules", label: "Rules" },
  { href: "/history", label: "Record" },
  { href: "/players", label: "Players" },
  { href: "/games/all", label: "Every game" },
] as const;

/**
 * The colophon, at the foot of every page: the way a Japanese book ends with
 * its 奥付, the edition page. The stage in a word, and the edition in three
 * numeral systems — the site's own, the Roman, and the everyday Japanese —
 * small and quiet, because it is a stamp, not a banner.
 */
export function SiteFooter() {
  const stamps = versionStamps();
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
            {link.label}
          </Link>
        ))}
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
