import { notFound } from "next/navigation";

import Link from "next/link";

import { AdminBoardCard } from "@/components/backlog/AdminBoardCard";
import { BacklogBoard } from "@/components/backlog/BacklogBoard";
import { AdminEmbeds } from "@/components/auth/AdminEmbeds";
import { AdminInvites } from "@/components/auth/AdminInvites";
import { AdminBots } from "@/components/auth/AdminBots";
import { AdminMembers } from "@/components/auth/AdminMembers";
import { AdminSite } from "@/components/auth/AdminSite";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Tabs } from "@/components/ui/Tabs";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { currentSession } from "@/lib/auth/currentSession";
import { fetchBoard } from "@/lib/backlog/backlogStore";
import { isAdminRequest } from "@/lib/auth/requireAdmin";
import { activeTab, type Tab } from "@/lib/ui/tabs";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

// The board is read on every request; the operator is looking at what moved today.
export const dynamic = "force-dynamic";

/*
 * Four things the operator does here, so the page shows one at a time: who
 * gets in, who is in, what plays for the site, and what is being built. They
 * were three headings on one page and the whole features board sat inside the
 * third, which made it long however short the headings were.
 *
 * BOTS IS ITS OWN TAB RATHER THAN A SECTION OF MEMBERS. The computer players
 * were in that list among the people, and to an operator they are a different
 * kind of row: nothing to shut, no name to take off, nobody to write to, and
 * four facts the members list does not carry. John: "A Bots tab is good to
 * split up Members from Bots." It sits beside the members rather than after
 * the work, because it answers the same question one category along.
 */
const TABS: Tab[] = [
  { key: "door", label: "The door", kanji: "門" },
  /*
   * Beside the door rather than first, and not first on purpose: `tabHref`
   * makes the first tab the bare /admin address, so promoting this would
   * change where /admin lands. The door is the mechanisms — codes and tokens;
   * this is the policy they operate under, which is why it sits next to them
   * rather than under "the work".
   */
  { key: "site", label: "The site", kanji: "設定" },
  { key: "members", label: "The members", kanji: "会員" },
  { key: "bots", label: "The bots", kanji: "機械" },
  { key: "work", label: "The work", kanji: "仕事" },
];

/**
 * The operator's page: invite codes, embed tokens, the members and the board.
 * Anyone else gets a 404 rather than a refusal, so the page gives nothing
 * away about existing. The panels check the session again on every request
 * they make.
 */
export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  if (!(await isAdminRequest())) notFound();
  const [items, me, asked] = await Promise.all([fetchBoard(), currentSession(), searchParams]);
  const who = me?.name ?? me?.email ?? "";
  const open = activeTab(TABS, asked.view);
  return (
    <Page width="standard">
      <SiteHeader />
      <h1 className="flex items-baseline gap-2 text-2xl font-semibold">
        Admin <span className="font-mincho text-lg font-normal opacity-70">管理</span>
      </h1>

      <Tabs tabs={TABS} active={open} base="/admin" label="What the operator does here" />

      {open === "door" ? (
        <div className="grid gap-4 md:grid-cols-2" data-testid="admin-door">
          <div className={PANEL_CLASS}>
            <AdminInvites />
          </div>
          <div className={PANEL_CLASS}>
            <AdminEmbeds />
          </div>
        </div>
      ) : null}

      {open === "site" ? (
        <div className={PANEL_CLASS} data-testid="admin-site-tab">
          <AdminSite />
        </div>
      ) : null}

      {open === "members" ? (
        <div className={PANEL_CLASS} data-testid="admin-people">
          <AdminMembers />
        </div>
      ) : null}

      {open === "bots" ? (
        <div className={PANEL_CLASS} data-testid="admin-machines">
          <AdminBots />
        </div>
      ) : null}

      {open === "work" ? (
        <>
          <div className={PANEL_CLASS}>
            <AdminBoardCard />
          </div>
          {/*
           * The board itself, not only a card pointing at it. The operator
           * reads it here more often than anywhere else, and a summary that
           * has to be clicked through is a summary of work rather than the
           * work.
           */}
          <section className={`${PANEL_CLASS} flex flex-col gap-4`} data-testid="admin-backlog">
            <h2 className="flex items-baseline gap-2 text-lg font-semibold">
              Backlog <span className="font-mincho text-sm font-normal opacity-70">積み残し</span>
              <Link href="/backlog" className="ml-auto text-xs font-normal text-muted underline underline-offset-4">
                On its own page
              </Link>
            </h2>
            <BacklogBoard items={items} who={who} />
          </section>
        </>
      ) : null}
    </Page>
  );
}
