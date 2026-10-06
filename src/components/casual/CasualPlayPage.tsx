import { BoardScaled } from "@/components/board/BoardScaled";
import { BoardMasthead } from "@/components/board/BoardMasthead";
import { GameTrailNav } from "@/components/games/GameTrail";
import { OpenSourceCredit } from "@/components/games/OpenSourceCredit";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CASUAL_SPECS } from "@/lib/casual/casual.constants";
import { casualCopy } from "@/lib/party/partyCopy";
import { SITE_NAME } from "@/lib/i18n/siteName";
import type { CasualKind } from "@/lib/casual/casual.types";
import { gamePath, setUpPath } from "@/lib/gomoku/slugs";

import { CasualPlay } from "./CasualPlay";
import { casualWords } from "@/components/casual/casualWords";
import { currentSpeaker } from "@/lib/i18n/currentLocale";

/** The level a play address asks for (`?level=3`), held to the game's levels; the first when it asks for none or nonsense. */
export function casualLevelAsked(kind: CasualKind, query: Record<string, string | string[] | undefined>): number {
  const raw = Array.isArray(query.level) ? query.level[0] : query.level;
  const level = raw === undefined || !/^\d{1,2}$/.test(raw) ? 1 : Number(raw);
  return level >= 1 && level <= CASUAL_SPECS[kind].levels ? level : 1;
}

/**
 * /games/<slug>/play for a casual game: the board at the level the address asks for.
 *
 * The server reads who is here (for the size they keep the board at) and
 * nothing else; the board and everything it remembers are the browser's
 * (`CasualPlay`).
 */
export async function CasualPlayPage({ kind, level }: { kind: CasualKind; level: number }) {
  const say = await currentSpeaker();
  const CASUAL_COPY = casualWords(say.locale);
  const copy = casualCopy(kind, say.locale);
  const name = say.pairName(copy.label, copy.kanji).text;
  return (
    <Page board="play">
      <SiteHeader />
      {/* Just the board's header (`BoardMasthead`), drawn only in that mode. */}
      <div data-bare-only>
        <BoardMasthead story={{ kind: CASUAL_COPY.card, kanji: copy.kanji, title: name, source: say.say("casual.source", { site: SITE_NAME }) }} />
      </div>
      <GameTrailNav game={{ label: name, href: gamePath(kind), testId: "play-up" }} steps={[{ label: say.say("gamescreen.setUpTitle"), href: setUpPath(kind) }, { label: `${CASUAL_COPY.levelWord(kind === "choiceStory")}${say.locale === "ja" ? "" : " "}${level}` }]} />
      <BoardScaled>
        <CasualPlay key={level} kind={kind} level={level} />
      </BoardScaled>
      <footer data-chrome className="border-t border-rule pt-5">
        <OpenSourceCredit game={kind} />
      </footer>
    </Page>
  );
}
