/**
 * site.*, nav.* and account.*: the language picker, the navigation and the account menu, the words on every page.
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_SITE = {
  "site.language": "Language",

  "nav.about": "About",
  "nav.rules": "Rules",
  "nav.record": "Game history",
  "nav.players": "Players",
  "nav.everyGame": "All games",
  "nav.play": "My games",
  "nav.newGame": "New game",
  "nav.games": "Games",
  "nav.learn": "Learn",
  "nav.admin": "Admin",
  "nav.privacy": "Privacy",
  "nav.terms": "Terms",
  "nav.xp": "XP",

  "account.signIn": "Sign in",
  "account.signOut": "Sign out",
} as const;
