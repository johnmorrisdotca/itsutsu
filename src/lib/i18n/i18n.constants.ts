import type { Locale, LocaleSpec } from "./i18n.types";

/**
 * The languages the site knows about, and the English it speaks in by default.
 *
 * Knowing about a language is not the same as speaking it: `dictionaries.ts`
 * decides which of these are actually offered, by asking which ones have
 * something to say. `zh` and `de` are declared here with no dictionary on
 * purpose — they are the next ones wanted, and declaring them is what lets
 * the Chinese pairing question below be answered in data rather than in an
 * argument.
 */
export const LOCALES: Record<Locale, LocaleSpec> = {
  en: { tag: "en", endonym: "English", english: "English", script: "latin", kanjiReadsAsOwn: false },
  es: { tag: "es", endonym: "Español", english: "Spanish", script: "latin", kanjiReadsAsOwn: false },
  ja: { tag: "ja", endonym: "日本語", english: "Japanese", script: "han", kanjiReadsAsOwn: true },
  zh: { tag: "zh", endonym: "中文", english: "Chinese", script: "han", kanjiReadsAsOwn: false },
  de: { tag: "de", endonym: "Deutsch", english: "German", script: "latin", kanjiReadsAsOwn: false },
};

export const LOCALE_LIST = Object.keys(LOCALES) as readonly Locale[];

/**
 * The language the site is written in, and the one every phrase falls back to.
 *
 * It is not a preference and never stands in for one: "nobody has said" is
 * `null` everywhere it can be, and only becomes English at the last step,
 * where something has to be rendered.
 */
export const DEFAULT_LOCALE: Locale = "en";

/**
 * How a language is asked for, and how it is remembered.
 *
 * A plain word in the query, the way the players page's filter is asked for,
 * and remembered in a cookie by the proxy on the way past — because a Server
 * Component can read a cookie while it renders and cannot set one. See
 * `proxy.ts`, which already does exactly this for the directory filter.
 *
 * The query is deliberately *not* where a page reads the answer from: it is
 * only how a choice is made. Reading it would make the address and the
 * remembered answer two sources for one fact.
 */
export const LANG_PARAM = "lang";
export const LANG_COOKIE = "lang";

/** A year: a language is not a thing anybody wants to keep re-choosing. */
export const LANG_REMEMBER_FOR_SECONDS = 60 * 60 * 24 * 365;

/**
 * The cookie that says a language was JUST CHOSEN, in this browser, by
 * whoever is sitting at it — and says nothing else at all.
 *
 * It exists because a member's language now lives on their account, which
 * means the account has to be able to lose the argument exactly once: on the
 * request where they are changing their mind. `LANG_COOKIE` cannot say that.
 * It reads the same a second after the click and a year after it, so it means
 * both "I chose this just now" and "I was told this last winter" — and a
 * reader that cannot tell those apart has to pick which mistake to make.
 * Either it lets the stored account language overrule a fresh click, which is
 * the 0.126.0 bug ("Can't change back to ENG from JP") arriving by a new
 * road; or it writes the cookie back over the account whenever the two
 * differ, and then two devices take the language off each other for ever,
 * because a stale cookie and a fresh one are the same string.
 *
 * So this is a second cookie with one meaning, which is the rule this
 * repository already states for `flipped: false` and for the board's nullable
 * grades. `proxy.ts` sets it beside the other one, on the redirect it was
 * already returning: it reads no database, learns nothing about who is
 * asking, and decides nothing it did not decide before. `currentLocale` is
 * the only thing that reads it — once to answer in the language just picked,
 * and once to write that choice onto the account it belongs to.
 *
 * SHORT ON PURPOSE. It has one job on the very next request, and a marker
 * that outlived its click would quietly become a second standing preference,
 * which is the thing it exists to prevent. A minute covers the redirect and
 * the page after it with room to spare. A marker still in the jar after that
 * has been acted on already and acting on it again writes nothing — see
 * `sameStored`.
 */
export const LANG_CHOSEN_COOKIE = "lang-chosen";
export const LANG_CHOSEN_FOR_SECONDS = 60;

