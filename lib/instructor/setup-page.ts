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

/**
 * Session-storage key for the token that opened Stripe Checkout. Checkout's
 * cancel URL no longer carries it (the API stopped handing an emailed bearer
 * token to Stripe), so the cancelled page reads it back from here to offer
 * "Try again". Tab-scoped, like the setup page link above.
 */
const MEMBERSHIP_TOKEN_KEY = "nd:instructor-membership-token";

export function rememberMembershipToken(token: string): void {
  try {
    sessionStorage.setItem(MEMBERSHIP_TOKEN_KEY, token);
  } catch {
    // Storage unavailable: the cancelled page falls back to the email link.
  }
}

export function readMembershipToken(): string | null {
  try {
    const stored = sessionStorage.getItem(MEMBERSHIP_TOKEN_KEY);
    return stored && stored.length >= 32 && stored.length <= 200 ? stored : null;
  } catch {
    return null;
  }
}
