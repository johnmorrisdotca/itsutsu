/**
 * chrome.*: the frame every page sits in. The masthead's figures, the beta mark, the footer, the account menu's
 * words, the offline notice, a page that is not found and the site's description (ENJA-10).
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there. The site's own name is never in a phrase:
 * a sentence that has to say it takes `{site}`.
 */
export const PHRASES_CHROME = {
  // The word for how far along the site is, on the beta mark, in the footer and in the account menu
  "chrome.stage": "Beta",
  "chrome.betaTitle": "{site} is in beta: new things arrive most days, and some rough edges are still being smoothed. The people helping test it are thanked here.",
  "chrome.homeLink": "{site} home",
  "chrome.tagline": "Five in a row, and the games that grew from it.",
  "chrome.versionTitle": "Version {version} — what has shipped",
  "chrome.siteDescription": "{site}: gomoku, renju, connect6 and the family of line-and-grid games. Two players, one browser — or two devices, a code apart.",

  // The line of a member's own figures under the masthead
  "chrome.strip.label": "Your games and standing",
  "chrome.strip.noGames": "No games in progress",
  "chrome.strip.yourMove": "{count} your move",
  "chrome.strip.going": "{count} in progress",
  "chrome.strip.recordTitle": "Rated games, against people and bots",
  "chrome.strip.won": "W",
  "chrome.strip.lost": "L",
  "chrome.strip.drawn": "D",
  "chrome.strip.level": "Lv {level} · {name}",

  // The account menu
  "chrome.menu.account": "Account",
  "chrome.menu.inbox": "Inbox",
  "chrome.menu.profile": "Profile",
  "chrome.menu.settings": "Settings",
  "chrome.menu.whatsNew": "What's new →",

  // Keeping the games on this device
  "chrome.offline.intro": "A game you open is kept on this device to play offline. Or keep them all now, before you lose the signal.",
  "chrome.offline.keepAll": "Keep every game offline",
  "chrome.offline.keeping": "Keeping every game on this device: {done} of {total} pages, {size} so far…",
  "chrome.offline.done": "Every game is kept on this device ({size}), so each one plays with no connection.",
  "chrome.offline.again": "Keep again",
  "chrome.offline.remove": "Remove",
  "chrome.offline.ready": "Ready offline",
  "chrome.offline.readyTitle": "Opened on this device before, so it plays with no connection",
  "chrome.offline.notice": "You're offline. Games marked Ready offline on the {link} still play here; live games, races and records wait for a connection.",
  "chrome.offline.gamesList": "games list",

  // A page that is not there
  "chrome.notFound.title": "Page not found",
  "chrome.notFound.body": "There is no page at this address. It may have been a game that does not exist, or a link that was not copied whole.",
  "chrome.notFound.home": "Home",

  // A strip of someone's record, shown on another site's page
  "chrome.embed.played.one": "{count} game played",
  "chrome.embed.played.other": "{count} games played",
  "chrome.embed.black": "Black",
  "chrome.embed.white": "White",
  "chrome.embed.draw": "Draw",
  "chrome.embed.versus": "v",
  "chrome.embed.over": "over {count} games",

  // The famous games
  "chrome.famous.step": "Step through the {count} moves",
  "chrome.famous.moves": "Moves",
  "chrome.famous.hide": "Hide moves",
  "chrome.famous.thisGame": "this game",
  "chrome.famous.notPlayed": "A famous game, not played on {site}. Record:",
  "chrome.famous.round": "round {round}",
  "chrome.famous.mosaicAlt": "Every position of {black} against {white}, {event}",
  "chrome.famous.versus": "vs",
  "chrome.famous.title": "Famous games",
  "chrome.famous.blurb": "Championship and historic games, replayed move by move through this site's own rules. Each one can be made into a picture of every position — drawn in your browser.",
  "chrome.famous.source": "Record:",
  "chrome.famous.sourceName": "Andries Brouwer's database of Go games, CWI (public domain)",
} as const;
