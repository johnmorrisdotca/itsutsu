import { FigureTable } from "@/components/about/FigureTable";
import { Screenshot, ScreenshotRow } from "@/components/about/Screenshot";
import { BOARD_THEMES } from "@/components/board/Board.constants";
import { themeName } from "@/components/board/boardNames";
import type { Speaker } from "@/lib/i18n/i18n";
import { MATCH_SIZES } from "@/lib/history/liveMatch";
import { MESSAGE_MAX } from "@/lib/history/reactions.constants";
import { INBOX_KEEP_DAYS } from "@/lib/inbox/inbox.constants";
import { MESSAGE_TEXT_MAX } from "@/lib/messages/messages.constants";
import { MOSAIC_COPY, MOSAIC_MOST_TILES } from "@/lib/record/mosaic.constants";
import { mosaicWords, shapeWords } from "@/lib/record/mosaicWords";

import { ABOUT_CHAPTERS } from "./about.chapters";
import type { AboutSection } from "./about.constants";
import { Inside, rich } from "./about.links";
import { shot } from "./about.shots";

/**
 * PLAYING HERE: what the site does once a game is under way, shown rather
 * than listed.
 *
 * The chapters before this one say what the games are and where they came
 * from; none of them said what it is like to play one here, and the features a
 * member meets every day — the move slider, the picture of every position, the
 * notes that travel with a move — were on no page a newcomer reads. Every
 * screenshot is of a local copy of the site playing real games between the
 * computer players. Every limit printed is read from the constant that
 * enforces it.
 */

const PAIRED = MATCH_SIZES.filter((size) => size > 1);

/** "two, four or six", from the sizes a paired match allows: words for English, numerals for Japanese. */
const spoken = (say: Speaker, sizes: readonly number[]): string => say.list(sizes.map((size) => say.words(size)));

export const boardSection = (say: Speaker): AboutSection => ({
  id: "board",
  title: say.say("about.board.title"),
  chapter: ABOUT_CHAPTERS.play,
  kanji: "盤上",
  paragraphs: [
    rich(say, "about.board.a"),
    rich(say, "about.board.b"),
    rich(say, "about.board.c", { hello: say.say("played.quickHello"), noRush: say.say("played.quickNoRush") }),
    rich(say, "about.board.d", { themes: say.list((Object.keys(BOARD_THEMES) as (keyof typeof BOARD_THEMES)[]).map((theme) => themeName(say, theme).label)) }),
    rich(say, "about.board.e"),
  ],
  figures: {
    0: <ScreenshotRow shots={[shot(say, "boardDesk"), shot(say, "boardPhone")]} caption={rich(say, "about.board.shotA")} />,
    2: <Screenshot {...shot(say, "vsComputer")} caption={rich(say, "about.board.shotB")} />,
    4: <Screenshot {...shot(say, "setUp")} caption={say.say("about.board.shotC")} />,
  },
});

const controls = (say: Speaker) => (
  <FigureTable
    head={[say.say("about.replay.headControl"), say.say("about.replay.headDoes")]}
    rows={[
      [say.say("about.replay.slider"), say.say("about.replay.sliderDoes")],
      [say.say("about.replay.steps"), say.say("about.replay.stepsDoes")],
      [say.say("about.replay.list"), say.say("about.replay.listDoes")],
      [say.say("about.replay.fork"), say.say("about.replay.forkDoes")],
      [mosaicWords(say).openLabel, say.say("about.replay.pictureDoes")],
      [say.say("about.replay.sgf"), say.say("about.replay.sgfDoes")],
      [say.say("about.replay.applause"), say.say("about.replay.applauseDoes")],
    ]}
    caption={say.say("about.replay.controls")}
  />
);

export const replaySection = (say: Speaker): AboutSection => ({
  id: "replay",
  title: say.say("about.replay.title"),
  chapter: ABOUT_CHAPTERS.play,
  kanji: "再生",
  paragraphs: [rich(say, "about.replay.a"), rich(say, "about.replay.b")],
  figures: {
    0: <ScreenshotRow shots={[shot(say, "replayDesk"), shot(say, "replayPhone")]} caption={rich(say, "about.replay.shotA")} />,
    1: controls(say),
  },
});

