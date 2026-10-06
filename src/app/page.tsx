import Link from "@/components/ui/Link";

import { BrandStones } from "@/components/layout/BrandMarks";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS, SECTION_HEADING } from "@/components/ui/ui.constants";
import { GameCount } from "@/components/games/GameCount";
import { HomeBeta } from "@/components/home/HomeBeta";
import { HomeFamilies } from "@/components/home/HomeFamilies";
import { HomeStart } from "@/components/home/HomeStart";
import { ASK_FOR_INVITE_PATH } from "@/components/auth/askForInvite.constants";
import { currentReader } from "@/lib/auth/currentReader";
import { FEED_PATH } from "@/lib/feed/feed.constants";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import type { Speaker } from "@/lib/i18n/i18n";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";
import { SITE_NAME } from "@/lib/i18n/siteName";
import { weave } from "@/lib/i18n/weave";
import { siteNumbers } from "@/lib/site/siteNumbers";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { GUIDES } from "@/lib/learn/strategy";
import { EVERY_KIND_KEY } from "@/lib/catalogue/gameKeys";

/**
 * What the site offers, a card each: the games, how they are played, and what is kept. The eight things the site offers: each a heading and a paragraph, as phrases. The count of games in the first is read
 * off the same list the catalogue counts from (`RULE_VARIANT_LIST`), never written down here a second time. This page
 * once spelled out a number in plain words while /games/list computed a different one from the same catalogue,
 * because prose does not know when a game is added. The count of guides in the last is read from the shelf, like it.
 */
const PITCH = [
  { title: "home.fiveTitle", kanji: "五目", body: "home.fiveBody" },
  { title: "home.phonesTitle", kanji: "通信対局", body: "home.phonesBody" },
  { title: "home.keptTitle", kanji: "棋譜", body: "home.keptBody" },
  { title: "home.forkTitle", kanji: "分岐", body: "home.forkBody" },
  { title: "home.opponentsTitle", kanji: "対戦相手", body: "home.opponentsBody" },
  { title: "home.ladderTitle", kanji: "番付", body: "home.ladderBody" },
  { title: "home.paceTitle", kanji: "手番", body: "home.paceBody" },
  { title: "home.learnTitle", kanji: "定石", body: "home.learn" },
] as const satisfies readonly { title: PhraseKey; kanji: string; body: string }[];

/** A card's paragraph. Two of them carry a count read from the catalogue: the games, and the guides on the shelf. */
function pitchBody(body: (typeof PITCH)[number]["body"], say: Speaker): string {
  if (body === "home.fiveBody") return say.say(body, { count: say.number(RULE_VARIANT_LIST.length) });
  if (body === "home.learn") return say.count(body, GUIDES.length);
  return say.say(body);
}

