"use client";

import Link from "next/link";
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
          <Link
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
          </Link>
        );
      })}
    </nav>
  );
}
