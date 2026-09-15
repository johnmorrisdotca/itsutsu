import { Paired } from "@/components/i18n/Paired";
import { PlayerName } from "@/components/players/PlayerName";
import { listOperatorActions } from "@/lib/auth/operatorLog";
import { OPERATOR_ACTIONS_SHOWN, OPERATOR_ACTION_DISPLAY } from "@/lib/auth/operatorLog.constants";
import type { OperatorActionEntry, OperatorActionName } from "@/lib/auth/operatorLog.types";

import { ADMIN_LOG_COPY } from "./admin.constants";

/**
 * The operator log: what has been done to members' accounts, newest first.
 *
 * ITS OWN TABLE, NOT `RecordTable`. `RecordTable` is the one table of records —
 * every row carries a won/lost/drawn record, the games it counts and a streak —
 * and an act of the operator's has none of those. Drawn through it, every row
 * would print nought played and nought won as though that were a fact about the
 * act, which is a value in range standing in for "nothing to say". So the
 * columns are the act's own: when, who acted, what, to whom, and the line of
 * fact the writer kept. There is no Rating column, so there is no XP column to
 * owe beside it.
 *
 * AN EMPTY TABLE IS DATA: the headings are always drawn, with a line saying
 * nothing has been done yet.
 *
 * SERVER-RENDERED, AND ONLY WHEN THE TAB IS OPEN, like the bots tab: two queries
 * — the acts, and the names of the members they were done to.
 */
export async function AdminOperatorLog() {
  const acts = await listOperatorActions(OPERATOR_ACTIONS_SHOWN);
  return (
    <section className="flex flex-col gap-3" data-testid="admin-operator-log">
      <h2 className="flex items-baseline gap-2 text-lg font-semibold">
        <Paired en={ADMIN_LOG_COPY.heading.label} kanji={ADMIN_LOG_COPY.heading.kanji} kanjiClassName="text-sm font-normal opacity-70" />
      </h2>
      <p className="max-w-prose text-sm text-muted">{ADMIN_LOG_COPY.lead}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" data-testid="operator-log-table">
          <thead>
            <tr className="border-b border-rule text-[0.7rem] tracking-[0.14em] text-muted uppercase">
              <th className="py-2 pr-4 font-semibold">{ADMIN_LOG_COPY.when}</th>
              <th className="py-2 pr-4 font-semibold">{ADMIN_LOG_COPY.who}</th>
              <th className="py-2 pr-4 font-semibold">{ADMIN_LOG_COPY.what}</th>
              <th className="py-2 pr-4 font-semibold">{ADMIN_LOG_COPY.member}</th>
              <th className="py-2 font-semibold">{ADMIN_LOG_COPY.detail}</th>
            </tr>
          </thead>
          <tbody>
            {acts.length === 0 ? (
              <tr data-testid="operator-log-empty">
                <td colSpan={5} className="py-3 text-muted">
                  {ADMIN_LOG_COPY.empty}
                </td>
              </tr>
            ) : (
              acts.map((act) => <ActRow key={act.id} act={act} />)
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ActRow({ act }: { act: OperatorActionEntry }) {
  const said = act.known ? OPERATOR_ACTION_DISPLAY[act.action as OperatorActionName] : null;
  return (
    <tr
      className="border-b border-rule/60 align-baseline"
      data-testid="operator-log-row"
      data-action={act.action}
      data-subject={act.subjectId}
    >
      {/*
        UTC, and written out rather than formatted: this renders on the server,
        which cannot know the operator's zone, and a zone guessed here would be a
        wrong time presented as a right one.
      */}
      <td className="py-2 pr-4 font-mono text-xs whitespace-nowrap tabular-nums">
        {`${act.at.toISOString().slice(0, 16).replace("T", " ")} UTC`}
      </td>
      <td className="py-2 pr-4 text-xs">{act.actor.email ?? act.actor.memberId ?? ADMIN_LOG_COPY.unnamedActor}</td>
      <td className="py-2 pr-4">{said === null ? act.action : <Paired en={said.label} kanji={said.kanji} kanjiClassName="opacity-70" />}</td>
      <td className="py-2 pr-4">
        {act.subjectName === null ? (
          <span className="text-xs text-muted" data-testid="operator-log-gone">
            {ADMIN_LOG_COPY.memberGone(act.subjectId)}
          </span>
        ) : (
          /*
            In full, as the operator's own members list prints it: telling two
            Hanakos apart is the point of an operator's page. A blank name falls
            back to the id, so the row still says whom the act was done to.
          */
          <PlayerName name={act.subjectName} memberId={act.subjectId} fallback={act.subjectId} whole />
        )}
      </td>
      <td className="py-2 text-xs text-muted">{act.detail}</td>
    </tr>
  );
}
