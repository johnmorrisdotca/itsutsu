import type { ReactNode } from "react";

import { Paired } from "@/components/i18n/Paired";
import {
  PAGE_TITLE,
  PAGE_TITLE_KANJI,
  SECTION_HEADING,
  SECTION_HEADING_KANJI,
} from "@/components/ui/ui.constants";

/**
 * THE TITLE OF A PAGE, drawn one way on every page.
 *
 * See the note over `PAGE_TITLE` in ui.constants.ts for the rule and the day
 * it was made. This is the one place an h1 is written, so a page cannot size
 * its own: it says what it is called, what kanji goes beside that, and at
 * most one line of lead, and it gets the same title block as every other
 * page. It stands on the paper, under the masthead and above the tabs, never
 * inside a panel — the coverage test refuses a raw <h1> anywhere else and the
 * browser spec measures the result.
 *
 * `title` is a string on almost every page and goes through `Paired`, so a
 * Japanese reader gets the kanji alone. A title that is a link or a pair of
 * names — the game on the doorstep, the two players of a filed match — is a
 * node, and the kanji is drawn after it the same way.
 */
export function PageTitle({
  title,
  kanji = "",
  lead,
  crumb,
  aside,
  children,
  testId,
}: {
  /** The page's name, or the node that is its name. */
  title: ReactNode;
  /** The kanji beside the name. Empty means there is none. */
  kanji?: string;
  /** One line under the title saying what the page is for. */
  lead?: ReactNode;
  /** The trail above the title: "Gomoku / Rules". */
  crumb?: ReactNode;
  /** Links or a control drawn at the title's right, on its baseline. */
  aside?: ReactNode;
  /** Anything else the title block carries — a tagline, a note. */
  children?: ReactNode;
  /** On the h1 itself, for a spec that reads the title and nothing around it. */
  testId?: string;
}) {
  return (
    <header className="flex flex-col gap-1" data-testid="page-title">
      {crumb !== undefined ? <p className="text-xs text-muted">{crumb}</p> : null}
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className={PAGE_TITLE} data-testid={testId}>
          {typeof title === "string" ? (
            <Paired en={title} kanji={kanji} kanjiClassName={PAGE_TITLE_KANJI} />
          ) : (
            <>
              {title}
              {kanji !== "" ? <span className={PAGE_TITLE_KANJI}>{kanji}</span> : null}
            </>
          )}
        </h1>
        {aside}
      </div>
      {lead !== undefined ? <p className="text-sm text-muted">{lead}</p> : null}
      {children}
    </header>
  );
}

/**
 * A SECTION OF A PAGE, headed at the one size a section is.
 *
 * The h2 under the page title — a chapter, a group, a list's name — at
 * SECTION_HEADING, with its kanji at SECTION_HEADING_KANJI. A panel's own
 * label from inside it is the other kind of h2, SECTION_TITLE, and is written
 * with that constant where the panel is drawn.
 */
export function SectionHeading({
  title,
  kanji = "",
  className = "",
  children,
}: {
  title: ReactNode;
  kanji?: string;
  /** Layout added to the heading — `justify-between` for one with a control on its right. */
  className?: string;
  /** Drawn inside the h2 after the name: a count, a control. */
  children?: ReactNode;
}) {
  return (
    <h2 className={className === "" ? SECTION_HEADING : `${SECTION_HEADING} ${className}`}>
      {typeof title === "string" ? (
        <Paired en={title} kanji={kanji} kanjiClassName={SECTION_HEADING_KANJI} />
      ) : (
        <>
          {title}
          {kanji !== "" ? <span className={SECTION_HEADING_KANJI}>{kanji}</span> : null}
        </>
      )}
      {children}
    </h2>
  );
}
