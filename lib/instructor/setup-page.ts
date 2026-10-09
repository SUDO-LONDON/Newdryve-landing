/**
 * Session-storage key holding the instructor's setup page URL (with its
 * token) while they are away at Stripe Checkout. Shared by the setup page,
 * which writes it, and the Checkout return page, which offers the way back.
 */
export const SETUP_PAGE_KEY = "nd:instructor-setup-page";

/** Only ever a same-site setup page link, never somewhere else. */
export function isSetupPagePath(value: string | null): value is string {
  return !!value && value.startsWith("/instructor/start?token=");
}