export const pictureSection = (say: Speaker): AboutSection => {
  const words = mosaicWords(say);
  const landscape = shapeWords(say, "landscape");
  const portrait = shapeWords(say, "portrait");
  // English runs the shape's name into a sentence in lower case; Japanese has no case to change.
  const inSentence = (label: string) => (say.locale === "en" ? label.toLowerCase() : label);
  return {
    id: "picture",
    title: say.say("about.picture.title"),
    chapter: ABOUT_CHAPTERS.play,
    kanji: MOSAIC_COPY.kanji,
    paragraphs: [
      rich(say, "about.picture.a", {
        open: words.openLabel,
        landscape: inSentence(landscape.label),
        landscapeNote: landscape.note,
        portrait: inSentence(portrait.label),
        portraitNote: portrait.note,
        download: words.download,
      }),
      rich(say, "about.picture.b", { most: MOSAIC_MOST_TILES }),
      rich(say, "about.picture.c"),
    ],
    figures: {
      0: <Screenshot {...shot(say, "pictureWindow")} caption={rich(say, "about.picture.shotA")} />,
      1: <ScreenshotRow shots={[shot(say, "wallDesk"), shot(say, "wallPhone")]} caption={rich(say, "about.picture.shotB")} />,
      2: <ScreenshotRow shots={[shot(say, "gamePage"), shot(say, "famous")]} caption={rich(say, "about.picture.shotC")} />,
    },
  };
};

const where = (say: Speaker) => (
  <FigureTable
    head={[say.say("about.people.headWhat"), say.say("about.people.headWhere"), say.say("about.people.headShort")]}
    rows={[
      [say.say("about.people.rematch"), say.say("about.people.rematchWhere"), say.say("about.people.rematchShort")],
      [say.say("about.people.paired"), say.say("about.people.pairedWhere"), say.say("about.people.pairedShort", { sizes: spoken(say, PAIRED) })],
      [say.say("about.people.waiting"), <Inside key="games" href="/games">{say.say("nav.games")}</Inside>, say.say("about.people.waitingShort")],
      [say.say("about.people.note"), say.say("about.people.noteWhere"), say.say("about.people.noteShort", { max: String(MESSAGE_MAX) })],
      [say.say("about.people.messages"), say.say("about.people.messagesWhere"), say.say("about.people.messagesShort", { max: String(MESSAGE_TEXT_MAX) })],
      [say.say("about.people.inbox"), <Inside key="inbox" href="/inbox">{say.say("about.people.inbox")}</Inside>, say.say("about.people.inboxShort", { days: String(INBOX_KEEP_DAYS) })],
      [say.say("about.people.buddies"), <Inside key="me" href="/me">{say.say("about.people.buddiesWhere")}</Inside>, say.say("about.people.buddiesShort")],
      [say.say("about.people.headStart"), say.say("about.people.pairedWhere"), say.say("about.people.headStartShort")],
      [say.say("about.people.words"), say.say("about.people.wordsWhere"), say.say("about.people.wordsShort")],
      [say.say("about.people.link"), say.say("about.people.linkWhere"), say.say("about.people.linkShort")],
      [say.say("about.people.language"), say.say("about.people.languageWhere"), say.say("about.people.languageShort")],
    ]}
    caption={say.say("about.people.where")}
  />
);

export const peopleSection = (say: Speaker): AboutSection => ({
  id: "people",
  title: say.say("about.people.title"),
  chapter: ABOUT_CHAPTERS.play,
  kanji: "相手",
  paragraphs: [rich(say, "about.people.a"), rich(say, "about.people.b")],
  figures: {
    0: where(say),
    1: <ScreenshotRow shots={[shot(say, "computerPlayer"), shot(say, "xpBoard")]} caption={say.say("about.people.shotCaption")} />,
  },
});
