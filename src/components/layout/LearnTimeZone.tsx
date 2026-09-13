import { currentEmail } from "@/lib/auth/currentSession";
import { dayZoneUnknown } from "@/lib/auth/memberZone";

import { DeviceTimeZone } from "./DeviceTimeZone";

/**
 * Mounts the device-zone sender only for a member whose day boundary this site
 * does not know.
 *
 * The decision is the SERVER'S, off a row it has already read, which is what
 * makes the write impossible to get wrong: the browser is never asked to judge
 * whether a zone is already set, so it can never overwrite one. A member who
 * chose Europe/Tallinn renders nothing here, for ever.
 *
 * `currentEmail` and `memberRowFor` are both `cache()`d per request and the
 * masthead above has already called both, so this costs no query on any page.
 * A signed-out reader has no row to record a zone on and gets nothing.
 */
export async function LearnTimeZone() {
  const unknown = await dayZoneUnknown(await currentEmail());
  if (!unknown) return null;
  return <DeviceTimeZone />;
}
