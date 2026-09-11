"use client";

import { usePathname, useSearchParams } from "next/navigation";

import type { LanguageOption } from "@/lib/i18n/i18n.types";

/**
 * The languages the site speaks, in the colophon.
 *
 * Links, not a select, for the reason the tab strip gives: a link can be
 * opened, shared and gone back from, and it works before any JavaScript
 * arrives. Each one asks for the language on the page you are already
 * reading; the proxy remembers the answer and sends you back to the same
 * address without it, so nothing ends up carrying `?lang=` around.
 *
 * PLAIN ANCHORS, NOT `next/link`, AND THAT IS THE WHOLE BUG. John, on 0.126.0
 * in production: "BUG: Can't change back to ENG from JP."
 *
 * What happens with a `Link` is this. The click is a client-side navigation;
 * the proxy sees `?lang=`, sets the cookie and redirects to the clean address
 * — and the App Router then answers that address out of its own client cache,
 * which is holding the payload it rendered or prefetched BEFORE the language
 * changed. The cookie is correct, the server would render the new language,
 * and the reader is shown the old one. Every page already in that cache is in
 * the old language too, so the further they click the more stuck they look.
 *
 * It is symmetric in the code and asymmetric in the living. Choosing Japanese
 * appears to half-work, because the reader wanders onto a page that was not
 * cached yet and the site is suddenly Japanese. Choosing English back appears
 * to do nothing at all, because by then the cache is full of Japanese. The
 * language cookie is httpOnly and lasts a year, so the only escape was
 * clearing site data — and the person most trapped by it was John, who does
 * not read Japanese.
 *
 * A language is a property of the whole document, not of one route transition,
 * so a full navigation is the honest thing rather than a workaround: every
 * cached payload is discarded and the next page is rendered by the server in
 * the language just chosen. It costs one page load, on the one action where a
 * reader is expecting the whole site to change.
 *
 * The whole query is carried across, so changing language on a narrowed page
 * does not quietly un-narrow it — a filter dropped by a link is the same
 * fault as a count that leads to the wrong set of games.
 *
 * Each language names itself. "Español", not "Spanish": the one word a
 * reader looking for their own language can pick out is the one written in
 * it.
 */
export function LanguagePicker({
  options,
  current,
  param,
  label,
}: {
  options: readonly LanguageOption[];
  /** The locale the page was rendered in. */
  current: string;
  /** The query parameter a language is asked for with. */
  param: string;
  /** "Language", in the reader's own language. */
  label: string;
}) {
  const pathname = usePathname();
  const params = useSearchParams();

  if (options.length < 2) return null;

  return (
    <nav aria-label={label} className="flex flex-wrap items-baseline gap-x-2" data-testid="language-picker">
      <span className="sr-only">{label}</span>
      {options.map((option) => {
        const here = option.locale === current;
        if (here) {
          return (
            <span
              key={option.locale}
              lang={option.tag}
              aria-current="true"
              data-testid="language-option"
              data-locale={option.locale}
              data-current="true"
              className="font-semibold text-ink-soft"
            >
              {option.endonym}
            </span>
          );
        }
        const next = new URLSearchParams(params);
        next.set(param, option.locale);
        return (
          <a
            key={option.locale}
            href={`${pathname}?${next.toString()}`}
            hrefLang={option.tag}
            lang={option.tag}
            title={option.english}
            data-testid="language-option"
            data-locale={option.locale}
            data-current="false"
            className="underline-offset-4 hover:underline"
          >
            {option.endonym}
          </a>
        );
      })}
    </nav>
  );
}
