import "server-only";

/**
 * A line for something the operator did TO SOMEBODY ELSE'S ACCOUNT.
 *
 * WHY THIS IS A CONSOLE LINE AND NOT A TABLE, said plainly because the honest
 * answer is "this site has nowhere better yet". There is no audit model in the
 * schema and no operator log on any admin page: shutting an account, opening
 * one, taking a name off — none of them records who did it or when. So this is
 * the deployment's log, which the operator can read in Vercel, and it is the
 * most that can be had without a migration. It is a deliberate floor rather
 * than a design: a real operator log belongs on the Admin page, and `/backlog`
 * is where that gets asked for.
 *
 * WHAT MAY GO IN ONE. Who acted, what they did, and which row it was done to.
 * Never a credential and never the material of one: the four words a member
 * picks are a password, they are never stored, and a log line is exactly the
 * place they must not appear — `/api/me/phrase/draw` already refuses to log its
 * own request body for the same reason. The caller passes a sentence it has
 * written; nothing here reads a body or a phrase.
 *
 * One function rather than a scattering of `console.info`s, so that the day
 * there IS a table there is one call site per action to change, and so the
 * next operator action has a pattern to follow instead of inventing a third
 * shape.
 */
export function logOperatorAction(who: string | null | undefined, what: string): void {
  const actor = (who ?? "").trim();
  /*
   * The bare word for an unnamed operator, which is honest rather than tidy:
   * the operator is authorised by ADMIN_EMAILS and a session may carry no
   * address at all. An empty pair of brackets would read as a lost field.
   */
  console.info(`[operator${actor === "" ? "" : ` ${actor}`}] ${what}`);
}
