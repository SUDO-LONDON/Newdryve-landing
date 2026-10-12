import { orgProxy, uuidOrNull } from "@/lib/organisations/portal";

export const dynamic = "force-dynamic";

/**
 * The notification bell's list, polled while the tab is visible. Only the
 * query parameters the API takes are forwarded, and only when well formed.
 */
export async function GET(request: Request) {
  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  const org = uuidOrNull(incoming.get("organisation_id"));
  if (org) query.set("organisation_id", org);
  const limit = Number(incoming.get("limit"));
  if (Number.isInteger(limit) && limit >= 1 && limit <= 100) query.set("limit", String(limit));
  const offset = Number(incoming.get("offset"));
  if (Number.isInteger(offset) && offset >= 0 && offset <= 10_000) query.set("offset", String(offset));
  if (incoming.get("unread_only") === "true") query.set("unread_only", "true");
  const qs = query.toString();
  return orgProxy(request, `/v1/organisations/me/notifications${qs ? `?${qs}` : ""}`, "GET");
}