/**
 * Every phrase the site can say in more than one language, in the language it
 * was written in.
 *
 * This is the source of truth for the key list, not just for the English: a
 * dictionary is `Record<PhraseKey, string>`, so TypeScript refuses a locale
 * that has not answered every one of these — the same way `VARIANT_SPECS`
 * refuses a game with no copy.
 *
 * What is NOT here, and why. Two kinds of English are deliberately left
 * alone. The brand — "Itsutsu 五つ" — is a name, not a phrase. And the
 * display copy attached to domain values (`RULE_VARIANT_DISPLAY`,
 * `STONE_DISPLAY`, the backlog's labels) stays in its own constants module
 * beside the thing it describes; when those are translated, each gains a
 * per-locale sibling table there, rather than forty games' worth of prose
 * being dragged into this one file.
 *
 * `{placeholders}` are filled by `fill` in `i18n.ts`. Every translation has
 * to use the same set — `i18n.coverage.test.ts` fails the build otherwise,
 * because a dropped placeholder is a sentence with a hole in it that nothing
 * else would report.
 */
export const PHRASES = {
  "site.language": "Language",

  "nav.about": "About",
  "nav.rules": "Rules",
  "nav.record": "Record",
  "nav.players": "Players",
  "nav.everyGame": "Every game",
  "nav.play": "Play",
  "nav.games": "Games",
  "nav.learn": "Learn",
  "nav.admin": "Admin",

  "account.signIn": "Sign in",
  "account.signOut": "Sign out",

  "filter.narrowedTo": "Narrowed to",
  "filter.player": "Player",
  "filter.result": "Result",
  "filter.board": "Board",
  "filter.rules": "Rules",
  "filter.sort": "Sort",
  "filter.any": "Any",
  "filter.searchNames": "Search names",

  "rules.object": "Object",
  "rules.board": "Board",
  "rules.play": "Play",
  "rules.house": "House rules",
  "rules.learn": "Learn",
  "rules.inspiredBy":
    "Inspired by {name}. The name belongs to its owner; this is our own version of the rules.",
  "rules.alsoKnownAs": "Also known as {names}.",
  "rules.from": "From {country}",
  "rules.imageAlt": "A game of {game} in progress",
  "rules.inProgress": "A game in progress.",
  "rules.playThis": "Play {game} →",
  "rules.everyGamePlayed": "Every game of {game} played here",
  "rules.wikipedia": "Read about {game} on Wikipedia ↗",

  /*
   * The set-up screen's last three choices, which were dropdowns and are
   * tiles: the opening, whether the game counts, and who it is against. The
   * names on the tiles are the domain's own copy (`OPENING_DISPLAY`,
   * `BOT_PROFILES`); these are the words around them.
   */
  "setup.opening": "Opening",
  "setup.ratings": "Ratings",
  "setup.rated": "Rated",
  "setup.ratedMeans": "The result moves both players' ratings.",
  "setup.friendly": "Friendly",
  "setup.friendlyMeans": "Played for its own sake. No rating moves.",
  "setup.opponent": "Opponent",
  "setup.anyoneMeans": "Whoever comes along first takes the other seat.",
  "setup.askedFor": "Asked for",
  "setup.hereNow": "Here now",
  "setup.playersYouKnow": "Players you know",
  "setup.theComputer": "The computer",
  "setup.showAll": "Show all {count}",
  "setup.showFewer": "Show fewer",

  /*
   * The XP toast. It shipped in 0.158.4 with these five as fixed English in
   * `xp.constants.ts`, so a Japanese reader was paid in their own language
   * and told about it in somebody else's. The unit is spelt out rather than
   * left as the letters: "XP" is a name only to an English reader.
   */
  "xp.unit": "XP",
  "xp.pointsEarned": "Points earned",
  "xp.dismiss": "Dismiss",
  "xp.levelUp": "Level up",
  "xp.nextLevel": "Next level: {name}",

  /*
   * A person's standing on their own page — the level and the total, under
   * their record. John: "View Person should always show this prominent info…
   * the Name of the person, Stats/Record and XP + XP level Name." The words a
   * table heading already says in English ("XP", "Level") are said here in the
   * reader's language, since this is a sentence about somebody and not a column.
   */
  "xp.level": "Level",
  "xp.toNext": "{count} to {name}",
  "xp.atTheTop": "The top of the ladder.",
  "xp.board": "Where everybody stands by experience",

  /*
   * The replay's download. SGF stays as the letters in every language: it is
   * the name of the format, and the name a reader will find it under in any
   * program that opens one.
   */
  "record.downloadSgf": "Download as SGF",

  /*
   * The rivalry scoreboard: two members' record against each other, above the
   * list of their games and on a match before and after it is played.
   *
   * TWO FORMS OF EVERY LINE, `.you` and `.named`, and that is a rule rather
   * than a style. "You" is said only to a reader who is one of the two; anybody
   * else signed in reads both names, because "You lead Dan" on a page about two
   * other people is a sentence about the wrong person.
   *
   * COUNTS: this dictionary has no plural mechanism, only `{placeholders}`, so a
   * count that can be one has a key per form — `.one` and `.other` — and every
   * language answers both. The rest never meet a one: a run worth naming starts
   * at three and a gap at six months, so "{count} times" and "{count} months"
   * are always plural in English. A year is the exception, and has two keys.
   * `{score}` is the score as digits, "4–4", which no language here reorders.
   */
  "rivalry.title": "Head to head",
  "rivalry.versus": "vs",
  "rivalry.wins": "Wins",
  "rivalry.draws": "Draws",
  "rivalry.games": "Games",
  "rivalry.allGames": "All games",
  "rivalry.lastPlayed": "Last played",
  "rivalry.notYet": "Not yet",
  "rivalry.streak": "Streak",
  "rivalry.against": "against {name}",
  "rivalry.unnamed": "A player",
  "rivalry.streakWon.one": "{name} won the last game",
  "rivalry.streakWon.other": "{name} won the last {count}",
  "rivalry.streakDrawn.one": "The last game was a draw",
  "rivalry.streakDrawn.other": "The last {count} were draws",
  "rivalry.never.you": "You and {name} have never played each other",
  "rivalry.never.named": "{one} and {other} have never played each other",
  "rivalry.neverGame.you": "You and {name} have never played {game} before",
  "rivalry.neverGame.named": "{one} and {other} have never played {game} before",
  "rivalry.gapMonths.you": "You haven't played {name} in {count} months",
  "rivalry.gapMonths.named": "{one} and {other} haven't played each other in {count} months",
  "rivalry.gapYear.you": "You haven't played {name} in a year",
  "rivalry.gapYear.named": "{one} and {other} haven't played each other in a year",
  "rivalry.gapYears.you": "You haven't played {name} in {count} years",
  "rivalry.gapYears.named": "{one} and {other} haven't played each other in {count} years",
  "rivalry.firstWin.you": "Your first win against {name}",
  "rivalry.firstLoss.you": "{name}'s first win against you",
  "rivalry.firstWin.named": "{winner}'s first win against {loser}",
  "rivalry.beaten.you": "You've beaten {name} {count} times in a row",
  "rivalry.lostTo.you": "You've lost to {name} {count} times in a row",
  "rivalry.beaten.named": "{winner} has beaten {loser} {count} times in a row",
  "rivalry.drawnRun.you": "Your last {count} games against {name} were draws",
  "rivalry.drawnRun.named": "The last {count} games between {one} and {other} were draws",
  "rivalry.allDrawn.you": "Every game between you and {name} has been a draw",
  "rivalry.allDrawn.named": "Every game between {one} and {other} has been a draw",
  "rivalry.tied.you": "You and {name} are tied {score}",
  "rivalry.tied.named": "{one} and {other} are tied {score}",
  "rivalry.lead.you": "You lead {name} {score}",
  "rivalry.behind.you": "{name} leads you {score}",
  "rivalry.lead.named": "{leader} leads {trailer} {score}",
} as const;

/** A phrase the site can say. */
export type PhraseKey = keyof typeof PHRASES;

export const PHRASE_KEYS = Object.keys(PHRASES) as readonly PhraseKey[];
