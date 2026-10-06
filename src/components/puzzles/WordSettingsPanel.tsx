import { Paired } from "@/components/i18n/Paired";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import Link from "@/components/ui/Link";

import { PANEL_CLASS, SECTION_TITLE } from "@/components/ui/ui.constants";
import { GAME_SETTINGS, WORD_LANGUAGE_DISPLAY, WORD_LIST_DISPLAY, settingsOf } from "@/lib/catalogue/gameSettings";
import { historyPath, setUpPath, standingsPath } from "@/lib/gomoku/slugs";
import { dailyWordsPath } from "@/lib/puzzles/dailyWords/dailyAddress";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

/**
 * EVERY LANGUAGE AND WORD LIST OF ONE GAME, on its one front door. The game
 * as it comes (English, everyday words) is the page itself; each other
 * setting is a row here with its set-up, its days' words, its fastest and its
 * record, since each keeps its own (`gameSettings.ts`). Static: the page stays
 * prerendered.
 */
export async function WordSettingsPanel({ game }: { game: PuzzleKind }) {
  const say = await currentSpeaker();
  const settings = settingsOf(game);
  if (settings.length < 2) return null;
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-2 text-sm`} data-testid="word-settings-panel">
      <h2 className={SECTION_TITLE}>
        <Paired en={say.say("pset.words.settingsHeading")} kanji="言語" kanjiClassName="normal-case tracking-normal" inReadersLanguage />
      </h2>
      <p className="text-xs text-muted">{say.say("pset.words.settingsNote")}</p>
      <ul className="flex flex-col gap-1.5">
        {settings.map((kind) => {
          const setting = GAME_SETTINGS[kind]!;
          const language = WORD_LANGUAGE_DISPLAY[setting.language];
          const list = setting.list === "everyday" ? "" : ` · ${say.pairName(WORD_LIST_DISPLAY[setting.list].label, WORD_LIST_DISPLAY[setting.list].kanji).text}`;
          return (
            <li key={kind} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5" data-testid="word-setting-row" data-kind={kind}>
              <Link href={setUpPath(kind)} className="font-semibold underline-offset-2 hover:underline" data-testid="word-setting-play">
                {say.pairName(language.label, language.kanji).text}
                {list}
              </Link>
              <Link href={dailyWordsPath(kind)} className="text-muted underline-offset-2 hover:underline">
                {say.say("pset.words.daily")}
              </Link>
              <Link href={standingsPath(kind)} className="text-muted underline-offset-2 hover:underline">
                {say.say("pset.words.leaderboard")}
              </Link>
              <Link href={historyPath(kind)} className="text-muted underline-offset-2 hover:underline">
                {say.say("pset.rec.allSolves")}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
