import type { AgeBand } from "@/lib/social/ageBand.constants";

export type AgeBandFormProps = {
  /** The band on the row, or null for a member never asked. */
  band: AgeBand | null;
  /** Whether a parent's or guardian's consent is already on file. */
  consented: boolean;
  /**
   * `welcome` asks and nothing else: the page shows it instead of the name
   * question until it is answered. `profile` shows the answer with Change.
   */
  place: "welcome" | "profile";
};
