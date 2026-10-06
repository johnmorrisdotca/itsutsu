# Japanese terms for Itsutsu

Settled on 2026-10-06 by the `japanese-reviewer` pass over the first 179
drafted phrases (ENJA-01). Every later ticket's reviewer run reads this file
first, and a phrase that departs from it needs a reason written beside it.

Where a word is John's own and already published beside an English heading
(`ja.site.constants.ts`, and the kanji shown next to English headings
everywhere else), it stays, and the drafted phrases follow it. Where the site
already says the same thing two ways, the table says which one the drafted
phrases use.

## The words

| English | Japanese | Why (one line) |
| --- | --- | --- |
| a game between people (a match, a played game) | 対局 (counter 局) | It is the word a Go, shogi or gomoku player already says for one game played, and the site's own pages use it. |
| a game, as a thing in the catalogue (Gomoku, Hex) | ゲーム in the navigation; 種目 stays as the kanji beside English headings and in 全種目 | John, 2026-10-06: ゲーム for the link every page shows, because 種目 reads as "sports event"; his 全種目 heading on /games stays. |
| a game of any kind, in a sentence ("a new game was added") | ゲーム | Puzzles, cards and party tables are not 対局, and ゲーム is the plain word. |
| new game | 新規対局 | It is the heading of the set-up screen, so the button and the screen it opens say the same thing. |
| my games / in progress | 対局中 | It is the title John gave the "Your games" page. |
| play (a button, any kind of game) | 遊ぶ | It fits a puzzle or a card table as well as a board game. |
| play (a button that opens a board game's set-up) | 対局する | Only used on a catalogue card, which is always a two-person board game. |
| player | 対局者 | It is the Players page's own heading; never プレイヤー. |
| opponent | 対戦相手 | The one who sits across the board; 対局者 is already "player". |
| member | 会員 | It is the word the age notices and the site's account pages use; never メンバー. |
| buddy | 仲間 | It is John's word on the Players and My account pages. |
| people you know | 知人 | The set-up screen's own heading for them. |
| online now | オンライン中 | That is how a Japanese site says who is here; 在室 stays beside the English only. |
| bots, the computer | コンピュータ (対コンピュータ as a heading) | John, 2026-10-06: one word. 機械 (Players tab, the mark beside a bot's name) and 棋士 (About) become コンピュータ in ENJA-03. Never コンピューター. |
| board | 盤 (the position on it: 盤面) | The Go and gomoku word, and John's own on every rules page. |
| move | 手 (counter 手) | The word for a move in every board game it is played in. |
| resign | 投了 | The established word, already beside "Resign" on the site. |
| draw (the result) | 引き分け | Already beside "Draw" on the site; 互角 only for "evenly matched". |
| win / loss | 勝ち / 負け (連勝, 連敗 for runs) | 連勝 and 連敗 are the site's own streak words. |
| streak | 連続記録 | A bare 連続 is "in a row" and has no noun. |
| puzzle (and its counter) | パズル (counter 問) | ナンプレ and 数独 are names of puzzles, not the general word. |
| level | レベル | Used in every level phrase, so "next level" and "level" match. |
| level up | 昇級 (John's own word) | It is the kanji the toast has shown since 0.158.4; it keeps a Go or judo flavour. |
| XP | 経験値 | John's word on About and the XP page; the letters XP are a name only an English reader knows. |
| IP | IP (left as letters) | It is a short code, not an English word; decide with ENJA-09. |
| rating | レーティング | The word Japanese board-game sites use for a number that moves. |
| rated / friendly | レーティング対局 / 親善対局 | A game that moves ratings, and one played for its own sake. |
| ladder, leaderboard, standings | 順位表 | A plain word every reader knows; 番付 stays as John's name for the Players tab. |
| first place, "top" | 首位 | It is what a ladder's top place is called; 王冠 (crown) is not used in sentences. |
| family (of games) | 系統 | It is the Families view's own word; 同族 stays beside the English on a game's page. |
| opening (the rule for how a game starts) | 開局ルール | 開局 is the renju word for an opening; 布石 is Go's, and is not used for gomoku rules. |
| record (a game record, as in SGF) | 棋譜 | The established word, and John's. |
| record (a win-loss tally) | 戦績 | John's word on My account, and the tally is read as 勝ち–負け–引き分け. |
| rules | 規則 | John's word; ルール only inside a compound (開局ルール, 坂田ルール). |
| the feed | 近況 | Short, and it reads as "how things have been lately". |
| everyone (a filter or tab) | 全員 | It is the Players page's own word for the same filter; never みんな. |
| "last played" | 最終対局 | One word on every screen. |
| "you" in a sentence | left out where Japanese would leave it out | あなた is kept only where the sentence would lose its subject. |

## How a sentence is written

- Buttons, tabs and links are short noun or dictionary forms, with no です/ます (遊ぶ, 設定, 順位表 →).
- A sentence addressed to the reader is polite です/ます, plain and friendly.
- A line of activity or a score ("{name}に3連勝中") is a headline fragment: no ending 。.
- Full-width punctuation throughout: ：（）、。 and never a half-width `:` or `( )` next to Japanese.
- A count that is a game is 局, a move is 手, a person is 人, a puzzle is 問, a time away is 年 or か月.
- Placeholders such as `{game}` stay exactly as written, and a count sentence is checked at 0, 1 and many.

## Open for John

These are listed on the review sheet and are not settled by the reviewer.

Both were answered by John on 2026-10-06: ゲーム for the navigation link (全種目 stays), and コンピュータ as the one word for bots, applied in ENJA-03.
- **Native read for `rules.inspiredBy` and `feed.leadEveryone`.** One is a trademark notice and the other says that only members aged 18 or over are named: both are high-stakes, so the agent's pass is not enough.
