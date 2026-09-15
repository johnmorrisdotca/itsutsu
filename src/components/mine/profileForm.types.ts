import type { MemberCountry } from "@/lib/social/countries";

/**
 * The shapes the profile form and its sections share.
 *
 * Kept apart from `ProfileForm.tsx` for AGENTS.md's types rule, and because the
 * form reached the file-size gate: where you are, when your games wait
 * (`ProfileAway.tsx`), and what the site sends you and keeps
 * (`ProfileSends.tsx`) are three sections of one form, and the fields they all
 * edit are a contract none of them owns. `ProfileForm.tsx` re-exports
 * `ProfileFields`, so its import path is unchanged.
 */

export type ProfileFields = {
  awayFrom: string;
  awayUntil: string;
  city: string;
  country: string;
  timeZone: string;
  bio: string;
  showOnline: boolean;
  emailNotify: boolean;
  /** Days a finished game stays in your own list; 0 keeps them all. */
  keepFinishedDays: number;
  /** Days of the week you do not play, 0 for Sunday. */
  daysOff: number[];
};

export type ProfileFormProps = {
  initial: ProfileFields;
  countries: MemberCountry[];
  timeZones: string[];
};

/** One section of the form: the fields as they stand, and the one way to change them. */
export type ProfileSectionProps = {
  fields: ProfileFields;
  set: (patch: Partial<ProfileFields>) => void;
};
