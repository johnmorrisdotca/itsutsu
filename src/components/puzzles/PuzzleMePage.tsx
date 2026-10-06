import Link from "@/components/ui/Link";

import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS, SECTION_TITLE, TABLE_SCROLL } from "@/components/ui/ui.constants";
import { currentMemberId } from "@/lib/auth/currentSession";
import { gamePath, historyPath, matchPath, mySolvePath, setUpPath, standingsPath } from "@/lib/gomoku/slugs";
import { Paired } from "@/components/i18n/Paired";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { levelNameOf, puzzleCopy, puzzleName } from "@/lib/puzzles/puzzleCopy";
import { PUZZLE_KINDS } from "@/lib/puzzles/puzzles.constants";
import { sizeWordIn } from "@/lib/puzzles/sizeWord";
import { commaOf } from "@/lib/puzzles/puzzleText";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";
import { racesOf, readRace, seatOf } from "@/lib/puzzles/server/puzzleRaces";
import { ownSolvesOf, ownWordsOf } from "@/lib/puzzles/server/puzzleSolves";

import { KumimojiWallpaper } from "./KumimojiWallpaper";
import { SolveTime } from "./SolveTime";
import { ResultMark } from "@/components/game/ResultMark";
import { RESULT_MARKS } from "@/components/game/resultMark.constants";
import { markOfSeat } from "@/components/game/resultMarks";
import { WordHistory } from "./WordHistory";
import { isDodgeGivens } from "@/lib/puzzles/gomoji/dodgeSeed";
import { loadKanaWordsFromModule } from "@/lib/puzzles/gomojiKana/kanaWordsModule";
import { GameTrail } from "@/components/games/GameTrail";

/**
 * /games/<slug>/me for a puzzle: your own solves of it, newest first, and
 * your races at it. Two tables, each shown with its shape when empty and
 * the way in beside it, as every empty table here is. Gomoji's are its words
 * instead, found and not found, with their guesses (`WordHistory`).
 */
