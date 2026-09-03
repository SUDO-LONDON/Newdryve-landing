import "server-only";

import { NEWDRYVE_API_ORIGIN, assertOrganisationPortalEnv } from "@/lib/organisations/env";
import type { OpsOrganisationWithMembers } from "@/lib/ops/types";

export class OrganisationPortalApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

export async function loadOrganisationPortal(
  accessToken: string
): Promise<OpsOrganisationWithMembers[]> {
  assertOrganisationPortalEnv();
  let response: Response;
  try {
    response = await fetch(`${NEWDRYVE_API_ORIGIN}/v1/organisations/me`, {
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
  } catch {
    throw new OrganisationPortalApiError("Could not reach Newdryve.", 502);
  }

  const body = (await response.json().catch(() => null)) as {
    items?: OpsOrganisationWithMembers[];
    error?: string | { message?: string };
  } | null;

  if (!response.ok) {
    const message =
      typeof body?.error === "string"
        ? body.error
        : body?.error?.message || "Could not load your organisation.";
    throw new OrganisationPortalApiError(message, response.status);
  }

  return body?.items ?? [];
}
