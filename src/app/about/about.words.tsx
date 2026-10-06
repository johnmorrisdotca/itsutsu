import { FigureTable } from "@/components/about/FigureTable";
import type { Speaker } from "@/lib/i18n/i18n";
import { boardSizesFor } from "@/lib/gomoku/gomoku.constants";

import { ABOUT_CHAPTERS } from "./about.chapters";
import type { AboutSection } from "./about.constants";
import { Game, Inside, rich } from "./about.links";
import { GLOSSARY_READINGS } from "./about.names.constants";

/**
 * THE JAPANESE WORDS ON THIS SITE, READ ALOUD.
 *
 * Every heading here carries a Japanese name beside the English, and the page
 * never said how to say one or what it means. This is the glossary: the words
 * a reader actually meets on the site, where they meet them, and what they
 * mean at the table. Readings are given in the Hepburn romanisation go books
 * use, with long vowels marked.
 */

const M = ({ children }: { children: string }) => <span className="font-mincho text-base">{children}</span>;

const glossary = (say: Speaker) => (
  <FigureTable
    head={[say.say("about.words.head.word"), say.say("about.words.head.reading"), say.say("about.words.head.meaning"), say.say("about.words.head.where")]}
    rows={[
      [<M key="1">五つ</M>, GLOSSARY_READINGS[0], say.say("about.words.itsutsuMeaning"), say.say("about.words.itsutsuWhere")],
      [<M key="2">五目並べ</M>, GLOSSARY_READINGS[1], say.say("about.words.gomoku"), <Game key="g2" variant="freestyle">{say.say("about.words.gomokuGame")}</Game>],
      [<M key="3">連珠</M>, GLOSSARY_READINGS[2], say.say("about.words.renju"), <Game key="g3" variant="renju">{say.say("about.words.renjuGame")}</Game>],
      [<M key="4">囲碁</M>, GLOSSARY_READINGS[3], say.say("about.words.igo"), <Game key="g4" variant="go">{say.say("about.words.igoGame")}</Game>],
      [<M key="5">碁盤 · 碁石</M>, GLOSSARY_READINGS[4], say.say("about.words.goban"), say.say("about.words.gobanWhere")],
      [<M key="6">星 · 天元</M>, GLOSSARY_READINGS[5], say.say("about.words.hoshi"), say.say("about.words.hoshiWhere")],
      [<M key="7">先手 · 後手</M>, GLOSSARY_READINGS[6], say.say("about.words.sente"), say.say("about.words.senteWhere")],
      [<M key="8">定石</M>, GLOSSARY_READINGS[7], say.say("about.words.joseki"), say.say("about.words.josekiWhere")],
      [<M key="9">劫</M>, GLOSSARY_READINGS[8], say.say("about.words.ko"), say.say("about.words.koWhere")],
      [<M key="10">対局</M>, GLOSSARY_READINGS[9], say.say("about.words.taikyoku"), <Inside key="p10" href="/play">{say.say("about.words.taikyokuWhere")}</Inside>],
      [<M key="11">棋譜</M>, GLOSSARY_READINGS[10], say.say("about.words.kifu"), <Inside key="p11" href="/history">{say.say("about.words.kifuWhere")}</Inside>],
      [<M key="12">名局</M>, GLOSSARY_READINGS[11], say.say("about.words.meikyoku"), <Inside key="p12" href="/famous">{say.say("about.words.meikyokuWhere")}</Inside>],
      [<M key="13">番付</M>, GLOSSARY_READINGS[12], say.say("about.words.banzuke"), say.say("about.words.banzukeWhere")],
      [<M key="14">級 · 段 · 名人</M>, GLOSSARY_READINGS[13], say.say("about.words.kyu"), say.say("about.words.kyuWhere")],
      [<M key="15">間</M>, GLOSSARY_READINGS[14], say.say("about.words.ma"), say.say("about.words.maWhere")],
    ]}
    caption={say.say("about.words.caption")}
  />
);

export const wordsSection = (say: Speaker): AboutSection => ({
  id: "words",
  title: say.say("about.words.title"),
  chapter: ABOUT_CHAPTERS.japan,
  kanji: "用語",
  paragraphs: [
    rich(say, "about.words.a"),
    // The go boards on offer, read from the catalogue: "9×9, 13×13 and 19×19".
    rich(say, "about.words.b", { boards: say.list(boardSizesFor("go").map((size) => `${size}×${size}`)) }),
  ],
  figures: { 0: glossary(say) },
});
