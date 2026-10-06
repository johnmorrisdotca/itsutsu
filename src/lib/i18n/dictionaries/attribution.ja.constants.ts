import { AGENT_READ_2026_10_06, type CopyReview, type JaLine } from "../copyJa.types";
import type { PuzzleKind } from "../../puzzles/puzzles.types";

/**
 * Whose names these games are, in Japanese: the three paragraphs of
 * `RULES_ATTRIBUTION` (`openings.constants.ts`), which sit under the games on
 * /games. A trademark notice, so the reviewer asks for a person who reads
 * Japanese to read it too (`ask`).
 *
 * The last paragraph names the puzzles, which the English builds from each
 * puzzle's label. Here a puzzle is named the way a Japanese reader meets it, by
 * its `kanji`, and the back-translation by its English label; both come from
 * `names`, so a rename of a puzzle is still one edit in its own table.
 */
export type PuzzleNames = (kind: PuzzleKind) => { ja: string; en: string };

export type AttributionJa = {
  paragraphs: readonly JaLine[];
  review?: CopyReview;
  ask?: string;
};

export function rulesAttributionJa(names: PuzzleNames): AttributionJa {
  const ja = (kind: PuzzleKind) => names(kind).ja;
  const en = (kind: PuzzleKind) => names(kind).en;
  return {
    paragraphs: [
      [
        "ここにあるゲームのいくつかは、別の名前で知られているゲームを、その規則から作り直した、このサイト独自の名前の版です。落とし四目は、Connect Fourの名前で売られている、石が落ちるゲームの版です。回し五目と回し四目は、Pentagoの名前で売られている、区画を回すゲームの版です。二抜き連珠は、Penteの名前で売られている取りのあるゲームの日本の祖先で、三抜き連珠は、Keryo-Penteの名前で売られている、2つ組と3つ組を取る規則の版です。作り手と壊し手は、Order and Chaosの名前で出版されたゲームの版です。",
        "Some of the games here are versions, with names of this site's own, of games known by other names, rebuilt from their rules. 落とし四目 (Drop Four) is a version of the falling-stone game sold as Connect Four. 回し五目 (Twist Five) and 回し四目 (Twist Four) are versions of the section-turning game sold as Pentago. 二抜き連珠 (Ninuki-renju) is the Japanese ancestor of the capture game sold as Pente, and 三抜き連珠 (Sannuki-renju) is a version of the rule of capturing pairs and triples sold as Keryo-Pente. 作り手と壊し手 (Maker and Breaker) is a version of the game published as Order and Chaos.",
      ],
      [
        "Connect FourはHasbroの、PentagoはMindtwisterの、PenteとKeryo-PenteはWinning Movesの商標です。いずれもこのサイトとは関係がなく、これらの名前は、ゲームが何に似ているかを説明するためだけに載せています。連珠、オモク、Caro、Connect6、Squava、Teeko、Notakto、Wild tic-tac-toe（自由三目）は、昔からあるか、すでに出版されているゲームで、その規則は自分たちの言葉で説明しています。罠三と四角四目は、最初の2つ（SquavaとTeeko）につけた、このサイト独自の名前です。",
        "Connect Four is a trademark of Hasbro, Pentago of Mindtwister, and Pente and Keryo-Pente of Winning Moves. None of them has any connection with this site, and the names appear here only to say what a game resembles. Renju, Omok, Caro, Connect6, Squava, Teeko, Notakto and Wild tic-tac-toe (自由三目) are traditional or already published games whose rules are described in this site's own words. 罠三 (Trap Three) and 四角四目 (Square Four) are this site's own names for the first two (Squava and Teeko).",
      ],
      [
        `パズルもこのサイト独自のもので、規則から自前のコードで作っていますが、多くはすでによく知られた名前で呼ばれています。${ja("numberPlace")}、${ja("jigsaw")}、${ja("diagonal")}、${ja("sumCages")}は、Howard GarnsがNumber Placeとして最初に印刷したパズルと、そのもっとも一般的な変種です。数独はニコリの日本での商標なので、日本語では日本の出版社と同じようにナンプレと呼びます。${ja("moreOrLess")}は、ニコリが出版したTamaki Seimiyaのパズルで、${ja("towers")}は同名の盤面パズルです。${ja("hiddenStones")}は、Star Battleの1つ星の形のこのサイト版で、Queensの名前で毎日遊ばれてもいますが、この名前はLinkedInのものです。${ja("blackAndWhite")}は、TakuzuやBinairoの名前で売られている二値パズルのこのサイト版で、これらの名前はEUで商標になっています。LinkedInはこれを独自の形でTangoとして遊ばせていますが、この名前もLinkedInのものです。${ja("gomoji")}は、The New York Times Companyの商標であるWordleの名前で出版された、言葉当てゲームのこのサイト版です。言葉はSCOWL（Kevin Atkinson）をもとに作った、このサイト独自のリストです。${ja("bridges")}は、ニコリが1990年に初めて印刷した島と橋のパズルのこのサイト版で、ニコリが出版している名前ではなく、このサイト独自の名前をつけています。${ja("pictureLogic")}は、英語ではnonogramとして知られる、盤面で絵を作るパズルのこのサイト版で、Non IshidaとTetsuya Nishioが、それぞれ1987年に日本で考案しました。多くの名前で売られ、その一部は商標ですが、ここではそのどれも使っていません。${ja("mahjong")}は、Brodie Lockardが1981年にMah-Jonggとして最初に作った、牌を合わせて取り除く一人遊びで、その後、持ち主のものである多くの名前で売られてきました。このサイト版は、独自の配置と、このサイトのために描いた牌で遊びます。${ja("shikaku")}、${ja("akari")}、${ja("loop")}、${ja("hitori")}、${ja("crossSums")}、${ja("regions")}は、ニコリが日本で出版しているペンシルパズルで、${ja("loop")}、${ja("crossSums")}、${ja("regions")}は別の名前で出版されています。${ja("crossSums")}は、1966年にDell MagazinesのJacob E. Funkが考案しました。盤面は、このサイト独自のオープンソースのパッケージKazuが作り、出版された盤面は一切再現していません。${ja("jirai")}は、Microsoftの名前であるMinesweeperで売られている地雷探しゲームのこのサイト版で、盤面はこのサイト独自のオープンソースのパッケージJiraiが配ります。これらの名前は、パズルが何かを説明するためだけに載せていて、一部はニコリの商標かもしれません。これらの権利者は、いずれもこのサイトとは関係がありません。`,
        `The puzzles are this site's own too, made by its own code from their rules, though most go by names that are already well known. ${en("numberPlace")}, ${en("jigsaw")}, ${en("diagonal")} and ${en("sumCages")} are the puzzle Howard Garns first printed as Number Place and its most common variants. Sudoku (数独) is a trademark of Nikoli in Japan, so in Japanese they are called ナンプレ, as Japanese publishers do. ${en("moreOrLess")} is Tamaki Seimiya's puzzle, which Nikoli published, and ${en("towers")} is the grid puzzle of that name. ${en("hiddenStones")} is this site's version of the one-star form of Star Battle, which is also played daily as Queens, a name that belongs to LinkedIn. ${en("blackAndWhite")} is this site's version of the binary puzzle sold as Takuzu and Binairo, names that are trademarks in the EU, which LinkedIn plays in a form of its own as Tango, a name that also belongs to LinkedIn. ${en("gomoji")} is this site's version of the word-guessing game published as Wordle, a trademark of The New York Times Company, and its words are this site's own list, made from SCOWL (Kevin Atkinson). ${en("bridges")} is this site's version of the island-and-bridge puzzle that Nikoli first printed in 1990, under a name of this site's own rather than the one Nikoli publishes it under. ${en("pictureLogic")} is this site's version of the grid puzzle that makes a picture, known in English as the nonogram, which Non Ishida and Tetsuya Nishio each devised in Japan in 1987. It is sold under many names, some of them trademarks, and none of them is used here. ${en("mahjong")} is the solitaire game of matching and removing tiles that Brodie Lockard first made as Mah-Jongg in 1981, and which has since been sold under many names that belong to their owners. This site's version is played on its own layouts, with tiles drawn for this site. ${en("shikaku")}, ${en("akari")}, ${en("loop")}, ${en("hitori")}, ${en("crossSums")} and ${en("regions")} are pencil puzzles that Nikoli publishes in Japan, and ${en("loop")}, ${en("crossSums")} and ${en("regions")} are published under other names. ${en("crossSums")} was devised in 1966 by Jacob E. Funk of Dell Magazines. Their boards are made by Kazu, this site's own open-source package, and reproduce no published grid. ${en("jirai")} is this site's version of the mine-finding game sold as Minesweeper, a name that belongs to Microsoft, and its boards are dealt by Jirai, this site's own open-source package. These names appear here only to say what a puzzle is, and some may be trademarks of Nikoli. None of these owners has any connection with this site.`,
      ],
    ],
    review: AGENT_READ_2026_10_06,
    ask: "Trademark notice. A person who reads Japanese should read it, and the Nikoli, LinkedIn and Wordle wording in particular, before it is relied on.",
  };
}
