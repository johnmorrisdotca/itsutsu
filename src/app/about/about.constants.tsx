import Link from "next/link";
import type { ReactNode } from "react";

import { HOGETSU, ORIGINS, OTHELLO_START, PENTE_CAPTURE, SOLVED } from "@/components/about/figures";
import { gamePath } from "@/lib/gomoku/slugs";
import { CONNECT_FOUR_SECTION, OPENINGS_SECTION, RATINGS_SECTION, SITES_SECTION } from "./about.more";

/** A link to a game’s own page, from prose. */
function Game({ variant, children }: { variant: string; children: ReactNode }) {
  return (
    <Link href={gamePath(variant)} className="font-medium text-ink underline underline-offset-4">
      {children}
    </Link>
  );
}

/** An outside site, opened in its own tab. */
function Out({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-ink underline underline-offset-4">
      {children}
    </a>
  );
}

export type AboutSection = {
  title: string;
  kanji: string;
  paragraphs: ReactNode[];
  /** A picture to print after the paragraph with that index. */
  figures?: Record<number, ReactNode>;
};

/**
 * The story of the site, in sections. Dates are given where they are settled
 * and hedged where the record is thin; a game that is a thousand years old
 * has a thousand years of people arguing about where it came from.
 */
const BASE_SECTIONS: AboutSection[] = [
  {
    title: "Where this comes from",
    kanji: "由来",
    paragraphs: [
      <>
        For years the founder of this site and his parents played across two households on the great
        turn-based sites of the early web — Othello with his father, more than anything, and five-in-a-row,
        Pente and Othello with his mother — on{" "}
        <Out href="https://www.itsyourturn.com/">ItsYourTurn</Out> and{" "}
        <Out href="https://www.goldtoken.com/">GoldToken</Out>. Not a move a day — sometimes hours a day.
        Dozens of games open at once between the same three people, each of them checking back every
        few minutes to see if it was their turn, and it usually was. The sites metered it: a free
        account got so many moves a day, twenty on one, a hundred on another, and the family bought the
        memberships to lift the cap, because twenty moves was not going to last until lunch. His father
        played on <Out href="https://www.littlegolem.net/">Little Golem</Out> as well, the connoisseur’s site,
        against strangers from everywhere; the founder never joined it, but it was part of the same household
        of games.
      </>,
      <>
        What those sites understood has been half-forgotten since. A game between people who love
        each other does not need to be fast, but it does need to be <em>kept</em>: the position always
        there when you come back, the list of games waiting on you, the record of who beat whom, and a
        ladder to climb. It is also a way of being in the same room while living in two houses. A move
        is a small message that says <em>I am here and I am thinking about you</em>, and a hundred of
        them in a day is a conversation.
      </>,
      <>
        Itsutsu is a continuation of that, and a tribute to it. It keeps what mattered — the game waits
        for you, your games are listed with the ones waiting on you first, every finished game is filed,
        the other seat is a link you can hand to anyone — and adds what the phone in your pocket makes
        possible: a QR code for the other chair, a board that warns you when you are in trouble, a hint
        when you want one. There is no cap on moves. Play a hundred.
      </>,
    ],
  },
  {
    title: "Five stones, and where they came from",
    kanji: "五つの石",
    paragraphs: [
      <>
        Five in a row is older than almost anything else people still play for fun. In Japan it is{" "}
        <span className="font-mincho">五目並べ</span>, <em>gomoku narabe</em>, and the earliest records of it there are from
        the Heian period, a thousand years ago, played on a go board with go stones because those were the board and
        stones a house had. Similar games are claimed for China earlier still. The rules fit on a fingernail —{" "}
        <Game variant="freestyle">five of your colour in a line wins</Game> — and that is exactly why it has lasted.
      </>,
      <>
        The trouble with a rule that simple is that the first player wins with correct play, and by the nineteenth century
        Japanese players knew it. The answer was <Game variant="renju">renju</Game>, <span className="font-mincho">連珠</span>,
        “a string of pearls” — the name was coined in 1899 by the journalist Kuroiwa Ruikō, who took it from a Buddhist
        phrase — which handicaps black with rules against double-threes, double-fours and overlines. Renju became a
        serious competitive game in Japan through the twentieth century; the Renju International Federation was founded
        in 1988 and the first Renju World Championship was held in Kyoto in 1989. It is still played there today.
      </>,
      <>
        Renju’s capturing cousin, <Game variant="ninuki">ninuki-renju</Game>, lets a pair of stones be taken by bracketing
        them, and it crossed the Pacific in an unlikely way: in 1977 Gary Gabrel, working at a restaurant in Stillwater,
        Oklahoma, turned it into <em>Pente</em>, which became one of the best-selling abstract games in America in the
        early 1980s. Pente is the game the founder and his mother played most, and the capture games here are drawn
        from the same well.
      </>,
      <>
        The line has kept growing. <Game variant="connect6">Connect6</Game> was invented in 2003 by Professor I-Chen Wu
        in Taiwan, with one change that undoes the first-player advantage entirely: after black’s single opening stone,
        every turn places two. <Game variant="tictactoe">Tic-tac-toe</Game> is the oldest of the family — three-in-a-row
        boards are scratched into Roman floors, where it was <em>terni lapilli</em> — and{" "}
        <Game variant="dropFour">Connect Four</Game>, the drop game, was published by Milton Bradley in 1974 and has been
        solved since 1988: the first player wins by starting in the middle column. The drop games here begin from that
        idea and wander off in eight directions.
      </>,
    ],
    figures: { 0: ORIGINS, 1: HOGETSU, 2: PENTE_CAPTURE },
  },
  {
    title: "The Japanese thread",
    kanji: "和",
    paragraphs: [
      <>
        The family is half Japanese, and the games came with the heritage. Five in a row, go, and
        Othello were played at home long before any of them were played through a screen, and the
        Japanese names beside the labels here are not decoration — they are what the games were called
        at the table. The name of the site is the number. <span className="font-mincho">五つ</span>,{" "}
        <em>itsutsu</em>, is simply “five”: the five stones in a row, and the five stones in the mark.
      </>,
      <>
        How the site looks follows from the equipment the games were played on for centuries: the
        ivory of a clamshell stone and the charcoal of slate, the honey of a kaya board, the washi of a
        printed record. The Japanese display type is a mincho face, the family a go book uses for its
        diagrams. Where a label has a Japanese name beside it, that name is the older one.
      </>,
      <>
        There is a design idea underneath as well, and it is a Japanese one: <span className="font-mincho">間</span>,{" "}
        <em>ma</em>, the space between things that gives them their shape. A board is mostly empty. A good position is
        read as much by where the stones are not as by where they are. The pages here try to leave room in the same way,
        and to say one thing at a time.
      </>,
    ],
  },
  {
    title: "Othello",
    kanji: "オセロ",
    paragraphs: [
      <>
        Othello was the game the founder and his father played, more than any other, for hours at a stretch,
        and got properly good at — and it is a Japanese game, which surprises people. Its ancestor, Reversi, was an English parlour game of the
        1880s, claimed by two rival inventors who argued about it in the letters pages. The game as the
        world plays it now — the fixed opening of four discs in the centre, the 8×8 board, the name from
        Shakespeare’s play about a Moor and a Venetian, black and white turning on each other — was set
        down by Goro Hasegawa in Japan and published there in 1973. Japan has produced most of the
        world champions since the first world championship in 1977, and the game’s one-line pitch,
        “a minute to learn, a lifetime to master,” is a Japanese slogan too.
      </>,
      <>
        Othello is the opposite of five in a row in one important way. In gomoku a stone is forever; in
        Othello nothing is yours until the end, and a board that is nearly all one colour on move fifty
        can belong to the other side on move sixty. Playing both for years teaches a kind of double
        vision: to see a position as a set of lines and as a set of edges and corners at the same time.
        It is on the board here now: <Game variant="reversi">Othello</Game> as the family played it, the
        older <Game variant="classicReversi">reversi</Game> with its free opening, an{" "}
        <Game variant="antiReversi">anti</Game> game where fewer discs wins, and a{" "}
        <Game variant="miniReversi">small board</Game> that can grow into the full one mid-game.
      </>,
      <>
        Othello also settles an old argument. Free gomoku was solved in 1993 and renju in 2001 — both wins
        for the first player, which is why renju’s handicaps exist — and the 6×6 Othello board was shown
        the same year to be a win for the <em>second</em>. The full board held out until 2023, when
        Hiroki Takizawa showed that perfect play from both sides is a draw: thirty-two discs each. No
        one will ever play it perfectly, which is the point.
      </>,
    ],
    figures: { 0: OTHELLO_START, 2: SOLVED },
  },
  {
    title: "Ladders, ratings and tournaments",
    kanji: "番付",
    paragraphs: [
      <>
        The turn-based sites ran on ladders. You challenged the player above you; a win swapped your places; the top of
        the list was the person nobody had beaten lately. It was a kind of rating without any arithmetic, and it made
        every game count for something beyond itself. Behind the arithmetic that came later stands Arpad Elo, a physics
        professor and chess master whose system the United States Chess Federation adopted in 1960 and the world
        federation in 1970. Nearly every rating you have ever seen on a games site is a descendant of it.
      </>,
      <>
        Five in a row has had its own championships for longer than most people expect. Renju’s world championship has
        run since 1989; a separate Gomoku World Championship has been held since 2009, and the two have been staged
        together since. The players at the top are mostly from Japan, China, Estonia, Russia and the Czech Republic, and
        the openings they use have names, the way chess openings do — several of them are offered here when you start a
        game.
      </>,
      <>
        On this site every finished game is filed in the <Link href="/history" className="font-medium text-ink underline underline-offset-4">record</Link>,
        and every named player has a rating and a tier on the{" "}
        <Link href="/players" className="font-medium text-ink underline underline-offset-4">players</Link> page that move
        with each result. Nobody is the top of a ladder yet. Somebody will be.
      </>,
    ],
  },
];

/** The story in reading order: origins, the openings and the solved game, the heritage, Othello, the numbers, the elders. */
export const ABOUT_SECTIONS: AboutSection[] = (() => {
  const after = (title: string, ...added: AboutSection[]) => {
    const at = BASE_SECTIONS.findIndex((section) => section.title === title);
    return at === -1 ? [] : added;
  };
  const out: AboutSection[] = [];
  for (const section of BASE_SECTIONS) {
    out.push(section);
    if (section.title === "Five stones, and where they came from") out.push(...after(section.title, OPENINGS_SECTION, CONNECT_FOUR_SECTION));
    if (section.title === "Ladders, ratings and tournaments") out.push(...after(section.title, RATINGS_SECTION));
  }
  out.push(SITES_SECTION);
  return out;
})();
