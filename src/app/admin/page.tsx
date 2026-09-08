import { notFound } from "next/navigation";

import { AdminEmbeds } from "@/components/auth/AdminEmbeds";
import { AdminInvites } from "@/components/auth/AdminInvites";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { isAdminRequest } from "@/lib/auth/requireAdmin";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

/**
 * The operator's page: invite codes and embed tokens. Anyone else gets a 404
 * rather than a refusal, so the page gives nothing away about existing. The
 * panels check the session again on every request they make.
 */
export default async function AdminPage() {
  if (!(await isAdminRequest())) notFound();
  return (
    <Page width="standard">
      <SiteHeader />
      <h1 className="flex items-baseline gap-2 text-2xl font-semibold">
        Admin <span className="font-mincho text-lg font-normal opacity-70">管理</span>
      </h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className={PANEL_CLASS}>
          <AdminInvites />
        </div>
        <div className={PANEL_CLASS}>
          <AdminEmbeds />
        </div>
      </div>
    </Page>
  );
}
