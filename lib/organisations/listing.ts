/**
 * An organisation's public listing fields, checked the way the API checks
 * them (backend listingFields), so a mistake shows before the round trip.
 * Client-safe.
 */

export interface ListingDraft {
  bio: string;
  logo_url: string;
  primary_color: string;
}

export const MAX_BIO_LENGTH = 2000;
const HEX_COLOUR = /^#[0-9A-Fa-f]{6}$/;
const HTTPS_URL = /^https:\/\/[^\s]+$/;

/** Blank fields become null, which clears them. */
export function listingInputFromDraft(
  draft: ListingDraft
): { ok: true; input: { bio: string | null; logo_url: string | null; primary_color: string | null } } | { ok: false; error: string } {
  const bio = draft.bio.trim();
  const logo = draft.logo_url.trim();
  const colour = draft.primary_color.trim();
  if (bio.length > MAX_BIO_LENGTH) return { ok: false, error: `The bio must be ${MAX_BIO_LENGTH} characters or fewer.` };
  if (logo && (logo.length > 1000 || !HTTPS_URL.test(logo))) {
    return { ok: false, error: "The logo URL must start with https:// and contain no spaces." };
  }
  if (colour && !HEX_COLOUR.test(colour)) {
    return { ok: false, error: "The brand colour must be a hex code like #2D6A4F." };
  }
  return { ok: true, input: { bio: bio || null, logo_url: logo || null, primary_color: colour || null } };
}

export function isHexColour(value: string): boolean {
  return HEX_COLOUR.test(value.trim());
}
