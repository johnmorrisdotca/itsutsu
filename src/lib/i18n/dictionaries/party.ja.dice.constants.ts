import type { DiceTableKind } from "../../party/diceTable/diceTable.constants";

import type { PartyCopyJa } from "./party.ja.types";

/**
 * Pig's, Ten Thousand's, Liar's Dice's and Sayu's words in Japanese. Drafted on
 * 2026-10-31 and NOT READ: nobody has reviewed them, so each row carries an `ask`
 * and no `review`, and the sheet says "Question, unread". Stamp a row only when it
 * has been read.
 */
export const DICE_TABLE_UNREAD = "Drafted 2026-10-31 with the new dice games, and read by nobody yet: please read it, and check 確定 for Bank, 宣言 for a bid, 取り分ける for Set aside and チップ for a counter.";

export const PARTY_COPY_JA_DICE: Record<DiceTableKind, PartyCopyJa> = {
  pig: {
    tagline: ["サイコロ1個を、振れるだけ振ります。出た目はその番の点に加わり、1が出るとすべて失います。", "Roll one die as many times as you can. The number that comes up is added to that turn's points, and when a 1 comes up you lose it all."],
    origin: [
      "いつからあるのか誰にも分からない、度胸のゲームです。印刷物に初めて書かれたのは、1945年のジョン・スカーニーの『Scarne on Dice』です。やめどきが本物の問いで、本物の答えがあるので、それ以来、算数や数学の授業でも好まれてきました。誰のものでもありません。",
      "A game of nerve, and nobody knows since when it has existed. It was first written down in print in John Scarne's Scarne on Dice in 1945. Because when to stop is a real question with a real answer, it has been a favourite in maths classes ever since. It belongs to nobody.",
    ],
    rules: [
      ["自分の番には、サイコロを振ります。2から6の目はその番の点に加わり、もう一度振るか、確定するかを選びます。", "On your turn, roll the die. A 2 to 6 is added to that turn's points, and you choose whether to roll again or to lock it in."],
      ["確定すると、その番の点は自分の得点になり、次の人が振ります。", "When you lock it in, that turn's points become your score, and the next person rolls."],
      ["1が出ると、その番は終わり、その番の点は消えます。前に確定した点は残ります。", "When a 1 comes up, that turn is over and that turn's points vanish. Points locked in earlier remain."],
      ["確定して目標点に最初に届いた人が、その場で勝ちます。", "The first person to reach the target score by locking in wins on the spot."],
    ],
    board: ["50点は短いゲーム、100点はふつうのゲームです。2〜8人で遊べ、どの席にもコンピュータを座らせられます。コンピュータは、誰かが勝ちそうなときを除き、昔からの目安どおり20点で確定します。", "50 points is a short game and 100 points the ordinary one. Two to eight can play, and a computer can sit in any seat. The computer locks in at 20 points, as the old guideline says, except when somebody looks like winning."],
    ask: DICE_TABLE_UNREAD,
  },
  tenThousand: {
    tagline: ["サイコロ6個で遊びます。点になるものを取り分け、残りを振るか、点にならない目が出る前にその番を確定します。", "Played with six dice. Set aside what scores, then roll the rest, or lock in the turn before a roll that scores nothing comes."],
    origin: [
      "考案者の分からない民間のゲームで、呼び名はたくさんあり、ふつうのサイコロ6個があればどこでも遊ばれてきました。ここでは、昔から目標にされてきた点数を名前にしています。このゲーム自体は誰のものでもありません。",
      "A folk game with no known inventor and many names, played anywhere there are six ordinary dice. Here it is named for the score that has long been the target. The game itself belongs to nobody.",
    ],
    rules: [
      ["自分の番には、6個すべてを振ります。点になるサイコロを少なくとも1個取り分け、残りを振るか、その番の点を確定します。", "On your turn, roll all six. Set aside at least one die that scores, then roll the rest or lock in that turn's points."],
      ["1は100点、5は50点です。1が3個で1,000点、ほかの目が3個ならその目の100倍です。同じ目が4個で1,000点、5個で2,000点、6個で3,000点です。1から6までの並びと3組のペアは1,500点、3個組が2つで2,500点です。", "A 1 is 100 points and a 5 is 50. Three 1s are 1,000 points, and three of any other number are 100 times that number. Four of the same are 1,000 points, five 2,000 and six 3,000. A run from 1 to 6 and three pairs are 1,500 points, and two sets of three are 2,500."],
      ["点になるものが1つもない目は、バーストです。その番は終わり、その番の点は消えます。組み合わせて点にできるのは、同じ回に振ったサイコロだけです。", "A roll with nothing that scores is a bust. That turn is over and that turn's points vanish. Only dice rolled the same time can be combined to score."],
      ["6個すべてを取り分けると、ホットダイスです。6個すべてをもう一度振り、その番の点を増やし続けられます。", "When you set aside all six it is hot dice. You roll all six again and can go on adding to that turn's points."],
      ["誰かが確定して目標点に届くと、ほかの全員にもう1回ずつ番があり、その人を超えるチャンスがあります。合計がいちばん高い人の勝ちで、同点なら勝ちを分け合います。", "When somebody reaches the target score by locking in, everybody else has one more turn each and a chance to pass them. The highest total wins, and on a tie the win is shared."],
    ],
    board: ["1万点がフルゲームで、5,000点や2,000点は短いゲームです。2〜8人で遊べ、どの席にもコンピュータを座らせられます。得点を始めるのに最低点はなく、どの確定も数えます。", "10,000 points is the full game, and 5,000 or 2,000 are short games. Two to eight can play, and a computer can sit in any seat. There is no minimum score for starting to score, and every lock-in counts."],
    ask: DICE_TABLE_UNREAD,
  },
  liarsDice: {
    tagline: ["全員のサイコロは隠れています。全員の分を合わせて何があるかを宣言するか、直前の宣言を嘘だと言います。", "Everybody's dice are hidden. Declare what there is across everybody's dice together, or say the last declaration is a lie."],
    origin: [
      "南米の古いゲームとして語られるはったりのゲームで、向こうでは「疑う」という意味のドゥードと呼ばれます。本当にどれほど古いのかは、誰にも示せません。サイコロとカップがあれば、酒場でも船の上でも遊ばれてきました。誰のものでもありません。",
      "A bluffing game told of as an old South American one, called dudo there, meaning \"I doubt\". Nobody can show how old it really is. Wherever there were dice and cups, it has been played, in bars and on ships. It belongs to nobody.",
    ],
    rules: [
      ["全員がこっそりサイコロを振り、自分の目だけを見ます。1は万能で、どの目としても数えるので、1を宣言することはありません。", "Everybody rolls their dice secretly and looks only at their own. A 1 is wild and counts as any number, so nobody declares 1s."],
      ["最初の人は、全員の分を合わせて、ある目が何個あるかを宣言します。「5が4個」は、5か1が少なくとも4個あるという意味です。", "The first person declares how many dice of a number there are across everybody's. \"Four 5s\" means there are at least four 5s or 1s."],
      ["順番に、より高く宣言します。どの目でも個数を増やすか、同じ個数でより大きな目にします。または、直前の宣言を嘘だと言います。", "In turn, each declares higher: more dice of any number, or the same number of dice with a larger number. Or they say the last declaration is a lie."],
      ["嘘だと言われたら、全員のカップを開けて数えます。宣言に足りなければ宣言した人が、足りていれば嘘だと言った人が、サイコロを1個失います。そのあと全員が振り直し、負けた人から始めます。", "When it is called a lie, everybody's cup is opened and the dice are counted. If the declaration falls short the person who declared loses one die, and if it holds the person who called it a lie does. Then everybody rolls again, starting with the loser."],
      ["最後のサイコロを失うと脱落です。最後までサイコロが残っていた人の勝ちです。", "Lose your last die and you are out. The person whose dice remain to the end wins."],
    ],
    board: ["1人5個がふつうのゲームで、3個は短いゲームです。2〜8人で遊べますが3人以上がおすすめで、どの席にもコンピュータを座らせられます。コンピュータが読むのは、自分の目と卓上のサイコロの数だけです。", "Five each is the ordinary game and three a short one. Two to eight can play, three or more is recommended, and a computer can sit in any seat. All the computer reads is its own dice and the number of dice on the table."],
    ask: DICE_TABLE_UNREAD,
  },
  sayu: {
    tagline: ["サイコロを振って、チップを左へ、右へ、ポットへ回します。チップを持つ人が1人だけになるまで続けます。", "Roll the dice and pass your chips left, right or to the pot. It goes on until only one person holds chips."],
    origin: [
      "サイコロの目でチップが手から手へ移り、誰も何も決めない、昔からの仲間のゲームで、卓の全員で遊びます。ここでの名前は「左右」から取った、このサイトのものです。チップはただのチップで、1回のゲームの中にだけあり、その外では何の価値もありません。",
      "A game for the whole table, of an old family in which chips move from hand to hand on the fall of the dice and nobody decides anything. The name here is this site's own, taken from \"left and right\". The chips are only chips: they exist only inside one game, and outside it they have no value.",
    ],
    rules: [
      ["全員が同じ数のチップで始めます。自分の番には、持っているチップ1枚につきサイコロを1個振ります。振るのは3個までです。", "Everybody starts with the same number of chips. On your turn, roll one die for each chip you hold. You roll at most three."],
      ["サイコロ1個がチップ1枚を動かします。1は左隣の人へ、2は右隣の人へ、3はポットへ送ります。4、5、6は手元に残ります。", "One die moves one chip. A 1 sends it to the person on your left, a 2 to the person on your right, a 3 to the pot. A 4, 5 or 6 stays with you."],
      ["チップがなければ振りませんが、脱落ではありません。隣の人からまた回ってくるかもしれません。", "With no chips you do not roll, but you are not out. One may yet come round again from the person next to you."],
      ["チップを持つ人が1人だけになると、その人の勝ちで、ポットもその人のものです。", "When only one person holds chips, that person wins, and the pot is theirs too."],
    ],
    board: ["1人3枚がふつうのゲームで、2枚は短く、5枚は時間がかかります。2〜8人で遊べ、人数が多いほど楽しいゲームです。決めることが何もないので、年齢を問わず誰でも遊べ、どの席にもコンピュータを座らせられます。", "Three each is the ordinary game; two is short and five takes time. Two to eight can play, and the more people the more fun it is. Because there is nothing to decide, anybody of any age can play, and a computer can sit in any seat."],
    ask: DICE_TABLE_UNREAD,
  },
};

