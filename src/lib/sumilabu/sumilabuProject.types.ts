/** Which of Sumilabu's two token maps a call is asked of: the tickets board, or the settings store. */
export type SumilabuScope = "board" | "settings";

/**
 * The projects on Sumilabu this checkout may address: each site's live board,
 * and the rehearsal board beside it that tests and dry runs write to.
 *
 * Itsutsu's own pair came first; UmaKuma's is here because Sumilabu is the one
 * board every site shares, so a tool run from this checkout can work UmaKuma's
 * rows without a second copy of the client. Which of them counts as live is
 * decided in `sumilabuProject.ts`, not by the shape of the name.
 */
export type SumilabuProjectKey = "itsutsu" | "itsutsu-dev" | "umakuma" | "umakuma-dev";

/**
 * Everything a call to Sumilabu needs, decided once.
 *
 * `tokenEnv` is the NAME of the variable the token came from, so a refusal can
 * say which one to check without ever printing what is in it.
 */
export type SumilabuTarget = {
  projectKey: SumilabuProjectKey;
  scope: SumilabuScope;
  /** The service's origin, without a trailing slash. */
  url: string;
  /** `api.sumilabu.com` — what a script prints before it writes. */
  host: string;
  token: string;
  tokenEnv: string;
};
