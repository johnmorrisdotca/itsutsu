"use client";

import Link from "next/link";

import { rulesPath } from "@/lib/gomoku/slugs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PANEL_LINK_CLASS } from "@/components/ui/ui.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/** What a game is won by: a line of this many, or turning discs. Derived from its spec. */
export type RulesKind = "3" | "4" | "5" | "6" | "flips";

export const RULES_KINDS: { kind: RulesKind; label: string; kanji: string }[] = [
  { kind: "3", label: "Three in a row", kanji: "三目" },
  { kind: "4", label: "Four in a row", kanji: "四目" },
  { kind: "5", label: "Five in a row", kanji: "五目" },
  { kind: "6", label: "Six in a row", kanji: "六目" },
  { kind: "flips", label: "Flips", kanji: "反転" },
];

export type RulesCard = {
  variant: RuleVariant;
  label: string;
  kanji: string;
  tagline: string;
  inspiredBy?: string;
  kind: RulesKind;
};

/** The letter a name files under: its first letter, accents folded, so Misère sits at M. */
function initial(label: string): string {
  return label.normalize("NFD").replace(/[^A-Za-z]/g, "").charAt(0).toUpperCase();
}

/**
 * Every game, one card each, with two bars to narrow them: A–Z by first
 * letter, and by what wins — three, four, five or six in a row, or flips.
 * Both live in the query — /rules?letter=T&kind=4 — so a narrowed list can be
 * linked; a choice nothing matches is shown but cannot be pressed, which
 * tells the reader the shape of the list before they touch it.
 */
export function RulesIndex({ cards }: { cards: RulesCard[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const chosen = (params.get("letter") ?? "").toUpperCase();
  const kind = params.get("kind") ?? "";
  // Each row narrows within the other's choice, so a letter no game of this kind starts with is out.
  const byKind = kind === "" ? cards : cards.filter((card) => card.kind === kind);
  const byLetter = chosen === "" ? cards : cards.filter((card) => initial(card.label) === chosen);
  const available = new Set(byKind.map((card) => initial(card.label)));
  const kindsAvailable = new Set(byLetter.map((card) => card.kind));
  const shown = byKind.filter((card) => chosen === "" || initial(card.label) === chosen);

  const set = (key: string, value: string, current: string) => {
    const next = new URLSearchParams(params.toString());
    if (value === "" || value === current) next.delete(key);
    else next.set(key, value);
    const search = next.toString();
    router.replace(search === "" ? pathname : `${pathname}?${search}`);
  };
  const choose = (letter: string) => set("letter", letter, chosen);
  const chooseKind = (next: string) => set("kind", next, kind);

  return (
    <div className="flex flex-col gap-4">
      <nav
        className="flex flex-wrap gap-1"
        aria-label="Games by first letter"
        data-testid="letter-filter"
      >
        <LetterButton letter="All" active={chosen === ""} disabled={false} onClick={() => choose("")} />
        {LETTERS.map((letter) => (
          <LetterButton
            key={letter}
            letter={letter}
            active={chosen === letter}
            disabled={!available.has(letter)}
            onClick={() => choose(letter)}
          />
        ))}
      </nav>

      <nav className="flex flex-wrap gap-1" aria-label="Games by what wins" data-testid="kind-filter">
        <LetterButton letter="Any" active={kind === ""} disabled={false} onClick={() => chooseKind("")} />
        {RULES_KINDS.map((option) => (
          <button
            key={option.kind}
            type="button"
            onClick={() => chooseKind(option.kind)}
            disabled={!kindsAvailable.has(option.kind)}
            aria-pressed={kind === option.kind}
            className={`rounded-md border px-2.5 py-1 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-moss disabled:cursor-not-allowed disabled:opacity-30 ${
              kind === option.kind ? "border-ink bg-ink text-paper" : "border-rule bg-ivory/70 hover:border-rule-strong"
            }`}
            data-testid={`kind-${option.kind}`}
          >
            {option.label} <span className="font-mincho opacity-70">{option.kanji}</span>
          </button>
        ))}
      </nav>

      {shown.length === 0 ? (
        <p className="text-sm text-muted">No game matches.</p>
      ) : null}

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="rules-index">
        {shown.map((copy) => (
          <li key={copy.variant}>
            <Link href={rulesPath(copy.variant)} className={`${PANEL_LINK_CLASS} flex h-full flex-col gap-1`}>
              <span className="flex items-baseline gap-2 font-semibold">
                {copy.label}
                <span className="font-mincho text-xs font-normal opacity-70">{copy.kanji}</span>
              </span>
              <span className="text-xs text-muted">{copy.tagline}</span>
              {copy.inspiredBy !== undefined ? (
                <span className="text-[0.7rem] text-muted italic">Inspired by {copy.inspiredBy}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LetterButton({
  letter,
  active,
  disabled,
  onClick,
}: {
  letter: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`min-w-8 rounded-md border px-2 py-1 font-mono text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-moss disabled:cursor-not-allowed disabled:opacity-30 ${
        active ? "border-ink bg-ink text-paper" : "border-rule bg-ivory/70 hover:border-rule-strong"
      }`}
      data-testid={`letter-${letter}`}
    >
      {letter}
    </button>
  );
}
