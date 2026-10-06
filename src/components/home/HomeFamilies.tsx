import Link from "@/components/ui/Link";

import { FamilyMark } from "@/components/games/FamilyMark";
import { CardArrow } from "@/components/ui/CardArrow";
import { PANEL_CLASS, SECTION_HEADING, STRETCHED_CARD } from "@/components/ui/ui.constants";
import { GAME_FAMILIES, familyPagePath } from "@/lib/gomoku/families";
import { familyCountWords } from "@/lib/gomoku/familyWords";
import { familyBlurb } from "@/lib/gomoku/familyCopy";
import { Paired } from "@/components/i18n/Paired";
import { currentSpeaker } from "@/lib/i18n/currentLocale";

/**
 * THE FAMILIES, ON THE FRONT PAGE, SO A VISITOR SEES THE SHAPE OF THE
 * CATALOGUE BEFORE CHOOSING TO OPEN IT.
 *
 * The front page said "five in a row" and a number, and the other seven
 * families — drops, Othello and its cousins, checkers, go and hex, the races,
 * the strange boards, the small ones — were a click away and unnamed. A
 * reader who came for checkers had no way of knowing it was here.
 *
 * Read from `GAME_FAMILIES`, the list /games draws, so a family added there is
 * on this page the same day. Each card is the way into that family's page,
 * which is open to anyone and shows exactly the games the card counted.
 */
export async function HomeFamilies() {
  const say = await currentSpeaker();
  const title = say.pair("home.families.title", "種目", { count: say.number(GAME_FAMILIES.length) });
  return (
    <section className="flex flex-col gap-4" data-testid="front-families">
      <div className="flex flex-col gap-1">
        <h2 className={SECTION_HEADING}>
          {title.text}
          {title.kanji === null ? null : <span className="whitespace-nowrap font-mincho text-xs font-normal opacity-70">{title.kanji}</span>}
        </h2>
        <p className="text-sm text-muted">
          {say.say("home.families.lead")}
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {GAME_FAMILIES.map((family) => (
          <li key={family.key}>
            <Link
              href={familyPagePath(family)}
              data-card-link=""
              data-testid="front-family"
              className={`${PANEL_CLASS} ${STRETCHED_CARD} flex h-full items-center justify-between gap-3`}
            >
              <span className="flex min-w-0 items-start gap-3">
                <FamilyMark family={family.title} size="regular" />
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="flex flex-wrap items-baseline gap-x-2 font-semibold">
                    <Paired en={family.title} kanji={family.kanji} className="whitespace-nowrap" kanjiClassName="whitespace-nowrap text-xs font-normal opacity-70" />
                    <span className="text-xs font-normal text-muted">{familyCountWords(family, say)}</span>
                  </span>
                  <span className="text-xs text-muted">{familyBlurb(family, say.locale)}</span>
                </span>
              </span>
              <CardArrow />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
