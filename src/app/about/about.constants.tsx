import Link from "next/link";
import type { ReactNode } from "react";

import { gamePath } from "@/lib/gomoku/slugs";

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
};

/**
 * The story of the site, in sections. Dates are given where they are settled
 * and hedged where the record is thin; a game that is a thousand years old
 * has a thousand years of people arguing about where it came from.
 */
export const ABOUT_SECTIONS: AboutSection[] = [
  {
    title: "Where this comes from",
    kanji: "由来",
    paragraphs: [
      <>
        For years the founder of this site played five-in-a-row, Pente and their cousins with his mother
        and father on two of the great turn-based sites of the early web: <Out href="https://www.itsyourturn.com/">ItsYourTurn</Out> and{" "}
        <Out href="https://www.goldtoken.com/">GoldToken</Out>. A move a day, sometimes a move a week. A game that ran for a
        month across three houses and two time zones, with a note attached to every stone. Those sites understood something
        that has been half-forgotten since: a board game between people who love each other does not need to be fast.
        It needs to be <em>kept</em> — the position always there when you come back, the record of who played what, and a
        quiet ladder to climb.
      </>,
      <>
        Itsutsu is a continuation of that, and a tribute to it. It keeps what mattered — the game waits for you, every
        finished game is filed, the other seat is a link you can hand to anyone — and adds what the phone in your pocket
        makes possible: a QR code for the other chair, a board that warns you when you are in trouble, a hint when you
        want one. The pace is still yours.
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
        early 1980s. Pente is the game the founder’s family played most, and the capture games here are drawn from the
        same well.
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
  },
  {
    title: "The Japanese thread",
    kanji: "和",
    paragraphs: [
      <>
        The name is the number. <span className="font-mincho">五つ</span>, <em>itsutsu</em>, is simply “five” — the five
        stones in a row, and the five stones in the mark. Everything about how the site looks follows from the equipment
        the game was played on for centuries: the ivory of a clamshell stone and the charcoal of slate, the honey of a
        kaya board, the washi of a printed record. The Japanese display type is a mincho face, the family a go book uses
        for its diagrams. Where a label has a Japanese name beside it, that name is the older one.
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
  {
    title: "Sites worth knowing",
    kanji: "先達",
    paragraphs: [
      <>
        These are the places this one learned from, and they are still there.{" "}
        <Out href="https://www.itsyourturn.com/">ItsYourTurn</Out> has run turn-based games by email since the late 1990s
        and is where the founder’s family played for years. <Out href="https://www.goldtoken.com/">GoldToken</Out> came
        soon after with a larger catalogue, tournaments and a community that felt like a club.{" "}
        <Out href="https://www.littlegolem.net/">Little Golem</Out> is the connoisseur’s turn-based site — Hex, Go,
        gomoku and dozens of abstracts, with championships that some of the world’s strongest players enter.{" "}
        <Out href="https://pente.org/">Pente.org</Out> has kept ranked Pente alive online for decades, and{" "}
        <Out href="https://www.playok.com/">PlayOK</Out> — many still call it Kurnik — is where you go for a live game
        of gomoku against a stranger at two in the morning.
      </>,
      <>
        If you have a code, the door is <Link href="/join" className="font-medium text-ink underline underline-offset-4">here</Link>.
        If you do not, the <Link href="/rules" className="font-medium text-ink underline underline-offset-4">rules</Link> and
        the <Link href="/learn" className="font-medium text-ink underline underline-offset-4">learning shelf</Link> are open
        to everyone.
      </>,
    ],
  },
];
