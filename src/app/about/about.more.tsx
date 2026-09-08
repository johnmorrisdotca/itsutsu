import Link from "next/link";
import type { ReactNode } from "react";

import { Diagram } from "@/components/about/Diagram";
import { EloCurve } from "@/components/about/EloCurve";
import { gamePath } from "@/lib/gomoku/slugs";
import type { AboutSection } from "./about.constants";

function Out({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-ink underline underline-offset-4">
      {children}
    </a>
  );
}

const TH = "px-3 py-1.5 text-left text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase";
const TD = "px-3 py-1.5 align-top";

function Table({ head, rows, caption }: { head: string[]; rows: ReactNode[][]; caption: ReactNode }) {
  return (
    <figure className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-lg border border-rule">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {head.map((cell, i) => (
                <th key={i} className={TH}>
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-rule">
                {row.map((cell, j) => (
                  <td key={j} className={`${TD} ${j > 0 && typeof cell === "number" ? "font-mono tabular-nums" : ""}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="text-xs leading-relaxed text-muted">{caption}</figcaption>
    </figure>
  );
}

/** 花月, the direct opening: white beside black, black's third stone on the diagonal. */
const KAGETSU = (
  <Diagram
    rows={9}
    cols={9}
    grid="lines"
    label="Three stones in the centre of a renju board: black, white directly beside it, and black above the white stone, on the diagonal from its own first."
    stones={[
      { row: 4, col: 4, colour: "black", label: "1" },
      { row: 4, col: 5, colour: "white", label: "2" },
      { row: 3, col: 5, colour: "black", label: "3" },
    ]}
    caption={
      <>
        <span className="font-mincho">花月</span> <em>Kagetsu</em>, “flower moon”, the strongest of the direct
        openings. With <span className="font-mincho">浦月</span> <em>Hogetsu</em> it is the pair every renju rule set
        has had to tame.
      </>
    }
  />
);

/** Connect Four: the first player's winning first move, and a game a few stones in. */
const CONNECT_FOUR = (
  <Diagram
    rows={6}
    cols={7}
    grid="cells"
    label="A Connect Four grid of seven columns and six rows, with the first black disc in the bottom of the middle column and a few more discs stacked around it."
    stones={[
      { row: 5, col: 3, colour: "black", label: "1", ring: true },
      { row: 5, col: 2, colour: "white", label: "2" },
      { row: 4, col: 3, colour: "black", label: "3" },
      { row: 5, col: 4, colour: "white", label: "4" },
      { row: 3, col: 3, colour: "black", label: "5" },
      { row: 2, col: 3, colour: "white", label: "6" },
    ]}
    caption={
      <>
        The only winning first move. Dropped in the middle column, the first player wins with perfect play by the
        forty-first move; dropped beside it, the game is a draw; dropped anywhere else, the second player wins.
      </>
    }
  />
);

const OPENINGS = (
  <Table
    head={["Direct 直接", "", "Indirect 間接", ""]}
    rows={[
      ["寒星", "Kansei", "長星", "Chōsei"],
      ["溪月", "Keigetsu", "峡月", "Kyōgetsu"],
      ["疎星", "Sosei", "恒星", "Kōsei"],
      ["花月", "Kagetsu", "水月", "Suigetsu"],
      ["残月", "Zangetsu", "流星", "Ryūsei"],
      ["雨月", "Ugetsu", "雲月", "Ungetsu"],
      ["金星", "Kinsei", "浦月", "Hogetsu"],
      ["松月", "Shōgetsu", "嵐月", "Rangetsu"],
      ["丘月", "Kyūgetsu", "銀月", "Gingetsu"],
      ["新月", "Shingetsu", "明星", "Myōjō"],
      ["瑞星", "Zuisei", "斜月", "Shagetsu"],
      ["山月", "Sangetsu", "名月", "Meigetsu"],
      ["遊星", "Yūsei", "彗星", "Suisei"],
    ]}
    caption={
      <>
        The twenty-six renju openings, thirteen with white’s second stone directly beside black’s and thirteen with it
        on the diagonal. Every one is named for a moon (月) or a star (星); the names are the third stone’s position.
      </>
    }
  />
);

const LADDER = (
  <Table
    head={["Player", "Rating", "Games", "Tier", "W", "L", "D"]}
    rows={[
      ["Mio", 1712, 31, "Established 確定", 20, 9, 2],
      ["Kai", 1655, 24, "Established 確定", 14, 8, 2],
      ["Hana", 1608, 9, "Provisional 暫定", 5, 4, 0],
      ["Ren", 1560, 12, "Provisional 暫定", 4, 7, 1],
      ["Sora", "–", 2, "Unrated 未定", 1, 1, 0],
    ]}
    caption={
      <>
        What a ladder looks like here, with made-up names. Everyone starts at 1600. Fewer than four rated games shows
        a dash; the number settles over the next sixteen while K is high; after twenty it moves slowly.
      </>
    }
  />
);

const SITES = (
  <Table
    head={["Site", "Since", "Games", "Free", "Paid", "Ratings"]}
    rows={[
      [<Out key="iyt" href="https://www.itsyourturn.com/">ItsYourTurn</Out>, "1998", "about 40, with variants", "a daily cap on moves", "unlimited moves, tournaments, more games", "a number per game type"],
      [<Out key="gt" href="https://www.goldtoken.com/">GoldToken</Out>, "about 2000", "over 60, with variants", "a cap on open games and moves", "more open games, tournaments, ladders", "ratings and tokens"],
      [<Out key="lg" href="https://www.littlegolem.net/">Little Golem</Out>, "2002", "over 30 abstracts, many variants", "everything", "none; donations", "Elo-style, per game, monthly championships"],
      [<Out key="pente" href="https://pente.org/">Pente.org</Out>, "about 2000", "Pente and its variants", "everything", "membership, optional", "ratings, tournaments, a world championship"],
      [<Out key="playok" href="https://www.playok.com/">PlayOK</Out>, "2001", "over 30 live games", "everything", "none", "Elo per game"],
    ]}
    caption={
      <>
        From the sites’ own pages and long memory; the exact caps and prices change, and the sites are the authority.
        Itsutsu: about 35 games, everything free, no cap on moves, ratings per game and a ladder overall.
      </>
    }
  />
);

/** The sections added after the founding story: the numbers, the openings, the drop game, and the elders. */
export const RATINGS_SECTION: AboutSection = {
  title: "Ratings, in numbers",
  kanji: "点数",
  paragraphs: [
    <>
      The ladder here is Elo, the system Arpad Elo built for chess in 1960 and FIDE adopted in 1970. Its whole idea
      fits in a line: a rating is a prediction. If your rating is <em>R</em> and your opponent’s is <em>R′</em>, the
      score Elo expects you to make is <span className="font-mono">E = 1 / (1 + 10^((R′ − R) / 400))</span>, so that a
      four-hundred-point gap means ten to one. After the game your rating moves by{" "}
      <span className="font-mono">K × (S − E)</span>, where <em>S</em> is what you actually scored — one for a win, a
      half for a draw, nothing for a loss — and <em>K</em> is how fast the number is allowed to move.
    </>,
    <>
      Here K is 40 for a player’s first twenty rated games and 20 after that, which is roughly what FIDE does for
      newcomers. Everyone starts at 1600. A player is <em>unrated</em> until four rated games are in — the number
      exists, but the page shows a dash, because a rating computed from three games is a coin toss with decimals —{" "}
      <em>provisional</em> until twenty, and <em>established</em> after. The site keeps one rating across all games,
      for the ladder, and one for each game you play, because a renju player and a Pente player are not the same
      player.
    </>,
    <>
      Most of the sites this one grew from keep a number per game type in the same spirit. FIDE and the US Chess
      Federation still use Elo itself; Lichess and Chess.com use its descendants, Glicko and Glicko-2, which add a
      measure of how sure the number is; Go in Europe uses an Elo variant with a kyu and dan scale on top; Little
      Golem, PlayOK and ItsYourTurn each keep an Elo-style rating for every game they offer. The dash you see beside
      a new name here is the honest version of what those sites show as a question mark.
    </>,
  ],
  figures: { 0: <EloCurve />, 1: LADDER },
};

export const OPENINGS_SECTION: AboutSection = {
  title: "Famous openings",
  kanji: "定石",
  paragraphs: [
    <>
      Renju is the one game in the family with a canon of named openings, and the names are a small poem. White’s
      second stone goes either directly beside black’s first — a <em>direct</em> opening — or on the diagonal from it,
      an <em>indirect</em> one, and black’s third stone then lands on one of thirteen squares in each case — twenty-six openings, each named for
      a moon or a star. Two of them, <span className="font-mincho">花月</span> Kagetsu and{" "}
      <span className="font-mincho">浦月</span> Hogetsu, are so strong for black that the modern tournament rules
      exist largely to blunt them: under the rule used at world championships since 2017, called Soosõrv-8 after the
      Estonian player who proposed it, the first player names the opening and the second may swap seats, and the
      fifth move is offered as a choice of several, so that neither side can steer into a known win.
    </>,
    <>
      The world championship has been held every two years since Kyoto in 1989, and the winners have come from Japan,
      Russia, Estonia, China and Taiwan in turn. In the current era China’s Qi Guan has won it more than once, with
      the strongest challenges coming from Russia and Estonia, and the games are published move by move by the Renju
      International Federation. The openings that decide those games are almost all indirect ones — Hogetsu and its
      neighbours — because a direct opening that is not Kagetsu gives white too easy a game. The Learn shelf here has
      a <Link href="/learn/renju" className="font-medium text-ink underline underline-offset-4">renju guide</Link>{" "}
      with the shapes that come out of them, and the <Link href={gamePath("renju")} className="font-medium text-ink underline underline-offset-4">renju board</Link> plays with the same three forbidden shapes.
    </>,
    <>
      Pente has its own championship. Parker Brothers ran a national tournament in the game’s first boom in the
      early 1980s, and since the turn of the century <Out href="https://pente.org/">Pente.org</Out> has crowned an
      online world champion most years, with a ladder that has been running for two decades. Pente openings are not
      named, but there is one rule with a name: in tournament play black’s second stone must be at least three
      intersections from the centre, the <em>tournament rule</em>, which does for Pente what the swap does for renju.
      The <Link href={gamePath("ninuki")} className="font-medium text-ink underline underline-offset-4">capture games</Link> here
      offer it as the <em>Pro</em> opening in their set-up: first stone in the centre, black’s second outside the
      central 5×5.
    </>,
  ],
  figures: { 0: KAGETSU, 1: OPENINGS },
};

export const CONNECT_FOUR_SECTION: AboutSection = {
  title: "Connect Four, solved",
  kanji: "四目落とし",
  paragraphs: [
    <>
      Connect Four is the game in this family that a computer finished first. Milton Bradley published it in 1974; in
      October 1988 James Allen announced, on a Usenet newsgroup, that the first player wins, and two weeks later
      Victor Allis proved the same thing independently in his master’s thesis at the Vrije Universiteit Amsterdam,
      with a program built from nine rules of thumb rather than a search. The board has 4,531,985,219,092 legal
      positions. The result is exact: start in the middle column and the first player wins; start in the columns
      beside it and it is a draw; start anywhere else and the second player wins with correct play. John Tromp later
      computed the value of every opening position, and you can look any of them up.
    </>,
    <>
      None of that makes it an easy game for a person, which is where the hustlers come in. For a few years now the
      parks and squares of New York — Washington Square, Union Square, the Times Square pavements — have had a small
      trade in Connect Four played for money against passers-by, a regular of the game against anyone who fancies
      their chances, and the footage has travelled everywhere: the regulars win almost every game, sometimes while
      talking to someone else, because they have memorised the threats the way a chess player knows an opening. The
      children in the clips are the part people remember — a child of six or seven who has learned the pattern of
      “odd threats” beats an adult who has not, every time, and the game is short enough that a crowd gathers. That
      is the whole lesson of a solved game: it is not that the answer is known, it is that the answer can be learned.
      The <Link href={gamePath("dropFour")} className="font-medium text-ink underline underline-offset-4">drop games</Link>{" "}
      here begin from the standard board and wander off in eight directions, none of them solved.
    </>,
  ],
  figures: { 0: CONNECT_FOUR },
};

export const SITES_SECTION: AboutSection = {
  title: "Sites worth knowing",
  kanji: "先達",
  paragraphs: [
    <>
      These are the places this one learned from, and they are still there.{" "}
      <Out href="https://www.itsyourturn.com/">ItsYourTurn</Out> has run turn-based games by email since 1998, from
      the first years of the web, and is where the founder’s family played for years. Its shape is the shape of this
      site: a list of games waiting on you, a list waiting on them, invitations, and a record. A free account is
      capped at a number of moves a day, which is why the family bought the membership; the paid tier lifts the cap
      and opens tournaments and the rarer games. Its catalogue is about forty games with variants, and it keeps a
      rating per game type.
    </>,
    <>
      <Out href="https://www.goldtoken.com/">GoldToken</Out> came soon after, around 2000, with a larger catalogue —
      over sixty games and their variants — and a community that felt like a club: tokens earned for playing,
      ladders, tournaments, a forum. The free account limits how many games you may have open at once; membership
      lifts that and adds more. It was the other half of the family’s evenings.{" "}
      <Out href="https://www.littlegolem.net/">Little Golem</Out>, started in 2002 by Richard Malaschitz in
      Slovakia, is the connoisseur’s site: Hex, Go, gomoku, Amazons, Twixt and dozens of other abstracts, many in
      several variants, monthly championships in each, an Elo-style rating for each, and no paid tier at all — it
      runs on donations. Some of the strongest players in the world of several of those games enter its
      championships, and the founder’s father played there for years.
    </>,
    <>
      <Out href="https://pente.org/">Pente.org</Out> has kept ranked Pente alive online for two decades, with the
      tournament rule, several variants of its own, a ladder and a world championship, and membership optional.{" "}
      <Out href="https://www.playok.com/">PlayOK</Out> — many still call it Kurnik, the name Marek Futrega gave it
      when he started it in Poland in 2001 — is where you go for a live game of gomoku against a stranger at two in
      the morning, with an Elo rating per game and rooms that never seem to empty. Membership numbers are the one
      thing none of these sites publish plainly; each has had tens of thousands of registered players at its peak,
      and each has a hard core that has been there for twenty years.
    </>,
    <>
      If you have a code, the door is <Link href="/join" className="font-medium text-ink underline underline-offset-4">here</Link>.
      If you do not, the <Link href="/rules" className="font-medium text-ink underline underline-offset-4">rules</Link> and
      the <Link href="/learn" className="font-medium text-ink underline underline-offset-4">learning shelf</Link> are open
      to everyone.
    </>,
  ],
  figures: { 2: SITES },
};
