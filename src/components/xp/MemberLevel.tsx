"use client";

import Link from "next/link";

import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { Paired } from "@/components/i18n/Paired";
import { countText } from "@/lib/rating/figures";
import { levelPath, xpLevelKanji, xpLevelName } from "@/lib/xp/levelNames";
import { levelShown } from "@/lib/xp/levelShown";
import { xpStanding } from "@/lib/xp/xpCurve";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { importedNoteText } from "@/lib/xp/importedNote";

import { ImportedXpNote } from "./ImportedXpNote";
import { LevelName } from "./LevelName";
import { XP_KANJI } from "./xp.constants";

import type { MemberLevelProps } from "./xp.types";

/**
 * SOMEBODY'S STANDING, WHERE A STRANGER MEETS THEM — AND PROMINENT.
 *
 * The level and the total together, for a page ABOUT a person rather than a
 * list of them. It was a small badge on the line that names the person, and
 * John, looking at that page, asked for more: *"View Person should always show
 * this prominent info as well... looks like we should be displaying a better
 * header with the Name of the person, Stats/Record and XP + XP level Name."*
 * So it is a block of its own now, under the record and beside nothing: the
 * level number AND its name, the total, and how far the next rung is, with the
 * bar the reader's own XP tab already draws for the same fact.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHERE EACH FIGURE LEADS, BECAUSE NOTHING IS A DEAD END
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The LEVEL leads to that level's own page through `LevelName` — the one
 * component allowed to put a level on screen, `recordLevel.coverage.test.ts`
 * says why. The TOTAL leads to `/xp`, the board that ranks everybody by it,
 * for the reason `XpCell` gives in `recordTrailing.tsx`: one destination for
 * the same number on every surface. The NEXT RUNG leads to its page, so a
 * reader who wants to know what "Portal" is can find out. Three figures, three
 * destinations, each the page that is about that figure.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THREE ANSWERS, AND ONLY ONE OF THEM IS SILENT NOW
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `xp` is OPTIONAL, and the absence is not the same fact as a nought:
 *
 *  - **`undefined` — nobody asked.** `findMembersByNames` selects a narrow set
 *    of columns and XP is not among them, so a row from it does not know. A
 *    page handed one must not print a standing, and must not print nought
 *    either: that would be a claim about somebody made out of a missing read.
 *  - **`0` — asked, and there is nothing earned.** `levelShown` answers **1**,
 *    and this draws "Lv 1 · Insert Coin", a total of 0 and the fifty to go.
 *    John settled it — "Everyone is level 1 if 0xp." — and he is right: level
 *    1 is named Insert Coin because it is where a person starts, so hiding it
 *    tells somebody who has just arrived that the ladder does not include them.
 *  - **Anything else — a standing, shown.**
 *
 * That reversal is exactly why the TYPE still has to keep `undefined` apart from
 * `0`: `?? 0` at the call site would print "Level 1" for a person whose XP was
 * never read — a claim invented out of a narrow `select`. `levelShown` is asked
 * here rather than the raw curve so the rung and the total cannot disagree.
 *
 * A program's page draws this block like anyone's. It used to draw none, on a
 * reading of "Everyone is level 1 if 0xp." as "everyone who is a person"; John
 * has since said the opposite — "i still don't see Levels for all equally and
 * bots don't have XP" — and a program earns from its games and stands where
 * its total puts it.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * A CLIENT COMPONENT, FOR TWO REASONS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The words are the reader's — "Level", "{count} to {name}" — and the speaker
 * is a hook. And a browser test has to know when this block is READY to be
 * read: the page it sits on is server-rendered and has no marker of its own,
 * so this carries `readyMark`, and a spec waits on it before asserting either
 * a figure here or, for a program, that there is no block beside the figures.
 */
export function MemberLevel({ xp, imported = null, testId = "member-level" }: MemberLevelProps) {
  const say = useSpeaker();
  const hydrated = useHydrated();
  if (xp === undefined) return null;
  const level = levelShown({ xp });
  if (level === null) return null;

  const standing = xpStanding(xp);
  const atTheTop = standing.span === 0;
  const next = level + 1;
  const kanji = xpLevelKanji(level);
  const label = "text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase";
  const xpHeading = say.pair("xp.unit", XP_KANJI);

  return (
    <dl
      className="flex flex-wrap items-end gap-x-8 gap-y-3 rounded-lg border border-rule bg-moss-soft px-4 py-3"
      data-testid={testId}
      data-level={level}
      {...readyMark(hydrated)}
    >
      <div className="flex flex-col gap-1">
        <dt className={label}>{say.say("xp.level")}</dt>
        <dd className="flex items-baseline gap-2">
          {/*
            The full badge — the number AND the name — because this is a heading
            with room in it, not a table cell competing with nine figures. The
            compact form exists for the lists; here the name is the half worth
            reading, and its kanji, where a level has one, is read beside it
            rather than left on hover.
          */}
          <LevelName level={level} size="lg" className="font-semibold" testId={`${testId}-name`} />
          {kanji === "" ? null : (
            <span className="font-mincho text-sm text-muted" data-testid={`${testId}-kanji`}>
              {kanji}
            </span>
          )}
        </dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className={label}>
          <Paired en={xpHeading.text} kanji={xpHeading.kanji ?? ""} kanjiClassName="font-mincho tracking-normal" />
        </dt>
        <dd>
          <Link
            href="/xp"
            className="font-mono text-lg tabular-nums underline-offset-4 hover:underline"
            title={say.say("xp.board")}
            data-testid={`${testId}-total`}
          >
            {/* Written the way every count on the site is written — see `countText`. */}
            {countText(xp)}
          </Link>
          {/* John's "justification that they have put in their time or mileage on other sites". */}
          {imported === null ? null : <ImportedXpNote note={importedNoteText(say, imported)} testId={`${testId}-imported`} />}
        </dd>
      </div>
      <div className="flex min-w-40 grow flex-col gap-1.5">
        <dd className="text-xs text-muted" data-testid={`${testId}-next`}>
          {atTheTop ? (
            say.say("xp.atTheTop")
          ) : (
            /*
              The whole sentence is the link, because the sentence is about the
              rung ahead and the reader's language may put its name first or
              last — a link on the name alone would have to know where in the
              sentence the name fell. `levelPath` is the one definition of where
              a rung lives, so it cannot drift from the badge above it.
            */
            <Link
              href={levelPath(next)}
              className="underline-offset-4 hover:underline"
              data-testid={`${testId}-next-level`}
            >
              {say.say("xp.toNext", {
                count: countText(standing.toNext),
                name: `Lv ${next} · ${xpLevelName(next)}`,
              })}
            </Link>
          )}
        </dd>
        {/*
          The bar is `aria-hidden`: it says the same thing as the line above it,
          which is already words, and a progress bar announced as "63%" after
          "215 to ColecoVision" is the same fact twice in a worse unit.
        */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-shade" aria-hidden>
          <div className="h-full rounded-full bg-moss" style={{ width: `${Math.round(standing.ratio * 100)}%` }} />
        </div>
      </div>
    </dl>
  );
}
