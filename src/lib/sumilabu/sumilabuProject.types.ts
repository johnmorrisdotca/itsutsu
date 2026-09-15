/** Which of Sumilabu's two token maps a call is asked of: the tickets board, or the settings store. */
export type SumilabuScope = "board" | "settings";

/** Itsutsu's two projects on Sumilabu: the live one, and the one tests and rehearsals write to. */
export type SumilabuProjectKey = "itsutsu" | "itsutsu-dev";

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
