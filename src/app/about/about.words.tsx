import { FigureTable } from "@/components/about/FigureTable";
import { boardSizesFor } from "@/lib/gomoku/gomoku.constants";

import { ABOUT_CHAPTERS } from "./about.chapters";
import type { AboutSection } from "./about.constants";
import { Game, Inside } from "./about.links";

/**
 * THE JAPANESE WORDS ON THIS SITE, READ ALOUD.
 *
 * Every heading here carries a Japanese name beside the English, and the page
 * never said how to say one or what it means. This is the glossary: the words
 * a reader actually meets on the site, where they meet them, and what they
 * mean at the table. Readings are given in the Hepburn romanisation go books
 * use, with long vowels marked.
 */

/** The go boards on offer, read from the catalogue: "9×9, 13×13 and 19×19". */
const GO_BOARDS = boardSizesFor("go")
  .map((size) => `${size}×${size}`)
  .join(", ")
  .replace(/, ([^,]+)$/, " and $1");

const M = ({ children }: { children: string }) => <span className="font-mincho text-base">{children}</span>;

const GLOSSARY = (
  <FigureTable
    head={["Word", "Reading", "Meaning", "Where you meet it"]}
    rows={[
      [<M key="1">五つ</M>, "itsutsu", "five (things)", "the name of the site: five stones in a row"],
      [<M key="2">五目並べ</M>, "gomoku narabe", "five pieces lined up", <Game key="g2" variant="freestyle">Gomoku</Game>],
      [<M key="3">連珠</M>, "renju", "a string of pearls", <Game key="g3" variant="renju">Renju</Game>],
      [<M key="4">囲碁</M>, "igo", "the surrounding game", <Game key="g4" variant="go">Go</Game>],
      [<M key="5">碁盤 · 碁石</M>, "goban · goishi", "a go board · go stones", "the board and stones every game is drawn with"],
      [<M key="6">星 · 天元</M>, "hoshi · tengen", "star points · the centre point", "the dots on the board, and the one obstacle layout that spares the centre"],
      [<M key="7">先手 · 後手</M>, "sente · gote", "moving first · moving second", "who opens, and why komi and swaps exist"],
      [<M key="8">定石</M>, "jōseki", "a settled sequence", "the famous openings"],
      [<M key="9">劫</M>, "kō", "an eternity; the ko rule", "Go’s rule against retaking at once"],
      [<M key="10">対局</M>, "taikyoku", "a game between two players", <Inside key="p10" href="/play">My games</Inside>],
      [<M key="11">棋譜</M>, "kifu", "a written game record", <Inside key="p11" href="/history">the record</Inside>],
      [<M key="12">名局</M>, "meikyoku", "a celebrated game", <Inside key="p12" href="/famous">famous games</Inside>],
      [<M key="13">番付</M>, "banzuke", "a ranking list, from sumo", "the ladder"],
      [<M key="14">級 · 段 · 名人</M>, "kyū · dan · meijin", "student grade · master grade · master", "the bots, gentlest to strongest"],
      [<M key="15">間</M>, "ma", "the space between things", "how these pages are laid out"],
    ]}
    caption={
      <>
        The Japanese words this site uses, with their readings. Kyū grades count down toward one as a player
        improves, and dan grades count up from one after that, in go, shogi and the martial arts alike.
      </>
    }
  />
);

export const WORDS_SECTION: AboutSection = {
  title: "The words on the labels",
  chapter: ABOUT_CHAPTERS.japan,
  kanji: "用語",
  paragraphs: [
    <>
      Most of the Japanese on these pages comes from go, because go is where the vocabulary of a board and stones
      was settled. A game record is a <em>kifu</em> whatever game it records; the list that ranks players is a{" "}
      <em>banzuke</em>, a word borrowed from the sumo tournament sheet; a grade is a <em>kyū</em> or a{" "}
      <em>dan</em>, and at the top of the old go houses sat the <em>meijin</em>. The table is every one of them a
      reader meets here, and where.
    </>,
    <>
      If some of these sound familiar from anime, that is not an accident either. <em>Hikaru no Go</em>, written by
      Yumi Hotta and drawn by Takeshi Obata, ran in Weekly Shōnen Jump from 1998 to 2003 and was made into an anime
      that followed it: a schoolboy haunted by the ghost of a Heian-era go master, who learns the game from the
      ghost and slowly becomes a player in his own right. It is widely credited with sending a generation of Japanese children to go
      clubs, and it is how many readers outside Japan first heard the words <em>sente</em>, <em>jōseki</em> and{" "}
      <em>meijin</em>. The game the ghost plays is <Game variant="go">on the board here</Game>, on{" "}
      {GO_BOARDS}.
    </>,
  ],
  figures: { 0: GLOSSARY },
};
