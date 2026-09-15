/**
 * Emails are compared folded; Google gives them in whatever case the user typed once.
 *
 * Its own module so the member row reader and the member store can both use it
 * without importing each other.
 */
export function foldEmail(email: string): string {
  return email.trim().toLowerCase();
}
