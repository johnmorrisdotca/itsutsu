import type { Review } from "@/lib/i18n/dictionaries/ja.drafted.constants";

/**
 * The hundred level names, in Japanese.
 *
 * The sibling of `levelNames.constants.ts`: that file is the English row for
 * each level (name, kanji, note), this is the Japanese one. A level is the same
 * level in both, `levelNames.test.ts` holds the two to one hundred rows in the
 * same order, and a name here is the name a Japanese reader would use for the
 * thing the English names: the game's own Japanese title where it has one
 * (ファミコン, not "NES"; PCエンジン, not "TurboGrafx-16"; メガドライブ, not
 * "Sega Genesis"), the established term where it is a word of play (定石, 詰み,
 * ツークツワンク). **Where the English row has a kanji, that kanji is the name
 * here**, exactly: it is the word already shown beside the English heading, and
 * `levelNames.test.ts` fails if the two ever differ.
 *
 * It is a set, not a list. The ladder climbs from the arcade at the bottom to
 * the pantheon at the top in English, and this has to climb the same way in
 * Japanese: the names were drafted together and judged together, so a title
 * that is a place on the ladder for an English reader is the same place for a
 * Japanese one. The notes follow the English facts, with the one change where a
 * fact was true of one country only (a console's release year and name in Japan
 * where it is the Japanese machine being named).
 *
 * `back` is what the Japanese literally says, the name and then the note, in
 * English, so John can see what would ship. These have been read by the
 * reviewer agent, not by a person who reads Japanese.
 *
 * Allowed past the English gate only because there is no English in it: the
 * `back` strings are English, which is why this file is in `ALLOWED_FILES` in
 * `scripts/check-i18n-strings.mjs` with the English half.
 */
export type LevelNameJa = {
  /** 1 to 100: the same level as the English row at this place. */
  level: number;
  name: string;
  note: string;
  /** The Japanese read back as English: the name, then the note. */
  back: string;
  /** Who read this row's Japanese, as on every drafted phrase (`ja.drafted.constants.ts`). A row nobody has read does not compile. */
  review: Review;
};

/** The reviewer agent's pass over the hundred rows (ENJA-09), 2026-10-06, to the standard in `japanese-reviewer.md`. */
const READ: Review = { by: "agent", on: "2026-10-06" };

