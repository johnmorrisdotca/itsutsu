import type { PhraseKey } from "@/lib/i18n/i18n.constants";

import { FEED_KINDS, FEED_OUTCOMES } from "./feed.constants";
import type { FeedEntry, FeedNewsEntry } from "./feed.types";
import { SITE_NEWS } from "./siteNews.constants";

/**
 * WHICH SENTENCE A LINE IS SAID IN.
 *
 * Every key written out whole, never assembled as `feed.${kind}.you`: the
 * catalogue's coverage test finds a phrase by its literal key, and a key built
 * at run time is a phrase it would call unused. `rivalryWords.ts` keeps the
 * same rule for the same reason.
 *
 * "You" and a name are two sentences rather than one with the subject filled
 * in, because a language does not conjugate "you" and "Hanako" alike.
 */
export function entryPhrase(entry: FeedEntry): PhraseKey {
  const you = entry.you;
  switch (entry.kind) {
    case FEED_KINDS.game:
      if (entry.outcome === FEED_OUTCOMES.won) return you ? "feed.won.you" : "feed.won.named";
      if (entry.outcome === FEED_OUTCOMES.lost) return you ? "feed.lost.you" : "feed.lost.named";
      return you ? "feed.drawn.you" : "feed.drawn.named";
    case FEED_KINDS.started:
      if (entry.other === null) return you ? "feed.waiting.you" : "feed.waiting.named";
      return you ? "feed.started.you" : "feed.started.named";
    case FEED_KINDS.xp:
      return you ? "feed.xp.you" : "feed.xp.named";
    case FEED_KINDS.credited:
      return you ? "feed.credited.you" : "feed.credited.named";
    case FEED_KINDS.ip:
      return you ? "feed.ip.you" : "feed.ip.named";
    case FEED_KINDS.level:
      return you ? "feed.level.you" : "feed.level.named";
    case FEED_KINDS.puzzles:
      if (entry.count === 1) return you ? "feed.puzzleOne.you" : "feed.puzzleOne.named";
      return you ? "feed.puzzleMany.you" : "feed.puzzleMany.named";
    case FEED_KINDS.news:
      return newsPhrase(entry);
    case FEED_KINDS.added:
      return "feed.added";
  }
}

/**
 * The site's news, said with its person where it may name them and without
 * where it may not (`named`). Always the third person: see `feedNews.ts`.
 */
export function newsPhrase(entry: FeedNewsEntry): PhraseKey {
  switch (entry.news) {
    case SITE_NEWS.firstGameOfGame:
      if (!entry.named) return "feed.news.firstGame";
      return entry.outcome === FEED_OUTCOMES.drawn ? "feed.news.firstGameDrawn" : "feed.news.firstGameWon";
    case SITE_NEWS.tookFirstPlace:
      return "feed.news.firstPlace";
    case SITE_NEWS.hardBotBeaten:
      return entry.named ? "feed.news.botBeaten" : "feed.news.botBeatenNobody";
    case SITE_NEWS.firstWin:
      return "feed.news.firstWin";
    case SITE_NEWS.firstLoss:
      return "feed.news.firstLoss";
    case SITE_NEWS.bestTime:
      return entry.named ? "feed.news.bestTime" : "feed.news.bestTimeNobody";
  }
}

/** A piece of a sentence: words as they are, or a `{slot}` a page fills with a link. */
export type PhrasePart = { text: string } | { slot: string };

/**
 * A sentence cut at its `{slots}`, so a page can put a link where the English
 * says `{game}` and the Japanese puts it somewhere else entirely.
 *
 * `fill` makes a string, and a name that leads somewhere is not a string; this
 * keeps the order the sentence's own language chose and hands back the holes.
 * Empty runs of text are left out.
 */
export function phraseParts(template: string): PhrasePart[] {
  const parts: PhrasePart[] = [];
  let from = 0;
  for (const match of template.matchAll(/\{(\w+)\}/g)) {
    const at = match.index ?? 0;
    if (at > from) parts.push({ text: template.slice(from, at) });
    parts.push({ slot: match[1] as string });
    from = at + match[0].length;
  }
  if (from < template.length) parts.push({ text: template.slice(from) });
  return parts;
}

/** Which heading a day of the feed carries: today, yesterday, or its date. */
export type DayHeading = { phrase: "feed.today" | "feed.yesterday" } | { date: string };

/**
 * `today` and `yesterday` are the reader's own day keys, from the same zone
 * the lines were gathered in, so "Today" means the same day the lines under
 * it do.
 */
export function dayHeading(day: string, today: string, yesterday: string): DayHeading {
  if (day === today) return { phrase: "feed.today" };
  if (day === yesterday) return { phrase: "feed.yesterday" };
  return { date: day };
}
