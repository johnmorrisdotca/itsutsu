import { MeasuredGrades } from "@/components/about/MeasuredGrades";
import { FigureTable as Table } from "@/components/about/FigureTable";
import { BOT_PROFILES, BOT_TIER_LIST, SEARCH } from "@/lib/gomoku/opponent.constants";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";

import { Game, Inside } from "./about.links";
import type { AboutSection } from "./about.constants";

/**
 * HOW THE COMPUTER PLAYERS ACTUALLY WORK, told the way the rest of this page
 * tells things: what it does, what it cost, and what turned out not to be true.
 *
 * The finding in the last paragraph is the reason the section is worth having.
 * A site with five graded opponents is claiming five different strengths, and
 * two of ours measured as one player. Saying so is a better advertisement for
 * the measuring than any of the numbers above it, and a reader who has beaten
 * 名人 and is wondering whether 国手 is worth the trouble deserves the real
 * answer rather than the one the ladder implies.
 */

const GRADES = (
  <Table
    /*
     * Read out of the same rows the opponent chooser draws from, so a grade
     * reworded there is reworded here. A second description of a player is a
     * second thing to keep true.
     */
    head={["Grade", "Strength", "What it does at the board"]}
    rows={BOT_TIER_LIST.map((tier) => {
      const profile = BOT_PROFILES[tier];
      return [
        <span key={tier} className="whitespace-nowrap">
          {profile.name} <span className="font-mincho text-xs opacity-70">{profile.native}</span>
        </span>,
        profile.strength,
        <span key={`${tier}-note`} className="text-muted">
          {profile.blurb}
        </span>,
      ];
    })}
    caption={
      <>
        The five graded players, gentlest first. They are members like anybody else: games against them are
        rated, their own records are kept, and they earn experience from their games on the same terms a person
        does — everything except the things only a person can do, like adding a buddy or setting a profile.
      </>
    }
  />
);

export const BOTS_SECTION: AboutSection = {
  title: "The players that are not people",
  kanji: "棋力",
  paragraphs: [
    <>
      There is always somebody to play here, because five of the players are programs. They are not five
      programs: they are one, given five budgets. The same code plays every one of the{" "}
      {RULE_VARIANT_LIST.length} games on the site, and it does that by never knowing which game it is playing —
      it asks the rules what a legal move is, the same way the board does, and everything it knows about five in
      a row it also applies to a game of draughts it has never heard of. Two specialists sit beside the five and
      do the opposite: one plays only <Game variant="reversi">Othello</Game> and reads it the way an Othello
      player does, corners first and discs last of all.
    </>,
    <>
      A move is a search: try a move, try every sensible reply, try every reply to that, and keep the line that
      turns out worst for the opponent. The trouble is that the tree is bottomless, so the real question is
      never how deep to go — it is what to spend. Each move is given{" "}
      <span className="font-mono">{SEARCH.millis}</span> milliseconds of wall clock and deepens until they are
      gone, which means running out of time costs it a move of foresight rather than an answer. A budget counted
      in positions instead of milliseconds cannot do that job: the same number of positions is a tenth of a
      second on one board and three minutes on another, and the player would be brilliant at draughts and
      unusable at gomoku without anything in the code saying so.
    </>,
    <>
      What the {SEARCH.millis} milliseconds are spent on was the expensive lesson. Judging a position in the
      line games means laying a stone and looking for every five it could still become — a few hundred small
      searches, about a millisecond. Doing that at every node of the tree is not a slower search; it is not a
      search at all. Measured, it took a hundred and ninety-five seconds to produce one move on a fifteen by
      fifteen board. It is now spent once, at the top, over the best{" "}
      <span className="font-mono">{SEARCH.rootReading}</span> moves the cheap judgement can find, and the tree
      below it is read with the cheap one. Almost all of the difference between a program that answers in half a
      second and one that answers in three minutes is of that kind: not a cleverer idea, a decision about where
      an expensive idea is affordable.
    </>,
    <>
      And it thinks in your browser. The computer’s move is worked out on the device you are reading this on,
      not on a server — which is why there can be five of them, always available, with no cap on how many games
      you have open against them, and why it costs this site nothing when you play one at two in the morning. A
      games site that thinks on its own hardware has to meter you eventually. This one does not have that
      problem to solve.
    </>,
    <>
      None of that says whether the ladder is in the right order, so the grades were made to play each other:
      every grade against every other, twenty games a pairing with the colours alternating, at the budget a real
      move gets. The result is on each one’s own page, game by game, and it is honest in a way a single label
      cannot be — a program can be genuinely better at five in a row than at Othello, and one name for both is
      what misleads. The figures below are the whole round robin added up.
    </>,
    <>
      It found something worth publishing: <em>the top two grades are the same player</em>. Played against
      each other, 名人 and 国手 finished seven wins to thirteen at Othello and three to six with eleven draws
      at draughts — both of which look like results and neither of which is — over that many games between equals, a coin does as well about
      a quarter and about half of the time. So the table says level rather than pretending, and the difference
      between those two names only appears at roughly ten times the thinking, which no move on this site gets.
      What twenty games shows plainly is the other end: 段 did not win a single game against 名人. And the
      site’s own flagship is missing from the figures entirely — a round robin at{" "}
      <Game variant="freestyle">gomoku</Game> ran for over an hour without finishing, so there is no row for it,
      and no row is what a page shows when it does not know. You can meet any of them from{" "}
      <Inside href="/players?view=computers">the players page</Inside>.
    </>,
  ],
  figures: { 0: GRADES, 4: <MeasuredGrades /> },
};