export default async function Home() {
  // The header has already asked; the member row behind it is cached for the
  // request, so asking again here reads no more than the cookie.
  const [reader, numbers, say] = await Promise.all([currentReader(), siteNumbers(), currentSpeaker()]);
  const story = say.pair("home.storyTitle", "由来");
  return (
    <Page>
      <SiteHeader hero />

      <section className="flex flex-col items-center gap-5 text-center" data-testid="front-door">
        <h1 className="text-2xl font-semibold sm:text-3xl">{say.say("home.hero")}</h1>
        {/*
          The whole catalogue, counted from the list /games draws, and the
          count leads to that list: it counted only the board games for two long after
          puzzles, party games and cards arrived, because a sentence does not
          know when a game is added.
        */}
        <p className="text-sm text-muted sm:text-base" data-testid="front-catalogue">
          {weave(say.say("home.catalogue"), {
            count: (
              <Link href="/games/list" className="underline underline-offset-4" data-testid="front-catalogue-count">
                {say.count("count.gameKind", EVERY_KIND_KEY.length)}
              </Link>
            ),
          })}
        </p>
        {/*
          THREE NUMBERS, the way Pente.org prints them (John, 2026-09-16) —
          said as what they are: an early release, by invitation, so a small
          count reads as a place not open yet rather than one people left.
          People only, and the games number links to exactly those games; see
          `siteNumbers.ts`.
        */}
        <p className="text-xs text-muted" data-testid="site-numbers">
          {weave(say.say("home.numbers", { site: SITE_NAME }), {
            players: (
              <Link href="/players" className="underline underline-offset-4" data-testid="site-numbers-players">
                {say.count("count.player", numbers.players)}
              </Link>
            ),
            games: <GameCount count={say.count("count.gamePlayed", numbers.games)} pool="people" testId="site-numbers-games" />,
            here: say.say("home.hereNow", { count: say.number(numbers.hereNow) }),
          })}
          {!reader.signedIn && (
            <>
              {/* The gap between two sentences in the reader's language: a space in English, none in Japanese. */}
              {say.sentences(["", ""])}
              <a href="#beta" className="underline underline-offset-4" data-testid="site-numbers-beta">
                {say.say("home.numbersAsk")}
              </a>
              {say.sentence("")}
            </>
          )}
        </p>
        {/*
          ONLY WHAT THE HEADER DOES NOT ALREADY OFFER. The hero carried Play,
          New game and Games, the same three places as the header right above
          it; John, 2026-09-29: "Home page seems to have redundant buttons?",
          then "remove dedenant. redesign it slightly yes." What is left is what
          only this page leads to: the door for somebody outside, the guides,
          and a member's own feed. The games themselves are the families just
          below.
        */}
        <div className="flex flex-wrap justify-center gap-3" data-testid="front-door-ways">
          {reader.signedIn ? null : (
            <Link href={ASK_FOR_INVITE_PATH} className={`${BUTTON_BASE} ${BUTTON_STRONG} px-5 py-2 text-base`} data-testid="enter-ask">
              {say.say("home.askInvite")}
            </Link>
          )}
          <Link href="/learn" className={`${BUTTON_BASE} ${BUTTON_QUIET} px-5 py-2 text-base`} data-testid="enter-learn">
            {say.say("home.learnGames")}
          </Link>
          {/*
            A member's own feed: what they and their buddies have been doing.
            Only for somebody with an account, since it names people and the
            gate keeps it from a stranger anyway.
          */}
          {reader.memberId !== null ? (
            <Link href={FEED_PATH} className={`${BUTTON_BASE} ${BUTTON_QUIET} px-5 py-2 text-base`} data-testid="enter-feed">
              {say.say("feed.homeLink")}
            </Link>
          ) : null}
        </div>
      </section>

      {/* The games, straight after: where the hero's Games button used to send a reader. */}
      <HomeFamilies />

      <BrandStones className="opacity-80" />

      <section className="grid gap-4 md:grid-cols-2">
        {PITCH.map((item) => {
          const title = say.pair(item.title, item.kanji);
          return (
            <div key={item.title} className={`${PANEL_CLASS} flex flex-col gap-2`}>
              <h2 className={SECTION_HEADING}>
                {title.text}
                {title.kanji === null ? null : <span className="font-mincho text-xs font-normal opacity-70">{title.kanji}</span>}
              </h2>
              <p className="text-sm text-muted">{pitchBody(item.body, say)}</p>
            </div>
          );
        })}
      </section>

      <HomeBeta signedIn={reader.signedIn} />

      <HomeStart signedIn={reader.signedIn} />

      <section className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="front-story">
        <h2 className={SECTION_HEADING}>
          {story.text}
          {story.kanji === null ? null : <span className="font-mincho text-xs font-normal opacity-70">{story.kanji}</span>}
        </h2>
        <p className="text-sm leading-relaxed text-ink-soft">{say.say("home.story.one", { site: SITE_NAME })}</p>
        <p className="text-sm leading-relaxed text-ink-soft">
          {weave(say.say("home.story.two"), { kanji: <span className="font-mincho">五つ</span> })}
        </p>
        <p className="text-sm">
          <Link href="/about" className="font-medium underline underline-offset-4" data-testid="read-story">
            {say.say("home.story.read")}
          </Link>
        </p>
      </section>

      {/*
        The door, for somebody standing outside it. A member already in was
        being told the site is by invitation and asked for a code they had
        already used.
      */}
      {!reader.signedIn && (
        <footer className="border-t border-rule pt-5 text-xs text-muted" data-testid="invite-line">
          {weave(say.say("home.door", { site: SITE_NAME }), {
            kanji: <span className="font-mincho">五つ</span>,
            enter: (
              <Link href="/join" className="underline underline-offset-4">
                {say.say("home.doorEnter")}
              </Link>
            ),
            ask: (
              <Link href={ASK_FOR_INVITE_PATH} className="underline underline-offset-4" data-testid="invite-line-ask">
                {say.say("home.doorAsk")}
              </Link>
            ),
          })}
        </footer>
      )}
    </Page>
  );
}
