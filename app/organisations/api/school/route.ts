import { NextResponse } from "next/server";
import { SCHOOL_COOKIE, isUuid, safePortalNext } from "@/lib/organisations/scope";

export const dynamic = "force-dynamic";

/**
 * The school picker's form. Remembers the chosen school for this browser (or
 * forgets it for "all my schools") and goes back to the page that asked.
 * Which schools a login may open is still the API's decision on every call:
 * a school that is not theirs is refused there, and the portal asks again.
 */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ error: "This request did not come from the organisation portal." }, { status: 403 });
  }
  const form = await request.formData().catch(() => null);
  const organisationId = form?.get("organisation_id");
  const next = safePortalNext(typeof form?.get("next") === "string" ? String(form?.get("next")) : null);

  // A relative Location: behind the landing router request.url is Next's own
  // internal address, not the one the browser used.
  const response = new NextResponse(null, { status: 303, headers: { location: next, "cache-control": "no-store" } });
  if (isUuid(organisationId)) {
    response.cookies.set(SCHOOL_COOKIE, organisationId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/organisations",
      maxAge: 60 * 60 * 24 * 30,
    });
  } else {
    response.cookies.delete({ name: SCHOOL_COOKIE, path: "/organisations" });
  }
  return response;
}
