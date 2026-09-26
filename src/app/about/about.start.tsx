import Link from "@/components/ui/Link";

import { FigureTable } from "@/components/about/FigureTable";
import { StepFlow } from "@/components/about/StepFlow";
import { ASK_FOR_INVITE_PATH } from "@/components/auth/askForInvite.constants";
import { GAME_FAMILIES } from "@/lib/gomoku/families";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { ACTIVE_GAME_LIMIT } from "@/lib/history/activeGames";
import { CONTACT_ADDRESS } from "@/lib/mail/mail.constants";
import { BOT_TIER_LIST } from "@/lib/gomoku/opponent.constants";

import { ABOUT_CHAPTERS } from "./about.chapters";
import type { AboutSection } from "./about.constants";
import { Inside, MailTo } from "./about.links";
import { SITE_PAGES } from "./about.pages";

/**
 * GETTING STARTED: what a game here is like from the first click to the
 * ladder, where everything lives, and what "beta" means for the reader.
 *
 * The rest of the page is history and reasons, and a newcomer had to read
 * three chapters of it to learn what they would actually do here. This chapter
 * answers that first, in pictures. The counts are read from the catalogue and
 * the open-or-not column from the gate itself (see `about.pages.ts`).
 */

const A_GAME = (
  <StepFlow
    label="The six steps of a game here, from choosing one to the ladder."
    steps={[
      {
        title: "Choose",
        kanji: "選ぶ",
        body: (
          <>
            {RULE_VARIANT_LIST.length} games in {GAME_FAMILIES.length} families, each with its rules on its own page.
          </>
        ),
      },
      {
        title: "Set up",
        kanji: "設定",
        body: <>The board’s size, the opening, rated or friendly, and who you are playing.</>,
      },
      {
        title: "Seat",
        kanji: "着席",
        body: (
          <>
            Send the other seat as a link or a QR code, pass one device across the table, or play one of the{" "}
            {BOT_TIER_LIST.length} graded computer players.
          </>
        ),
      },
      {
        title: "Play",
        kanji: "対局",
        body: <>Take turns at your own pace. The game waits, and the ones waiting on you are listed first.</>,
      },
      {
        title: "File",
        kanji: "棋譜",
        body: <>Every finished game goes into the record, replayable move by move.</>,
      },
      {
        title: "Climb",
        kanji: "番付",
        body: <>Rated games move your rating; every game you finish earns experience toward the next level.</>,
      },
    ]}
    caption={
      <>
        A game here, start to finish. Up to {ACTIVE_GAME_LIMIT} can be open at once against people, and as many
        as you like against the computer players; nothing about any of it is metered.
      </>
    }
  />
);

const WHERE_THINGS_ARE = (
  <FigureTable
    head={["Page", "What it is for", "Without an invite"]}
    rows={SITE_PAGES.map((page) => [
      <span key={page.path} className="whitespace-nowrap">
        <Link href={page.path} className="underline decoration-rule underline-offset-2">
          {page.name}
        </Link>{" "}
        <span className="font-mincho text-xs opacity-70">{page.kanji}</span>
      </span>,
      <span key={`${page.path}-what`} className="text-muted">
        {page.what}
      </span>,
      page.open ? "open to read" : "members",
    ])}
    caption={
      <>
        Where things are. Reading about the games is open to anybody; the people who play them, their records
        and the ladders are for members, because a player’s page carries their name and some of them are children.
      </>
    }
  />
);

/** The site as it stands: beta, free, invitation. Every row is a fact a reader can check by trying. */
const THE_TERMS = (
  <FigureTable
    head={["", "Itsutsu today"]}
    rows={[
      ["Stage", "Beta: open to members, still changing every week"],
      ["Price", "Free. No paid tier, no adverts, no cap on moves"],
      ["Getting in", "By invite code, from a member or from us"],
      ["Games", `${RULE_VARIANT_LIST.length}, all of them free to play`],
      ["Open at once", `up to ${ACTIVE_GAME_LIMIT} games against people; no limit against programs`],
      ["Computer players", `${BOT_TIER_LIST.length} graded, thinking in your own browser`],
    ]}
    caption={<>What you are signing up for. The game count and the limits are read from the site itself.</>}
  />
);

export const HOW_IT_WORKS_SECTION: AboutSection = {
  title: "How a game goes here",
  chapter: ABOUT_CHAPTERS.start,
  kanji: "一局の流れ",
  paragraphs: [
    <>
      Itsutsu is a place to play board games the slow way or the quick way, with people you know or with a
      program when nobody is around. Every game follows the same six steps, whichever of the{" "}
      {RULE_VARIANT_LIST.length} it is, because every one of them runs on one engine and one set of pages.
    </>,
    <>
      The other seat is the part that is different from most sites. You do not need to find your opponent in a
      lobby: you hand them the seat, as a link in a message or a QR code on your screen, and whoever opens it
      sits down. A game can also be played on one device passed across a table, which is how most of these games
      were played for most of their history. Either way the game is kept, so you can put your phone down after
      a move and pick it up tomorrow.
    </>,
    <>
      The site is laid out so that the games are open to anybody curious and the people are for members. You
      can read every game’s rules, its family, its background and the strategy guides without an account; the
      players, their records and the ladders need an invite.
    </>,
  ],
  figures: { 0: A_GAME, 2: WHERE_THINGS_ARE },
};

export const BETA_SECTION: AboutSection = {
  title: "In beta, free, and by invitation",
  chapter: ABOUT_CHAPTERS.start,
  kanji: "試験公開",
  paragraphs: [
    <>
      Itsutsu is in beta. That means it works and people play on it, and also that it changes every week: new
      games arrive, rules are tidied, pages move. It costs nothing and there is no paid tier waiting behind the
      free one. The sites this one grew from sold memberships to lift a cap on moves; here there is no cap to
      lift.
    </>,
    <>
      For now the door is by invitation. That keeps the site small while it is being built, and it keeps the
      players’ pages among people who were asked in. If you know somebody who plays here, ask them for a code. If
      you do not, <Inside href={ASK_FOR_INVITE_PATH}>ask for one on the join page</Inside> — a name, an address
      and a sentence about what you like to play is all it wants — or write to <MailTo address={CONTACT_ADDRESS} />.
    </>,
    <>
      We are also looking for beta testers: people who will play a lot of games, try the odd ones, and tell us
      when something is wrong, confusing or missing. A game whose rule seems off, a page that is slow on your
      phone, a game you wish were here — all of it is useful, and all of it reads better with the game’s name and
      what you expected. Say you want to test when you ask for your code, or write to the same address.
    </>,
  ],
  figures: { 0: THE_TERMS },
};
