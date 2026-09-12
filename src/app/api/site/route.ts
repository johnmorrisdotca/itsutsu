import { NextResponse } from "next/server";

import { NO_STORE, badRequest, notFound, readJson, serverError, unprocessable } from "@/lib/api/apiResponse";
import { RATE_LIMITS, overLimit } from "@/lib/api/rateLimit";
import { currentAdmin } from "@/lib/auth/requireAdmin";
import { MAINTENANCE_ENV } from "@/lib/site/site.constants";
import { acceptSiteSetting, maintenanceIsOn } from "@/lib/site/site";
import { fetchSiteSettingStates, writeSiteSetting } from "@/lib/site/siteStore";

/**
 * The site's own settings, for the operator only.
 *
 * A non-operator gets 404 rather than 403, the way `/api/invites` does, so the
 * route gives away nothing about its own existence.
 *
 * ONE KEY AT A TIME on the way in, which is not laziness: it is the shape
 * `settings/{key}` PUT has in the shared settings service this store is meant
 * to move to, so the day it moves, this route forwards instead of writing and
 * nothing about the panel changes. It also means a refusal names the setting it
 * refused, rather than a batch half-applying and reporting one problem.
 */
export async function GET(request: Request) {
  try {
    const tooMany = overLimit(request, "site-settings", RATE_LIMITS.read);
    if (tooMany !== null) return tooMany;

    if ((await currentAdmin()) === null) return notFound();
    return NextResponse.json(
      {
        settings: await fetchSiteSettingStates(),
        /*
         * Reported, never written. The shutter is an environment variable and
         * this route cannot change it — see `MAINTENANCE_ENV` — so the panel is
         * told the truth about it and says so, rather than being given a switch
         * that would appear to work. A setting the operator can see but not
         * change is honest; one they can change with no effect is the fault
         * WazaDB has three of.
         */
        maintenance: {
          on: maintenanceIsOn(process.env[MAINTENANCE_ENV]),
          variable: MAINTENANCE_ENV,
        },
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error(error);
    return serverError("Could not read the site settings.");
  }
}

export async function PUT(request: Request) {
  try {
    const tooMany = overLimit(request, "site-settings-write");
    if (tooMany !== null) return tooMany;

    const admin = await currentAdmin();
    if (admin === null) return notFound();

    const body = await readJson(request);
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      return badRequest("Expected a JSON body of { key, value }.");
    }
    const { key, value } = body as { key?: unknown; value?: unknown };
    if (typeof key !== "string") return badRequest("Expected a setting name.");

    /*
     * The registry decides, not this route. 422 with the reason, because an
     * operator who mistyped a mode must hear it: a write that quietly did
     * something other than what was asked, on the control that decides who may
     * enter the site, is the worst outcome available — believing the door is
     * shut when it is open.
     */
    const accepted = acceptSiteSetting(key, value === undefined ? null : value);
    if (!accepted.ok) return unprocessable(accepted.problem);

    await writeSiteSetting(accepted.key, accepted.value, admin.email ?? "operator");
    return NextResponse.json(
      { settings: await fetchSiteSettingStates() },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error(error);
    return serverError("Could not save that setting.");
  }
}
