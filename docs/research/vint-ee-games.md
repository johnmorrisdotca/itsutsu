# The board games vint.ee has and Itsutsu lacks

John, 2026-09-24: note the board games vint.ee has that Itsutsu does not, for a
later look. Card games are out: "we don't need card games at the moment".

Row: `the-board-games-vint-ee-has-and-itsutsu-lacks-for-a-later-look`. This page
only lists the candidates. It builds nothing. A game taken from here goes
through the New Game Gate (AGENTS.md) like any other.

## What could be read, and what could not (checked 2026-09-25)

vint.ee answers every script with a Cloudflare challenge: HTTP 403 to a fetch,
2026-09-25, as on 2026-09-24. **The full list still has to be read in a browser
by a person**, and this page updated with the date. What is below comes from
the site's own pages as search engines index them. vint.ee describes itself as
"over 30 online games including chess, draughts, entropy, othello, pente, caro,
lines of action, online sudoku and several card games" (<https://www.vint.ee/>,
<https://www.vint.ee/en-gb/games/>, <https://www.vint.ee/en-gb/game-rules>).

## Games vint.ee names that Itsutsu already has

| vint.ee | Here |
|---|---|
| Gomoku, Renju, Caro | Gomoku, Renju, Caro |
| Pente | **Already covered.** The row said Pente was "a kept-record name here with no game", but that has changed. `GAME_ALIASES` in `src/lib/legacy/gameAliases.ts` now leads Pente to Ninuki, which is Pente's rules under the site's own name (Keryo and Pro Pente lead to Sannuki). |
| Othello | Reversi and its family |
| Draughts and checkers | Checkers, Pool, International, Brazilian, Russian, Canadian |
| Sudoku | Number Place, in the Numbers family |

## The candidates Itsutsu lacks

| Game | What it is | Where its rules come from, and whether they may be used | Would it suit a five-in-a-row site? |
|---|---|---|---|
| **Entropy** | Eric Solomon, 1977. Two players, Order and Chaos, on 5×5 (7×7 since 2000). Chaos places coloured chips drawn at random; Order slides one chip at a time to make palindromes along rows and columns, and scores for them. The players swap roles and compare scores. | Solomon's published rules, printed widely, for example by [Super Duper Games](https://superdupergames.org/rules/entropy.pdf) and the [CodeCup 2027 contest](https://www.codecup.nl/entropy/rules.php). In Canada and the US a game's rules are not copyright; the text of a rulebook is, so the rules page would be written in our own words. It is sold commercially as **Hyle** and Hyle7, so "Entropy" and "Hyle" should be checked as trade names before either is used (the Reversi and Othello question again, `RULES_ATTRIBUTION`). | **Yes, and closely.** It is lines on a grid, like five-in-a-row: one side builds patterns, the other breaks them. The random draw needs the seed the obstacle games already use. Two roles, played twice, is a match format that `MatchPanel` already knows. |
| **Lines of Action** | Claude Soucie, spread by Sid Sackson's *A Gamut of Games* (1969). 8×8, twelve pieces a side on the edges. A piece moves exactly as many squares as there are pieces on its line, jumps its own pieces, and captures by landing. The first to join all their pieces into one group wins. | Soucie's game, in Sackson's book, printed in rules sheets such as [Super Duper Games'](https://superdupergames.org/rules/loa.pdf). It has been played freely on many sites for decades ([Wikipedia](https://en.wikipedia.org/wiki/Lines_of_Action)). Our own words on the rules page, as for any game. The rule for a simultaneous connection changed between the two editions of the book (a draw, then a win for the mover), so the page has to say which one we play. | **Yes.** It is a sliding game on the squares, like the draughts family, so the engine's move-a-piece mechanics and the traditional view fit it. It is a connection game at heart, a cousin of Hex, which is here. |
| **Chess, and its variants** | The game itself, and whatever variants vint.ee lists (unread, see above). | The FIDE Laws of Chess. The rules are free to use, and the Laws' own text would not be copied. | **Not soon.** It is its own world: every piece moves differently, and it brings check, castling, en passant, promotion and a separate family of notations (PGN). It is a large engine, far more than a variant in `VARIANT_SPECS`. It is also the one game here with overwhelming free competition, so it would add the least that is Itsutsu's own. Worth a separate decision rather than a line on this list. |

## Next step

Somebody opens <https://www.vint.ee/en-gb/games/> in a browser, lists every
board game there under its own name with the date, and adds any missing
candidate to the table above. Entropy and Lines of Action are the two that fit
the site best, and either could become a board row with its rules page drafted
from the sources above.
