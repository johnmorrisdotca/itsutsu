import { Paired } from "@/components/i18n/Paired";
import Link from "next/link";

import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { GAME_FAMILIES } from "@/lib/gomoku/families";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { championsPath, gamePath, recordPath, rulesPath } from "@/lib/gomoku/slugs";
import { RULE_VARIANT_DISPLAY } from "@/lib/gomoku/variants.constants";
import { aliasesFor } from "@/lib/legacy/gameAliases";

export const metadata = { title: "Every game" };

const LINK_CLASS = "text-muted underline-offset-2 hover:text-ink hover:underline";

/**
 * Every game on the site, on one page, as plain text: the name, its name in
 * its own script, one line on what it is, what the other sites called it,
 * and the four places it lives. No cards, no pictures, no filter. The
 * simplest view there is, for whoever wants to read the whole list at once.
 */
export default function EveryGamePage() {
  return (
    <Page width="standard" gap="gap-8">
      <SiteHeader />
      <header className="flex flex-col gap-2">
        <h1 className="flex items-baseline gap-2 text-lg font-semibold">
          <Paired en="Every game" kanji="全種目" kanjiClassName="text-sm font-normal opacity-70" />
        </h1>
        <p className="max-w-prose text-sm text-muted">
          {RULE_VARIANT_LIST.length} games in {GAME_FAMILIES.length} families, in the order the{" "}
          <Link href="/games" className="underline underline-offset-4">games page</Link> keeps them. Each
          one has a board, a rules page, a record and a ladder of its own.
        </p>
      </header>
      <div className="flex flex-col gap-8" data-testid="every-game">
        {GAME_FAMILIES.map((family) => (
          <section key={family.title} className="flex flex-col gap-3" data-testid="every-game-family">
            <h2 className="flex items-baseline gap-2 border-b border-rule pb-1 text-base font-semibold">
              <Paired en={family.title} kanji={family.kanji} kanjiClassName="text-sm font-normal opacity-70" />
              <span className="ml-auto text-xs font-normal text-muted">
                {family.games.length} {family.games.length === 1 ? "game" : "games"}
              </span>
            </h2>
            <p className="max-w-prose text-sm text-muted">{family.blurb}</p>
            <dl className="flex flex-col gap-3">
              {family.games.map((variant) => {
                const copy = RULE_VARIANT_DISPLAY[variant];
                const aliases = aliasesFor(variant);
                return (
                  <div key={variant} className="grid gap-x-6 gap-y-1 sm:grid-cols-[14rem_1fr]" data-testid={`every-game-${variant}`}>
                    <dt className="font-medium">
                      <Link href={rulesPath(variant)} className="underline-offset-2 hover:underline">
                        <Paired en={copy.label} kanji={copy.kanji} kanjiClassName="text-xs font-normal opacity-70" />
                      </Link>
                    </dt>
                    <dd className="flex flex-col gap-0.5 text-sm">
                      <span>{copy.tagline}</span>
                      {copy.inspiredBy !== undefined ? (
                        <span className="text-xs text-muted italic">Inspired by {copy.inspiredBy}</span>
                      ) : null}
                      {aliases.length > 0 ? (
                        <span className="text-xs text-muted">Also known as {aliases.join(", ")}</span>
                      ) : null}
                      <span className="flex flex-wrap gap-x-3 text-xs">
                        <Link href={gamePath(variant)} className={LINK_CLASS}>play</Link>
                        <Link href={rulesPath(variant)} className={LINK_CLASS}>rules</Link>
                        <Link href={recordPath(variant)} className={LINK_CLASS}>record</Link>
                        <Link href={championsPath(variant)} className={LINK_CLASS}>champions</Link>
                      </span>
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        ))}
      </div>
    </Page>
  );
}