/** What each dice table says of itself on its rules page: the overlay of `PARTY_TABLE_WORDS`. Drafted and unread, as above. */
export const PARTY_TABLE_WORDS_JA_DICE = {
  pig: {
    turn: ["上の行に、誰の番か、その番で何点になったかが表示されます。「振る」を押すか、トレーをタップして振り、「確定」を押すとその番の点を残せます。表には全員の得点と、次に動く人が失うかもしれない点が出ます。", "The line at the top says whose turn it is and how many points that turn has made. Press \"Roll\" or tap the tray to roll, and press \"Lock in\" to keep that turn's points. The table shows everybody's score and the points the person to move may lose."],
    house: ["サイコロは、ゲームが新しい乱数のシードから振り、すべての出目はゲームとともに保存されるので、ページを読み込み直しても、新しく振られることはありません。どの席にもコンピュータを座らせられ、ブラウザーの中で、卓から見えるよう少しずつ動きます。サイコロの音は、オンにするまで鳴りません。", "The die is rolled by the game from a new random seed and every result is saved with the game, so reloading the page rolls nothing new. A computer can sit in any seat and moves little by little in the browser so the table can see. The dice sound does not play until you turn it on."],
  },
  tenThousand: {
    turn: ["上の行に、誰の番か、その番で何点になったかが表示されます。「振る」を押すか、トレーをタップして振ります。取り分けたいサイコロをタップすると、トレーの下のボタンに点数が出ます。「取り分ける」を押してから、残りを「振る」か「確定」します。点にならないサイコロは、点になるものと一緒には選べません。", "The line at the top says whose turn it is and how many points that turn has made. Press \"Roll\" or tap the tray to roll. Tap the dice you want to set aside and the button under the tray shows the points. Press \"Set aside\", then \"Roll\" the rest or \"Lock in\". Dice that do not score cannot be chosen together with ones that do."],
    house: ["サイコロは、ゲームが新しい乱数のシードから振り、すべての出目はゲームとともに保存されるので、ページを読み込み直しても、新しく振られることはありません。どの席にもコンピュータを座らせられ、ブラウザーの中で、卓から見えるよう少しずつ動きます。サイコロの音は、オンにするまで鳴りません。", "The dice are rolled by the game from a new random seed and every result is saved with the game, so reloading the page rolls nothing new. A computer can sit in any seat and moves little by little in the browser so the table can see. The dice sound does not play until you turn it on."],
    more: [["得点を始めるのに最低点はなく、同じ番の後の回で出た3個組に追加の点もありません。組み合わせて点になるのは、同じ回に振ったサイコロだけです。", "There is no minimum score for starting to score, and no extra points for a set of three from a later roll in the same turn. Only dice rolled the same time score together."]],
  },
  liarsDice: {
    turn: ["宣言の下に自分のサイコロが表示され、ほかの人のものは表示されません。個数と目を選んで「宣言」を押すか、「嘘だ！」を押して直前の宣言を疑います。1台の端末を2人以上で使うときは、番と番のあいだにサイコロを隠し、誰に回すかを示して、その人が本人だと押すまで表示しません。嘘だと言われたあとは、次にそうなるまで全員のサイコロが表示されます。", "Your dice are shown under the declaration, and nobody else's are. Choose how many and which number and press \"Declare\", or press \"Lie!\" to doubt the last declaration. When two or more share one device the dice are hidden between turns, it says who to pass to, and nothing is shown until that person presses to say it is them. After a call, everybody's dice are shown until the next one."],
    house: ["すべての出目は、ゲームが新しい乱数のシードから作り、ゲームとともに保存されるので、ページを読み込み直しても新しく振られることはなく、サイコロを見せる前に誰が端末を持っているかを尋ねます。どの席にもコンピュータを座らせられ、ブラウザーの中で、自分の目と卓上のサイコロの数だけを読んで打ちます。", "Every result is made by the game from a new random seed and saved with the game, so reloading the page rolls nothing new, and it asks who is holding the device before showing any dice. A computer can sit in any seat, and plays in the browser reading only its own dice and the number of dice on the table."],
    more: [["1は万能で、宣言できません。宣言できるのは卓上に残っているサイコロの数までで、嘘だと言われて負けた人が次のラウンドを始めます。その人のサイコロがなくなったときは、次の席の人が始めます。", "A 1 is wild and cannot be declared. You can declare up to the number of dice left on the table, and the person who lost the call starts the next round. When that person has no dice left, the next seat starts."]],
  },
  sayu: {
    turn: ["上の行に、誰の番かが表示されます。「振る」を押すか、トレーをタップすると、チップ1枚につきサイコロ1個、3個まで振ります。各サイコロの下に、チップがどこへ行ったかが書かれ、表には全員のチップとポットが出ます。チップのない人は、誰かから回ってくるまで飛ばされます。", "The line at the top says whose turn it is. Press \"Roll\" or tap the tray to roll one die per chip, up to three. Under each die it is written where the chip went, and the table shows everybody's chips and the pot. A person with no chips is skipped until one comes round from somebody."],
    house: ["サイコロは、ゲームが新しい乱数のシードから振り、すべての出目はゲームとともに保存されるので、ページを読み込み直しても、新しく振られることはありません。チップはこの1回のゲームの中にだけあります。全員が同じ数で始め、買うことも、持ち越すことも、XP、IP、星と交換することもできません。", "The dice are rolled by the game from a new random seed and every result is saved with the game, so reloading the page rolls nothing new. Chips exist only inside this one game. Everybody starts with the same number, and they cannot be bought, carried over or exchanged for XP, IP or stars."],
  },
} as const;
