import { notFound } from "@/lib/api/apiResponse";
import { currentAdmin } from "@/lib/auth/requireAdmin";
import { REPORT_IMAGE_TYPES } from "@/lib/reports/reports.constants";
import { reportImage } from "@/lib/sumilabu/reportsClient";
import { sumilabuTarget } from "@/lib/sumilabu/sumilabuProject";

/**
 * A report's screenshot, for the operator's page.
 *
 * Sumilabu serves the bytes only to a holder of the project's reports token,
 * and only this server holds it, so the Admin tab's picture is drawn through
 * here. `currentAdmin()`, as every admin route does, and a 404 for anybody
 * else, so the address says nothing about whether a report exists.
 *
 * Asked only when the operator opens the reports tab and a report has a
 * picture. Never cached anywhere shared: a screenshot can show whatever was on
 * the reporter's screen.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/admin/reports/[id]/image">) {
  if ((await currentAdmin()) === null) return notFound();
  const { id } = await ctx.params;
  let image: Awaited<ReturnType<typeof reportImage>> = null;
  try {
    image = await reportImage(sumilabuTarget("reports"), id);
  } catch {
    image = null;
  }
  // Only a picture of the three kinds Sumilabu takes is ever handed to a browser to draw.
  if (image === null || !(REPORT_IMAGE_TYPES as readonly string[]).includes(image.type)) return notFound();
  return new Response(image.bytes, {
    headers: {
      "content-type": image.type,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
