import Link from "next/link";
import type { ReactNode } from "react";

import { gamePath } from "@/lib/gomoku/slugs";

/**
 * The three kinds of link the About page uses.
 *
 * They were written out by hand in both halves of the page, with the same
 * class string copied a dozen times and `Out` defined twice, so a change to
 * how a link looks had to be made in two files and every occurrence found by
 * eye. One module holds them now: prose says which kind of link it means and
 * nothing about how it is drawn.
 */
const LINK = "font-medium text-ink underline underline-offset-4";

/**
 * A game’s name, linking to that game’s own page.
 *
 * The standing rule is that a game’s name is a link wherever it is written,
 * so a reader who meets Pente or Connect6 in a sentence can go and play it.
 * Used for games this site actually offers — a name in someone else’s
 * catalogue is their shelf, not ours, and is left as plain words.
 */
export function Game({ variant, children }: { variant: string; children: ReactNode }) {
  return (
    <Link href={gamePath(variant)} className={LINK}>
      {children}
    </Link>
  );
}

/** Somewhere else on this site. */
export function Inside({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={LINK}>
      {children}
    </Link>
  );
}

/** An outside site, opened in its own tab. */
export function Out({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={LINK}>
      {children}
    </a>
  );
}
