import Link from "@/components/ui/Link";
import type { ReactNode } from "react";

import type { Speaker } from "@/lib/i18n/i18n";
import type { CountKey } from "@/lib/i18n/i18n";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";
import { markup, type MarkupRenderer } from "@/lib/i18n/markup";
import { ASK_FOR_INVITE_PATH } from "@/components/auth/askForInvite.constants";
import { SITE_NAME } from "@/lib/i18n/siteName";
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

/** An address to write to, opened in the reader's own mail program. The address is the link's text, so it can be copied. */
export function MailTo({ address }: { address: string }) {
  return (
    <a href={`mailto:${address}`} className={LINK}>
      {address}
    </a>
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

/**
 * The tags a paragraph's phrase may carry (`markup`): a game, a page of this site, another site, italics, and the
 * mincho face a Japanese word sits in. A phrase says which kind of link it means and nothing about how it is drawn.
 */
const RENDERERS: Record<string, MarkupRenderer> = {
  game: (content, argument) => <Game variant={argument ?? ""}>{content}</Game>,
  in: (content, argument) => <Inside href={argument ?? "/"}>{content}</Inside>,
  out: (content, argument) => <Out href={argument ?? ""}>{content}</Out>,
  ask: (content) => <Inside href={ASK_FOR_INVITE_PATH}>{content}</Inside>,
  em: (content) => <em>{content}</em>,
  jp: (content) => <span className="font-mincho">{content}</span>,
  mono: (content) => <span className="font-mono">{content}</span>,
};

/** One paragraph of the About page: the reader's phrase, its tags drawn as links and italics, its `{names}` filled. */
export function rich(
  say: Speaker,
  key: PhraseKey,
  vars: Readonly<Record<string, string | number>> = {},
  parts: Readonly<Record<string, ReactNode>> = {},
): ReactNode {
  return markup(say.say(key, { ...vars, site: SITE_NAME }), RENDERERS, parts);
}

/** The same, for a paragraph whose wording follows a count (`say.count`): one phrase for one, another for the rest. */
export function richCount(
  say: Speaker,
  key: CountKey,
  count: number,
  vars: Readonly<Record<string, string | number>> = {},
  parts: Readonly<Record<string, ReactNode>> = {},
): ReactNode {
  return markup(say.count(key, count, { ...vars, site: SITE_NAME }), RENDERERS, parts);
}
