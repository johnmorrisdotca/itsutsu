# PRIV-02. The profile asks your age band, and a member under 13 needs a parent's consent

Board key: `the-profile-asks-your-age-band-and-a-member-under-13-needs-a-parent-s-consent`.
Kind: feature. Priority high. Needs PRIV-01 on `main`. CARRIES A MIGRATION.

## Why

Children play here, in families, and the privacy page can only describe what
the site does about that, which today is nothing beyond the invite gate.
UmaKuma asks an age band at sign-up and records a parent's or guardian's
consent for a member under 13 (its `Account.ageBand`, `ParentalConsent`,
`ParentConsentForm.tsx`, `parentalConsentServer.ts` on `origin/main`); its
privacy page then has a Children section that says exactly what is recorded.
John, 2026-09-24: "if this means we need to get the age of a user like UK
does, then these are also tickets that need to be done, for the Profile page
data collection of age."

## Before you start

1. Own worktree off `origin/main`. Copy `.env` in BEFORE `pnpm install`.
2. Read AGENTS.md "Back It Up Before You Migrate It" and "Every Table Of
   Players Shows XP" (for how a rule about a kind of member is kept in one
   place). Read `src/app/me/page.tsx` (the welcome step, `?welcome=1`),
   `src/components/mine/ProfileForm.tsx`, `src/app/api/me/route.ts`,
   `src/lib/auth/members.ts`, `src/components/auth/AdminMembers.tsx`.
3. Read UmaKuma's `src/lib/srs/ageBand.ts`, `src/lib/parentalConsent.ts`,
   `src/lib/parentalConsentServer.ts` and `src/app/shared/ParentConsentForm.tsx`
   from `origin/main` of `/Users/john/Projects/umakuma` (`git show
   origin/main:<path>`; the local checkout there is far behind). You are
   porting the shape, not the SRS-theme rating it feeds.

## Exact changes

### 1. Schema and migration

`prisma/schema.prisma`, `model Member`: add

```prisma
/// The band the member said they are in: AGE_BANDS in src/lib/social/ageBand.constants.ts.
/// Null means never asked, which is every member who joined before this shipped;
/// it is not a band and nothing treats it as one.
ageBand String?
/// For a member under 13: who consented to the account and when.
parentalConsent ParentalConsent?
```

and a table

```prisma
model ParentalConsent {
  id           String   @id @default(cuid())
  memberId     String   @unique
  member       Member   @relation(fields: [memberId], references: [id], onDelete: Cascade)
  /// The name the parent or guardian gave, as they typed it.
  name         String   @db.VarChar(120)
  /// "parent" or "guardian": PARENT_RELATIONSHIPS in ageBand.constants.ts.
  relationship String   @db.VarChar(16)
  createdAt    DateTime @default(now())
}
```

`pnpm exec prisma migrate dev --name age_band_and_parental_consent` against
YOUR local database only, with `DATABASE_URL` and `DIRECT_URL` both set inline
(memory: `directUrl` overrides `DATABASE_URL`). Never against production.
`docs/DATA_MODEL.md` gains both.

### 2. The vocabulary, in one module

`src/lib/social/ageBand.constants.ts`:

```ts
export const AGE_BANDS = { under13: "under_13", teen: "13_17", adult: "18_plus" } as const;
export const AGE_BAND_LIST = [...] // in that order, for a form
export const AGE_BAND_DISPLAY: Record<AgeBand, { label: string; kanji: string }> = {
  under_13: { label: "Under 13", kanji: "13歳未満" }, 13_17: { label: "13 to 17", kanji: "13〜17歳" }, 18_plus: { label: "18 or over", kanji: "18歳以上" },
};
export const PARENT_RELATIONSHIPS = { parent: "parent", guardian: "guardian" } as const;
```

UmaKuma's values on purpose, so the two sites can be compared and copy
shared. `src/lib/social/ageBand.ts`: `isAgeBand`, `needsConsent(band)`
(true only for `under_13`; null is NOT a band and returns false, because a
member never asked is not a child by default — but see step 3 for why they
are asked before anything else), `consentProblems(form)`.

### 3. Asking

