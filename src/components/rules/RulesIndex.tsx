"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PANEL_LINK_CLASS } from "@/components/ui/ui.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export type RulesCard = {
  variant: RuleVariant;
  label: string;
  kanji: string;
  tagline: string;
  inspiredBy?: string;
};

/** The letter a name files under: its first letter, accents folded, so Misère sits at M. */
function initial(label: string): string {
  return label.normalize("NFD").replace(/[^A-Za-z]/g, "").charAt(0).toUpperCase();
}

/**
 * Every game, one card each, with an A–Z bar to narrow them by first letter.
 * The letter lives in the query — /rules?letter=T — so a narrowed list can be
 * linked; a letter no game starts with is shown but cannot be pressed, which
 * tells the reader the shape of the list before they touch it.
 */
export function RulesIndex({ cards }: { cards: RulesCard[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const chosen = (params.get("letter") ?? "").toUpperCase();
  const available = new Set(cards.map((card) => initial(card.label)));
  const shown = chosen === "" ? cards : cards.filter((card) => initial(card.label) === chosen);

  const choose = (letter: string) => {
    const next = new URLSearchParams(params.toString());
    if (letter === "" || letter === chosen) next.delete("letter");
    else next.set("letter", letter);
    const search = next.toString();
    router.replace(search === "" ? pathname : `${pathname}?${search}`);
  };

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

      {shown.length === 0 ? (
        <p className="text-sm text-muted">No game starts with {chosen}.</p>
      ) : null}

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="rules-index">
        {shown.map((copy) => (
          <li key={copy.variant}>
            <Link href={`/rules/${copy.variant}`} className={`${PANEL_LINK_CLASS} flex h-full flex-col gap-1`}>
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
