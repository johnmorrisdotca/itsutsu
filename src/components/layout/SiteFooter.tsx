import Link from "next/link";

import { STAGE, versionStamps } from "@/lib/version";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/rules", label: "Rules" },
  { href: "/history", label: "Record" },
  { href: "/players", label: "Players" },
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
      <span className="flex flex-wrap items-baseline gap-x-3 font-mono tabular-nums" title={`Version ${stamps.semver}`}>
        <span className="font-sans font-semibold text-ink-soft">{STAGE}</span>
        <span data-testid="site-version">{stamps.semver}</span>
        <span className="opacity-70">{stamps.roman}</span>
        <span className="font-mincho opacity-70">{stamps.kanji}</span>
      </span>
    </footer>
  );
}
