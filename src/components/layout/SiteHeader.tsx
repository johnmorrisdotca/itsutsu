import Link from "next/link";

import { BrandHero, BrandWordmark } from "./BrandMarks";

const NAV = [
  { href: "/lobby", label: "Games" },
  { href: "/", label: "Play" },
  { href: "/history", label: "Record", kanji: "棋譜" },
  { href: "/rules", label: "Rules" },
  { href: "/learn", label: "Learn" },
  { href: "/players", label: "Players" },
] as const;

function Nav() {
  return (
    <nav className="flex items-center gap-4 text-sm">
      {NAV.map((item) => (
        <Link key={item.href} href={item.href} className="hover:underline underline-offset-4">
          {item.label}
          {"kanji" in item ? (
            <>
              {" "}
              <span className="font-mincho text-muted">{item.kanji}</span>
            </>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}

/**
 * The masthead.
 *
 * Two forms of the same thing. The home page carries the full hero — the 五つ
 * avatar beside the wordmark — because that is the page that introduces the
 * site. Every other page carries the compact wordmark, so the mark appears
 * once per page rather than twice stacked. The game being played says its own
 * name where it is played, not up here.
 */
export function SiteHeader({ hero = false }: { hero?: boolean }) {
  if (hero) {
    return (
      <header className="flex flex-col items-center gap-3 border-b border-rule pb-6">
        <Link href="/" aria-label="Itsutsu home" className="block w-full max-w-2xl">
          <BrandHero className="w-full" />
        </Link>
        <p className="text-sm text-muted">Five in a row, and the games that grew from it.</p>
        <Nav />
      </header>
    );
  }

  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-5">
      <Link href="/" aria-label="Itsutsu home" className="block">
        <BrandWordmark className="h-9 w-auto sm:h-10" />
      </Link>
      <Nav />
    </header>
  );
}