export async function PuzzleMePage({ kind }: { kind: PuzzleKind }) {
  const say = await currentSpeaker();
  const copy = puzzleCopy(kind, say.locale);
  const name = puzzleName(kind, say.locale);
  const me = await currentMemberId();
  const words = kind === "gomoji" || kind === "gomojiKana" || kind === "gomojiMot" || kind === "gomojiWort" || kind === "gomojiPop";
  const [solves, races, played] =
    me === null ? [[], [], { words: [], total: 0 }] : await Promise.all([words ? [] : ownSolvesOf(me, kind), racesOf(me, kind), words ? ownWordsOf(me, kind) : { words: [], total: 0 }]);
  // A kana dodger's word is where it stood at the end, replayed from its list (`wordOfPlay`): those lengths are loaded first.
  if (kind === "gomojiKana") await Promise.all([...new Set(played.words.filter((word) => isDodgeGivens(word.givens)).map((word) => word.size))].map((size) => loadKanaWordsFromModule(size)));
  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title={say.say("pset.solve.yourTitle", { name })}
        kanji={say.pairsWithKanji ? copy.kanji : ""}
        crumb={<GameTrail game={{ label: name, href: gamePath(kind) }} steps={[{ label: say.say("pset.solve.yours") }]} />}
        lead={
          me === null
            ? say.say("pset.me.lead.guest")
            : words
              ? say.say("pset.me.lead.words")
              : say.say("pset.me.lead.solves")
        }
      >
        <p className="flex flex-wrap gap-x-3 text-xs">
          <Link href={standingsPath(kind)} className="text-muted underline-offset-2 hover:underline">{say.say("pset.link.fastestHere")}</Link>
          <Link href={historyPath(kind)} className="text-muted underline-offset-2 hover:underline" data-testid="me-everybody">{say.say("pset.link.everybodys")}</Link>
          <Link href={setUpPath(kind)} className="text-muted underline-offset-2 hover:underline">{say.say("pset.link.playOne")}</Link>
        </p>
      </PageTitle>

      {words ? <WordHistory words={played.words} total={played.total} kind={kind} /> : null}

      {words ? null : (
      <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="puzzle-own-solves">
        <h2 className={SECTION_TITLE}>
          <Paired en={say.say("pset.me.yourSolves")} kanji="自分の解" kanjiClassName="normal-case tracking-normal" inReadersLanguage />
        </h2>
        {/* Every crossword you have finished as one picture, fetched on the press and drawn in your browser. */}
        {kind === PUZZLE_KINDS.kumimoji && me !== null ? <KumimojiWallpaper /> : null}
        {solves.length === 0 ? (
          <p className="text-sm text-muted">
            {say.say("pset.me.none")}{say.pairsWithKanji ? " " : ""}
            <Link href={setUpPath(kind)} className="font-semibold text-ink underline-offset-2 hover:underline">
              {say.say("pset.me.playOne")}
            </Link>
          </p>
        ) : (
          <div className={TABLE_SCROLL}>
          <table className="w-full text-sm">
            <thead className="text-[0.62rem] font-semibold tracking-[0.12em] text-muted uppercase">
              <tr>
                <th className="py-1 pr-2 text-left">{say.say("pset.col.puzzle")}</th>
                <th className="py-1 pr-2 text-left">{say.say("pset.col.time")}</th>
                <th className="py-1 text-left">{say.say("pset.col.when")}</th>
              </tr>
            </thead>
            <tbody>
              {solves.map((solve) => (
                <tr key={solve.id} className="border-t border-rule" data-testid="puzzle-own-solve">
                  <td className="py-1 pr-2">
                    <Link href={mySolvePath(kind, solve.id)} className="underline-offset-2 hover:underline" data-testid="puzzle-own-solve-open">
                      {sizeWordIn(solve.size, kind, say)}{commaOf(say)}<span className="text-muted">{levelNameOf(solve.level, say.locale)}</span>
                    </Link>
                    {solve.raceId !== null ? (
                      <Link href={matchPath(kind, solve.raceId)} className="ml-2 text-xs underline-offset-2 hover:underline">
                        {say.say("pset.me.inARace")}
                      </Link>
                    ) : null}
                  </td>
                  <td className="py-1 pr-2">
                    <SolveTime kind={kind} solveId={solve.id} elapsedMs={solve.elapsedMs} mine testId="puzzle-own-solve-time" />
                  </td>
                  <td className="py-1 text-muted">{solve.finishedAt.toISOString().slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </section>
      )}

      <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="puzzle-own-races">
        <h2 className={SECTION_TITLE}>
          <Paired en={say.say("pset.me.yourRaces")} kanji="競解" kanjiClassName="normal-case tracking-normal" inReadersLanguage />
        </h2>
        {races.length === 0 ? (
          <p className="text-sm text-muted">
            {say.say("pset.me.none")}{say.pairsWithKanji ? " " : ""}
            <Link href={setUpPath(kind)} className="font-semibold text-ink underline-offset-2 hover:underline">
              {say.say("pset.me.playAFriend")}
            </Link>
          </p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {races.map((race) => {
              const read = readRace(race);
              const seat = seatOf(race, me);
              const other = seat === "host" ? race.guestName || say.say("pset.me.nobodyYet") : race.hostName;
              const standing = say.say(!read.outcome.over ? "pset.me.notOver" : read.outcome.winner === null ? "pset.me.nobodyWon" : read.outcome.winner === seat ? "pset.me.youWon" : "pset.me.theyWon");
              return (
                <li key={race.id} data-testid="puzzle-own-race">
                  <Link href={matchPath(kind, race.id)} className="underline-offset-2 hover:underline">
                    {say.say("pset.me.against", { size: sizeWordIn(race.size, kind, say), other })}
                  </Link>{" "}
                  <span className="text-muted">
                    — <ResultMark kind={read.outcome.over ? markOfSeat(read.outcome.winner, seat ?? "", true) : RESULT_MARKS.other} className="mr-0.5" /> {standing}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </Page>
  );
}