export const LEVEL_NAMES_JA: readonly LevelNameJa[] = [
  // 1-10: the arcade, where everybody started.
  { level: 1, name: "インサートコイン", note: "ゲームセンターのプレイは、いつもこの一言から始まりました。100円玉を1枚ずつ入れて。", back: "Insert Coin. Every arcade play began with these words, one 100-yen coin at a time.", review: READ },
  { level: 2, name: "スタートボタン", note: "どんなゲームも最初に出す指示であり、最初に従う指示です。", back: "Start Button. The first instruction any game gives, and the first one you follow.", review: READ },
  { level: 3, name: "ポン", note: "アタリ、1972年。パドル2つとボール1つから、その後のゲーム産業のすべてが始まりました。", back: "Pong. Atari, 1972: from two paddles and one ball the whole game industry after it began.", review: READ },
  { level: 4, name: "ジョイスティック", note: "8方向と、てっぺんの赤いボール。ある世代にとってのゲームの握り方でした。", back: "Joystick. Eight directions and a red ball on top: how one generation held a game.", review: READ },
  { level: 5, name: "スペースインベーダー", note: "タイトー、1978年。ハイスコアを残せた最初のゲームであり、国じゅうを行列に並ばせた最初のゲームです。", back: "Space Invaders. Taito, 1978: the first game that could keep a high score, and the first to make a whole country queue.", review: READ },
  { level: 6, name: "アタリ2600", note: "1977年の木目調の箱が、ゲームセンターを居間に持ち込みました。", back: "Atari 2600. The wood-grain box of 1977 brought the arcade into the living room.", review: READ },
  { level: 7, name: "パックマン", note: "ナムコ、1980年。黄色い円と4匹のゴースト、そしてゲーム界でいちばん知られた顔。", back: "Pac-Man. Namco, 1980: a yellow circle and four ghosts, and the best-known face in games.", review: READ },
  { level: 8, name: "ドンキーコング", note: "任天堂、1981年。宮本茂の最初のゲームで、のちにマリオになる大工が登場しました。", back: "Donkey Kong. Nintendo, 1981: Shigeru Miyamoto's first game, with the carpenter who later became Mario.", review: READ },
  { level: 9, name: "1UP", note: "残機がもう1つ。遊んだ人なら、今でも頭の中で鳴る音です。", back: "1UP. One more spare life. A sound anybody who played can still hear in their head.", review: READ },
  { level: 10, name: "1P", note: "筐体にもソファにも最初の席があります。そのゲームが作られた相手のための席です。", back: "1P. Every cabinet and every sofa has a first seat: the seat for the person the game was built for.", review: READ },
  // 11-20: 8-bit, and the first games anyone learns.
  { level: 11, name: "三目並べ", note: "9マスに3つ並べる、誰もが最初に覚える遊び。そして、最初に「勝てない」と知る遊びでもあります。", back: "Three-in-a-row. The game anyone learns first on nine squares, and also the first game anyone learns cannot be won.", review: READ },
  { level: 12, name: "コレコビジョン", note: "コレコ、1982年。ドンキーコングが同梱され、ライバルのアタリのカートリッジも遊べる拡張モジュールがありました。", back: "ColecoVision. Coleco, 1982: Donkey Kong came in the box, and an expansion module played the rival Atari's cartridges too.", review: READ },
  { level: 13, name: "ファミコン", note: "任天堂、1983年。海外ではNESとして1985年に発売され、死んでいたゲームを呼び戻した箱です。", back: "Famicom. Nintendo, 1983. Sold abroad as the NES in 1985, the box that brought games back from the dead.", review: READ },
  { level: 14, name: "ワールド1-1", note: "スーパーマリオブラザーズ、1985年。説明の言葉を一言も使わずに、世界じゅうに遊び方を教えたステージです。", back: "World 1-1. Super Mario Bros., 1985: the stage that taught the whole world how to play without a word of explanation.", review: READ },
  { level: 15, name: "コネクトフォー", note: "ミルトン・ブラッドリー、1974年。重力が置く場所を決める四目並べ。1988年に必勝法が解かれましたが、今もそれを知らないかのように遊ばれています。", back: "Connect Four. Milton Bradley, 1974: four in a row with gravity deciding where the piece goes. Solved in 1988, and still played as if nobody knew.", review: READ },
  { level: 16, name: "ゼルダの伝説", note: "1986年。金色のカートリッジ、セーブ用の電池、そして「ひとりで行くのは危険だ」の一言。", back: "The Legend of Zelda. 1986: a golden cartridge, a battery for saving, and the line \"it is dangerous to go alone.\"", review: READ },
  { level: 17, name: "ウノ", note: "メリル・ロビンス、1971年。オハイオの理髪師が作った4色のカード。最後の1枚の前に「ウノ」と言わないと、2枚引きです。", back: "Uno. Merle Robbins, 1971: a deck of four colours made by an Ohio barber. If you do not say \"Uno\" before your last card, you draw two.", review: READ },
  { level: 18, name: "キング・ミー", note: "チェッカー。向こう端の列に着くと駒がもう1枚重ねられて、人生で初めて後ろへも動けます。", back: "King Me. Checkers: reach the far row and a second piece is stacked on yours, and you can move backwards for the first time in your life.", review: READ },
  { level: 19, name: "ゲームボーイ", note: "1989年。緑の4階調、単3電池2本で30時間。海外版にはテトリスが同梱されていました。", back: "Game Boy. 1989: four shades of green, thirty hours on two AA batteries. The overseas version had Tetris in the box.", review: READ },
  { level: 20, name: "テトリス", note: "アレクセイ・パジトノフ、1984年。7つの形と1つのルール。地球上の誰もが遊んだことのある、たった1つのゲームです。", back: "Tetris. Alexey Pajitnov, 1984: seven shapes and one rule. The one single game everybody on Earth has played.", review: READ },
  // 21-30: 16-bit, the console war, and the arcade at its loudest.
  { level: 21, name: "メガドライブ", note: "セガ、1988年。海外名はジェネシス。任天堂に対するセガの16ビット機の答えで、名に値する最初のハード戦争の始まりでした。", back: "Mega Drive. Sega, 1988. Called Genesis abroad. Sega's 16-bit answer to Nintendo, and the start of the first console war worth the name.", review: READ },
  { level: 22, name: "ソニック・ザ・ヘッジホッグ", note: "1991年。態度の大きい青いハリネズミ。配管工がどうやっても跳べない速さで走るために生まれました。", back: "Sonic the Hedgehog. 1991: a blue hedgehog with attitude, born to run faster than a plumber could ever jump.", review: READ },
  { level: 23, name: "五目並べ", note: "囲碁盤で5つ並べる遊び。日本で何世紀も、もっと難しいゲームから借りた石で遊ばれてきました。このサイトの名前の由来です。", back: "Gomoku. Five in a row on a Go board, played in Japan for centuries with stones borrowed from a harder game. This site is named after it.", review: READ },
  { level: 24, name: "PCエンジン", note: "NEC、1987年。海外ではターボグラフィックス16として発売されました。名前の16に反して中身は8ビットのプロセッサで、ゲームはクレジットカードほどのカードに入っていました。", back: "PC Engine. NEC, 1987. Sold abroad as the TurboGrafx-16. Despite the 16 in the name it had an 8-bit processor inside, and the games came on cards the size of a credit card.", review: READ },
  { level: 25, name: "スーパーファミコン", note: "1990年（海外では1991年）。モード7、4色のボタンのパッド、そして今も史上最高と言われるソフトのそろい。", back: "Super Famicom. 1990 (1991 abroad): Mode 7, a pad with four coloured buttons, and a library still said to be the best there ever was.", review: READ },
  { level: 26, name: "波動拳", note: "ストリートファイターII、1991年。↓↘→とパンチ。ゲーマーが最初に覚えた必殺技です。", back: "Hadoken. Street Fighter II, 1991: down, down-forward, forward and punch. The first special move every gamer learned to throw.", review: READ },
  { level: 27, name: "バトルシップ", note: "ミルトン・ブラッドリー、1967年。プラスチックの盤2枚、命中と外れごとのペグ、そしてテレビ広告のあの叫び「私の戦艦を沈めたな！」。負けた提督は以来ずっとまねしてきました。", back: "Battleship. Milton Bradley, 1967: two plastic grids, a peg for every hit and miss, and the cry from the TV advert, \"You sunk my battleship!\" Every losing admiral has copied it since.", review: READ },
  { level: 28, name: "オセロ", note: "長谷川五郎、1973年。覚えるのに1分、極めるのに一生。そして、すべてを決める隅。", back: "Othello. Goro Hasegawa, 1973: a minute to learn, a lifetime to master, and the corner that decides everything.", review: READ },
  { level: 29, name: "スーパーメトロイド", note: "1994年。マップ、雰囲気、そして助けに戻れた動物たち。多くの人にとって、あのハードで最高のゲームです。", back: "Super Metroid. 1994: the map, the mood, and the animals you could go back to save. For many people, the best game on that machine.", review: READ },
  { level: 30, name: "ネオジオ", note: "SNK、1990年。アーケード基板を家庭用ゲーム機として売りました。値段は、通りで一番のお金持ちの子にしか払えないものでした。", back: "Neo Geo. SNK, 1990: the arcade board sold as a home console, at a price only the richest child on the street could pay.", review: READ },
  // 31-40: the leap into 3D, and the openings.
  { level: 31, name: "クロノ・トリガー", note: "スクウェア、1995年。ドリームチーム、13のエンディング、そして「最高のRPGは」と聞かれて今も名前が挙がる作品。", back: "Chrono Trigger. Square, 1995: the dream team, thirteen endings, and the RPG still named when people are asked for the best.", review: READ },
  { level: 32, name: "ドゥーム", note: "id Software、1993年。シェアウェアとショットガン、そして会社のネットワークが本当は何のためにあったかを教えた最初のゲーム。", back: "Doom. id Software, 1993: shareware, a shotgun, and the first game the office network was secretly for.", review: READ },
  { level: 33, name: "プレイステーション", note: "ソニー、1994年。CDと灰色の箱。ゲームが子ども部屋から外へ出ていった瞬間です。", back: "PlayStation. Sony, 1994: a CD and a grey box. The moment games moved out of the children's room.", review: READ },
  { level: 34, name: "ギャンビット", note: "チェス：序盤でポーンを1つ差し出し、ポーンより価値のあるものを得る。以来あらゆる作戦が借りてきた言葉です。", back: "Gambit. Chess: give up a pawn in the opening for something worth more than a pawn. A word every plan since has borrowed.", review: READ },
  { level: 35, name: "NINTENDO64", note: "1996年。3つ又のパッド、4つのコントローラ端子、そして以後のすべてのハードがまねしたアナログスティック。", back: "Nintendo 64. 1996: a three-pronged pad, four controller ports, and the analog stick every console since has copied.", review: READ },
  { level: 36, name: "スーパーマリオ64", note: "1996年。スティックが、本物の丸い立体の世界の中でキャラクターを動かした最初のときです。", back: "Super Mario 64. 1996: the first time a stick moved a character through a real, round, three-dimensional world.", review: READ },
  { level: 37, name: "定石", note: "囲碁で決まった隅の打ち方。丸暗記して、そして格言どおり、忘れるものです。", back: "Joseki. Go's settled ways of playing a corner, learned by heart and then, as the proverb says, forgotten.", review: READ },
  { level: 38, name: "インテレビジョン", note: "マテル、1979年。何年も早い16ビットのプロセッサ、ゲームごとにキーパッドにかぶせるカード、そしてテレビでアタリと並べて見せたジョージ・プリンプトン。", back: "Intellivision. Mattel, 1979: a 16-bit processor years early, a card laid over the keypad for every game, and George Plimpton on TV holding it up against the Atari.", review: READ },
  { level: 39, name: "ゴールデンアイ 007", note: "レア社、1997年。4人で1画面、そしてオッドジョブを選ばないという家庭内のルール。", back: "GoldenEye 007. Rare, 1997: four players on one screen, and a house rule about not picking Oddjob.", review: READ },
  { level: 40, name: "ファイナルファンタジーVII", note: "スクウェア、1997年。ディスク3枚、バスターソード、そして誰も心の準備ができていなかった死。", back: "Final Fantasy VII. Square, 1997: three discs, the Buster Sword, and the death nobody was ready for.", review: READ },
  // 41-50: the turn of the millennium.
  { level: 41, name: "ポケットモンスター 赤", note: "ゲームフリーク、1996年。151匹、通信ケーブル、そして世界を動かした校庭での交換。", back: "Pokémon Red. Game Freak, 1996: a hundred and fifty-one of them, a link cable, and the playground trade that started a world.", review: READ },
  { level: 42, name: "ドリームキャスト", note: "セガ、1998年に日本で発売（海外では1999年9月9日）。箱に入ったモデム、そしてセガ最後のハード。最後まで時代の先を行っていました。", back: "Dreamcast. Sega, released in Japan in 1998 (9 September 1999 abroad): a modem in the box, and the last console Sega ever made, ahead of its time to the end.", review: READ },
  { level: 43, name: "メタルギア ソリッド", note: "コナミ、1998年。段ボール箱、コーデック通信、そしてメモリーカードを読んだボス。", back: "Metal Gear Solid. Konami, 1998: a cardboard box, a codec call, and a boss who read your memory card.", review: READ },
  { level: 44, name: "ハーフライフ", note: "Valve、1998年。バール、トラムでの移動、そして操作を一度も取り上げずに語られた物語。", back: "Half-Life. Valve, 1998: a crowbar, a tram ride, and a story told without ever taking the controls away.", review: READ },
  { level: 45, name: "ソリティア", note: "Windows 3.0、1990年。インターンが作ったカードゲーム。マウスのドラッグを世界に教えるために同梱され、勝つと跳ね回るカードの滝が出ました。", back: "Solitaire. Windows 3.0, 1990: a card game made by an intern, shipped to teach the world to drag with a mouse, with a cascade of bouncing cards when you won.", review: READ },
  { level: 46, name: "スタークラフト", note: "ブリザード、1998年。3つの種族、以来誰も並ぶことのないバランス、そして韓国がテレビで放送したゲーム。", back: "StarCraft. Blizzard, 1998: three races, a balance nobody has matched since, and a game South Korea put on television.", review: READ },
  { level: 47, name: "イロレーティング", note: "アルパド・エロ、1960年。腕前を表す数字。チェスのために考案され、このサイトを含む今のあらゆる順位表の裏にあります。", back: "Elo rating. Arpad Elo, 1960: the number that says how good you are, devised for chess and behind every ranking today, this site's included.", review: READ },
  { level: 48, name: "ボス戦", note: "音楽が変わり、体力ゲージが画面いっぱいに伸びて、これまで覚えたすべてが試されます。", back: "Boss fight. The music changes, the health bar fills the screen, and everything learned so far is about to be tested.", review: READ },
  { level: 49, name: "ペンテ", note: "ゲーリー・ガブレル、1977年。5つ並べるか、5組取るか。オクラホマのピザ店で生まれ、ここでも今も遊ばれています。", back: "Pente. Gary Gabrel, 1977: five in a row or five pairs captured, born in a pizza parlour in Oklahoma and still played here.", review: READ },
  { level: 50, name: "プレイステーション2", note: "ソニー、2000年。たまたまゲームも遊べるDVDプレーヤー。1億5500万台は、それ以前も以後も、どのハードより多い数です。", back: "PlayStation 2. Sony, 2000: a DVD player that happened to play games. 155 million sold, more than any console before or since.", review: READ },
  // 51-60: the sixth generation, and the middle game.
  { level: 51, name: "布石", note: "囲碁の序盤。100手あとに決着する対局のための石の配置。日常の言葉としても、あらゆる下準備を指すようになりました。", back: "Fuseki. Go's opening: the laying out of stones for a game decided a hundred moves later. In everyday speech it has also come to mean any groundwork.", review: READ },
  { level: 52, name: "ゲームキューブ", note: "2001年。取っ手のついた紫の弁当箱、小さなディスク、そしてスマブラの遊び手が今も手放さないほど出来のいいコントローラ。", back: "GameCube. 2001: a purple lunchbox with a handle, tiny discs, and a controller so good Smash players still will not give it up.", review: READ },
  { level: 53, name: "アンパッサン", note: "チェスで最も奇妙なルール。ポーンが、一度も止まっていないマスで取られます。初心者が全員「でっち上げだ」と言うルールです。", back: "En passant. Chess's strangest rule: a pawn is captured on a square it never landed on. The rule every beginner swears was made up.", review: READ },
  { level: 54, name: "ヘイロー", note: "バンジー、2001年。マスターチーフ、リング状の世界、そして初代Xboxを売ったゲーム。", back: "Halo. Bungie, 2001: Master Chief, a ring world, and the game that sold the first Xbox.", review: READ },
  { level: 55, name: "Tスピン", note: "テトリスで最も修得の難しい技。Tの形を、落ちてくるはずのない隙間にひねり込みます。ダブルがテトリスより高い得点になります。", back: "T-spin. Tetris's hardest-earned move: twist the T into a gap it could never have fallen into. A double scores more than a Tetris.", review: READ },
  { level: 56, name: "ワールド オブ ウォークラフト", note: "ブリザード、2004年。1200万人の契約者、火曜の夜のレイド、そしてリロイ・ジェンキンス。", back: "World of Warcraft. Blizzard, 2004: twelve million subscribers, a raid on Tuesday night, and Leeroy Jenkins.", review: READ },
  { level: 57, name: "ニンテンドーDS", note: "2004年。2画面、スタイラス、そして1億5400万台。iPhoneより3年早いタッチスクリーン。", back: "Nintendo DS. 2004: two screens, a stylus, and 154 million sold. A touchscreen three years before the iPhone.", review: READ },
  { level: 58, name: "ワンダと巨像", note: "チームICO、2005年。16体の巨像、空っぽの世界、そして「ゲームは芸術になれない」と言われたときに挙がる名前。", back: "Shadow of the Colossus. Team Ico, 2005: sixteen giants, an empty world, and the name that is raised when someone says games cannot be art.", review: READ },
  { level: 59, name: "連珠", note: "黒の手を縛った五目並べ。三三も長連も禁止。大会で使われる形で、日本、1899年。", back: "Renju. Gomoku with black's hands tied: no double threes, no overlines. The tournament form of the game, Japan, 1899.", review: READ },
  { level: 60, name: "Wii", note: "任天堂、2006年。パッドの代わりにリモコン、同梱のWii Sports、そして居間でボウリングをする祖父母たち。", back: "Wii. Nintendo, 2006: a remote instead of a pad, Wii Sports in the box, and grandparents bowling in the living room.", review: READ },
  // 61-70: the HD era, and the fight.
  { level: 61, name: "ポータル", note: "Valve、2007年。穴を2つあける銃、ケーキを約束したコンピュータ、そしてエンドロールの歌。", back: "Portal. Valve, 2007: a gun that makes two holes, a computer that made promises about cake, and a song over the credits.", review: READ },
  { level: 62, name: "ダブリングキューブ", note: "バックギャモン、ニューヨーク、1920年代。2から64の目のついたサイコロと、賭け金を2倍にしようと持ちかけるための手番。相手は受けるか、降りるかです。", back: "Doubling Cube. Backgammon, New York, the 1920s: a die marked 2 to 64, and a turn spent offering to double the stakes, which the other side must accept or give up.", review: READ },
  { level: 63, name: "劫", note: "囲碁の、盤面の繰り返しを禁じるルール。別の場所でもっと大きなものを脅かさなければ勝てない戦いです。", back: "Ko. Go's rule against repeating the board: a fight you can only win by threatening something bigger somewhere else.", review: READ },
  { level: 64, name: "マインクラフト", note: "Mojang、2011年。土のブロック、ドアの前のクリーパー、そして3億本。史上最も売れたゲームです。", back: "Minecraft. Mojang, 2011: a block of dirt, a creeper at the door, and 300 million sold. The best-selling game there has ever been.", review: READ },
  { level: 65, name: "スカイリム", note: "ベセスダ、2011年。「Fus Ro Dah」、道の上のドラゴン、そして「膝に矢を受けてしまってな」。", back: "Skyrim. Bethesda, 2011: \"Fus Ro Dah,\" a dragon on the road, and \"I took an arrow to the knee.\"", review: READ },
  { level: 66, name: "ダークソウル", note: "フロム・ソフトウェア、2011年。「YOU DIED」、篝火、そして公平だった中で最も難しいゲーム。太陽万歳。", back: "Dark Souls. FromSoftware, 2011: \"YOU DIED,\" a bonfire, and the hardest game that was ever fair. Praise the sun.", review: READ },
  { level: 67, name: "手筋", note: "囲碁で巧みな手を指す言葉。局面を成り立たせる一手で、強い人が見ずに見つける手です。", back: "Tesuji. Go's word for a skilful move: the one that makes a position work, and the one a stronger player finds without looking.", review: READ },
  { level: 68, name: "ザ・ラスト・オブ・アス", note: "ノーティードッグ、2013年。キリン、最後の嘘、そしてこの分野全体を大人にした物語。", back: "The Last of Us. Naughty Dog, 2013: a giraffe, a lie at the end, and the story that made the whole medium grow up.", review: READ },
  { level: 69, name: "グランド・セフト・オートV", note: "ロックスター、2013年。ロスサントス、3人の主人公、そして史上2番目に売れたゲーム。10年たった今も売れ続けています。", back: "Grand Theft Auto V. Rockstar, 2013: Los Santos, three leads, and the second-best-selling game ever, still selling a decade on.", review: READ },
  { level: 70, name: "ウィッチャー3", note: "CDプロジェクト、2015年。ゲラルト、グウェント、そして多くのゲームの本筋より出来のいいサブクエスト。", back: "The Witcher 3. CD Projekt, 2015: Geralt, Gwent, and side quests better than most games' main ones.", review: READ },
  // 71-80: the present day, and the first marks of mastery.
  { level: 71, name: "ニンテンドースイッチ", note: "2017年。ドックから持ち上げてそのまま外へ連れ出せるハード、そして誰も飽きないJoy-Conのカチッという音。", back: "Nintendo Switch. 2017: a console you lift off the dock and carry out the door, and a Joy-Con click nobody tires of.", review: READ },
  { level: 72, name: "強くてニューゲーム", note: "クロノ・トリガーの言葉そのまま。クリアして、すべてを引き継ぎ、世界の予想より強くなって最初からやり直します。", back: "Strong New Game. Chrono Trigger's own words: finish the game, keep everything, and start again stronger than the world expects.", review: READ },
  { level: 73, name: "スピードラン", note: "Any%、ノーグリッチ、100%。同じゲームを、作った人たちが想像した時間のほんの一部でクリアします。", back: "Speedrun. Any%, glitchless or 100%: the same game, finished in a fraction of the time its makers thought it took.", review: READ },
  { level: 74, name: "プレイステーション5", note: "ソニー、2020年。指を押し返すデュアルセンスと、1年のあいだどの店でも見つからなかったハード。", back: "PlayStation 5. Sony, 2020: a DualSense that pushes back on your fingers, and the console nobody could find in a shop for a year.", review: READ },
  { level: 75, name: "プラチナトロフィー", note: "ゲームのすべてのトロフィーを集めて、プラチナが1つ。自分のプロフィールを二度見する理由です。", back: "Platinum Trophy. Every trophy in the game, one platinum to show for it, and a reason to look at your own profile twice.", review: READ },
  { level: 76, name: "本因坊", note: "囲碁で最も古いタイトル。1612年に算砂が初めて名乗り、以来毎年争われています。あらゆるゲームで最も長く続く選手権です。", back: "Honinbo. Go's oldest title, first held by Sansa in 1612 and fought for every year since: the longest-running championship in any game.", review: READ },
  { level: 77, name: "コンボブレーカー", note: "キラーインスティンクト、1994年。「C-C-C-COMBO BREAKER」。以来、あらゆる割り込みで叫ばれる2語です。", back: "Combo Breaker. Killer Instinct, 1994: \"C-C-C-COMBO BREAKER,\" the two words shouted at every interruption since.", review: READ },
  { level: 78, name: "竜王", note: "ドラゴンキング。将棋の成った飛車の名で、八大タイトルの1つの名でもあります。", back: "Ryuo. Dragon King: the name of shogi's promoted rook, and of one of its eight major titles.", review: READ },
  { level: 79, name: "トリプルワードスコア", note: "スクラブル、アルフレッド・バッツ、1938年。縁に並ぶ赤い8マス。そのうち2つにまたがる単語は、9倍の得点になります。", back: "Triple Word Score. Scrabble, Alfred Butts, 1938: eight red squares around the rim, and a word stretched across two of them is worth nine times its score.", review: READ },
  { level: 80, name: "ブレス オブ ザ ワイルド", note: "任天堂、2017年。台地、パラセール、そして見渡せる場所ならどこへでも行ける王国まるごと。", back: "Breath of the Wild. Nintendo, 2017: a plateau, a paraglider, and a whole kingdom that let you go anywhere you could see.", review: READ },
  // 81-90: the legends.
  { level: 81, name: "エルデンリング", note: "フロム・ソフトウェア、2022年。狭間の地、トレントという名の馬、そして開かれた世界に放たれたソウルの方式。", back: "Elden Ring. FromSoftware, 2022: the Lands Between, a horse called Torrent, and the Souls formula set loose in an open world.", review: READ },
  { level: 82, name: "ツークツワンク", note: "チェスの言葉。どの手を指しても事態が悪くなる局面で、勝てる唯一の手は、指さなくていいことだけです。", back: "Zugzwang. A chess word: a position where every move makes things worse, and the only winning move would be not having to move.", review: READ },
  { level: 83, name: "ノーダメージクリア", note: "ボスからボスまで、1ポイントのダメージも受けずにゲーム全体をクリアします。1回の失敗で最初からです。", back: "No-damage clear. A whole game, boss to boss, without taking a single point of damage; one slip and it is back to the start.", review: READ },
  { level: 84, name: "ディープ・ブルー", note: "IBM、1997年。世界チェスチャンピオンに対局で勝った最初のマシン。そして、そのときのカスパロフの顔。", back: "Deep Blue. IBM, 1997: the first machine to beat a world chess champion in a match, and Kasparov's face when it did.", review: READ },
  { level: 85, name: "背水の逆転劇", note: "2004年。ウメハラが春麗のスーパーアーツ15発すべてを、ライフ1ドットでパリィし、会場が総立ちで叫びました。", back: "The Comeback with Your Back to the River. 2004: Umehara parries all fifteen hits of Chun-Li's super art on one dot of life, and a room stands up and screams.", review: READ },
  { level: 86, name: "キルスクリーン", note: "パックマン256面。盤面が崩れます。ナムコの誰も、ここまで到達する人がいるとは思っていなかったからです。", back: "Kill Screen. Pac-Man level 256: the board falls apart, because nobody at Namco believed anyone would ever get this far.", review: READ },
  { level: 87, name: "イモータル・ゲーム", note: "アンデルセン対キセリツキー、ロンドン、1851年。クイーン、ルーク2つ、ビショップを差し出して、今も語り継がれる詰み。", back: "Immortal Game. Anderssen v Kieseritzky, London, 1851: a queen, two rooks and a bishop given away, and a mate still told of today.", review: READ },
  { level: 88, name: "グランドマスター", note: "1950年以来のチェスの最高称号。そして、見えないブロックを置ける人のために「テトリス ザ・グランドマスター」が取っておく段位です。", back: "Grandmaster. Chess's highest title since 1950, and the grade that Tetris: The Grand Master keeps for people who can place invisible blocks.", review: READ },
  { level: 89, name: "フレーム単位の入力", note: "60分の1秒しかない1フレームに入力を合わせること。上手な人と、世界最高の人を分ける差です。", back: "Frame-exact input. Matching an input to the one frame in sixty that works: the difference between a good player and the best one alive.", review: READ },
  { level: 90, name: "時のオカリナ", note: "任天堂、1998年。Zターゲット、時の神殿、そして批評家がゲームに与えた史上最高の点数。", back: "Ocarina of Time. Nintendo, 1998: Z-targeting, the Temple of Time, and the highest score any critic has ever given a game.", review: READ },
  // 91-100: the pantheon.
  { level: 91, name: "シュート・ザ・ムーン", note: "ハーツ：ハートのすべてとスペードのクイーンという、本来なら自分を沈める札をすべて取り、26点を全員に押しつけます。", back: "Shoot the Moon. Hearts: take every heart and the queen of spades, the tricks that should sink you, and hand all 26 points to everybody else.", review: READ },
  { level: 92, name: "詰み", note: "王に逃げ場がなく、もう言うことは何もありません。最も古い勝利の言葉です。", back: "Checkmate. The king has nowhere to go and there is nothing left to say: the oldest winning word there is.", review: READ },
  { level: 93, name: "コナミコマンド", note: "上上下下左右左右BA。『魂斗羅』では残機30人、そして入力された中で最も有名な秘密です。", back: "Konami Code. Up, up, down, down, left, right, left, right, B, A: thirty lives in Contra, and the most famous secret ever entered.", review: READ },
  { level: 94, name: "天元", note: "天の始まり。囲碁盤の中心の点で、最も大胆な初手であり、1976年から争われているタイトルの名です。", back: "Tengen. The origin of heaven: the centre point of the Go board, the boldest first move there is, and the name of a title fought for since 1976.", review: READ },
  { level: 95, name: "大魔王", note: "最後の1体。他のあらゆる戦いが練習だった相手です。皆が倒さなければならない相手を指す言葉でもあります。", back: "Great Demon King. The last one, the one every other fight was practice for; also the word for whoever everyone else has to beat.", review: READ },
  { level: 96, name: "37手目", note: "AlphaGo対イ・セドル、第2局、2016年。人間なら打たない、1万分の1の確率の手。機械が創造的と呼ばれた瞬間です。", back: "Move 37. AlphaGo v Lee Sedol, game two, 2016: a move no human would play, at one-in-ten-thousand odds, and the moment a machine was called creative.", review: READ },
  { level: 97, name: "高得点", note: "筐体の一番上に並ぶ3文字のイニシャル。ゲームセンターがそもそも目指していたもののすべてです。", back: "High Score. Three initials at the top of the cabinet, and everything the arcade was ever for.", review: READ },
  { level: 98, name: "麻雀", note: "中国、1800年代。牌144枚、4人、山を積む音。そして1920年代にアメリカと日本に届いたブームです。", back: "Mahjong. China, the 1800s: 144 tiles, four players, the clatter of building the wall, and a craze that reached America and Japan in the 1920s.", review: READ },
  { level: 99, name: "ロイヤルフラッシュ", note: "ポーカー最強の役。同じ柄で10からエースまで。5枚の手札なら、およそ649,740通りに1回配られます。", back: "Royal Flush. Poker's unbeatable hand: ten to ace in one suit, dealt about once in every 649,740 five-card hands.", review: READ },
  { level: 100, name: "神の一手", note: "囲碁を打つ人が千年追い続けてきた完璧な一手。そして、ヒカルの碁のサイが現世にとどまった理由です。", back: "The Divine Move. The one perfect move Go players have chased for a thousand years, and the reason Sai stayed in this world.", review: READ },
];