- **The welcome step** (`/me?welcome=1`, rendered by `src/app/me/page.tsx`)
  asks the band FIRST, before the name and the words, as three tiles
  (`AGE_BAND_LIST`), and `Continue` is disabled until one is chosen. Under 13
  opens `ParentConsentForm` (`src/components/mine/ParentConsentForm.tsx`): a
  sentence to the parent or guardian, their name, parent or guardian, and a
  `They may have an account here` button. Without it the member cannot
  leave the step, and if they leave the page the row is removed by the same
  sweep that removes an abandoned welcome (find it in `members.ts`; if there
  is none, add one that removes a member with `ageBand === "under_13"` and no
  consent row after an hour, and test it).
- **The Profile tab** shows the band as read-only text with `Change` that
  reopens the tiles; changing INTO under 13 asks for consent the same way.
- **`PATCH /api/me`** takes `ageBand` and, when it is `under_13`, requires a
  `consent: { name, relationship }` beside it in the same request and writes
  both in one transaction. It refuses `under_13` without consent (422, and
  the reason), and refuses a consent row for any other band.
- **Admin** (`AdminMembers.tsx`): a column `Age` after Country, the band or
  `not asked`, and on a member's row a control that sets the band and, for
  under 13, records the consent the operator obtained by hand (for the
  members who joined before this shipped). Logged as `OPERATOR_ACTIONS.ageBand`
  with the old and new band in the detail.

### 4. The privacy page

`src/app/privacy/privacy.constants.ts`, the Children section, becomes true
in the same release: the site asks your age band when you join; a member
under 13 needs a parent's or guardian's consent, recorded by the name they
gave, whether they are the parent or a guardian, and when; without it no
account is kept; a parent writes to `hello@itsutsu.com` to ask what is held
or to have the account removed. Move the date at the top.

## Tests

- `ageBand.test.ts`: the vocabulary, `needsConsent`, `consentProblems`.
- `src/app/api/me/route.test.ts` (or beside the existing tests of that route):
  under 13 without consent is refused; with consent both rows are written;
  consent for a teen is refused; a band can be changed.
- `e2e/age-band.spec.ts`: a fresh member (redeem an invite in a fresh
  context, as `auth.setup.ts` does) is asked first; choosing under 13 without
  consent cannot continue; giving it continues to the name step; the Profile
  tab shows the band. Wait on `readyMark`, never on an element.
- `privacy.coverage.test.ts` is extended: when `ageBand` exists in the schema,
  the Children section names the consent row's three facts.

## Production

1. `neonctl branches create … --name before-age-band-<yyyy-mm-dd>` and a
   DiskStation dump, as AGENTS.md says. Prune to about three `before-*`.
2. Tell the merge point (itsutsu-c7 on 2026-09-24) that the branch carries a
   migration, so it goes in a push with no other migration and after the
   Vercel cap is known to be clear.
3. After deploy, John sets the band on the existing family accounts from
   Admin; nothing does it for him.

## What not to do

- Do not derive a band from anything (a name, a bio, who invited them).
  Null means not asked, and stays null until they answer.
- Do not put the rules that READ the band here; that is PRIV-03.
- Do not block existing members from playing until they answer. They are
  asked on their next visit to `/me`, and Admin can set it.

## As built (2026-09-24, branch work/age-band)

- Vocabulary and rules in `src/lib/social/ageBand.constants.ts` and
  `ageBand.ts` (tested); the writes in `src/lib/auth/ageBandStore.ts`, one
  transaction for the band and its consent, so no row is ever under 13 alone.
  That made the abandoned-welcome sweep in step 3 unnecessary: there is no
  half-written state to sweep.
- `PATCH /api/me` takes `ageBand` and `consent`; 422 with `needsParent` when a
  child arrives without one, 400 for consent alone, 422 for consent on an adult.
- `AgeBandForm` on the welcome page, shown INSTEAD of the name form until
  answered, and on the Profile tab with Change; `MemberAgeControl` on the
  Admin row, through `PATCH /api/members`, logged as `OPERATOR_ACTIONS.ageBand`.
- Privacy page: What we keep and Children rewritten; the coverage test reads
  the `ParentalConsent` model for the three facts it names.
- `e2e/age-band.spec.ts`: the welcome flow under 13, the API's refusals, and
  a change on the Profile tab.
