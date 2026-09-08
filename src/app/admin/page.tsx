import { notFound } from "next/navigation";

import Link from "next/link";

import { AdminBoardCard } from "@/components/backlog/AdminBoardCard";
import { BacklogBoard } from "@/components/backlog/BacklogBoard";
import { AdminEmbeds } from "@/components/auth/AdminEmbeds";
import { AdminInvites } from "@/components/auth/AdminInvites";
import { AdminMembers } from "@/components/auth/AdminMembers";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { currentSession } from "@/lib/auth/currentSession";
import { fetchBoard } from "@/lib/backlog/backlogStore";
import { isAdminRequest } from "@/lib/auth/requireAdmin";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

// The board is read on every request; the operator is looking at what moved today.
export const dynamic = "force-dynamic";

/**
 * The operator's page: invite codes and embed tokens. Anyone else gets a 404
 * rather than a refusal, so the page gives nothing away about existing. The
 * panels check the session again on every request they make.
 */
/** One part of the operator's page, under a heading that says what it is for. */
function Section({ title, kanji, children }: { title: string; kanji: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-baseline gap-2 text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
        {title} <span className="font-mincho text-[0.8rem] font-normal tracking-normal">{kanji}</span>
      </h2>
      {children}
    </section>
  );
}

export default async function AdminPage() {
  if (!(await isAdminRequest())) notFound();
  const [items, me] = await Promise.all([fetchBoard(), currentSession()]);
  const who = me?.name ?? me?.email ?? "";
  return (
    <Page width="standard">
      <SiteHeader />
      <h1 className="flex items-baseline gap-2 text-2xl font-semibold">
        Admin <span className="font-mincho text-lg font-normal opacity-70">管理</span>
      </h1>
      {/*
        * Three things the operator does here, so the page says which is which:
        * who gets in, who is in, and what is being built.
        */}
      <Section title="The door" kanji="門">
        <div className="grid gap-4 md:grid-cols-2">
          <div className={PANEL_CLASS}>
            <AdminInvites />
          </div>
          <div className={PANEL_CLASS}>
            <AdminEmbeds />
          </div>
        </div>
      </Section>

      <Section title="The members" kanji="会員">
        <div className={PANEL_CLASS}>
          <AdminMembers />
        </div>
      </Section>

      <Section title="The work" kanji="仕事">
        <div className={PANEL_CLASS}>
          <AdminBoardCard />
        </div>
      </Section>

      {/*
        * The board itself, not only a card pointing at it. The operator reads
        * it here more often than anywhere else, and a summary that has to be
        * clicked through is a summary of work rather than the work.
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
    </Page>
  );
}
