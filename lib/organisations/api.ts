import "server-only";

import { NEWDRYVE_API_ORIGIN, assertOrganisationPortalEnv } from "@/lib/organisations/env";
import { mapOrganisationResponse } from "@/lib/ops/organisations";
import type { OpsOrganisationWithMembers } from "@/lib/ops/types";
import { readUnavailable, type UnavailableOrganisation } from "@/lib/organisations/unavailable";

export class OrganisationPortalApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

export interface OrganisationPortalData {
  organisations: OpsOrganisationWithMembers[];
  /** This admin's schools that Newdryve paused or closed (#499); empty from an older API. */
  unavailable: UnavailableOrganisation[];
}

export async function loadOrganisationPortal(
  accessToken: string
): Promise<OrganisationPortalData> {
  assertOrganisationPortalEnv();
  let response: Response;
  try {
    response = await fetch(`${NEWDRYVE_API_ORIGIN}/v1/organisations/me`, {
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new OrganisationPortalApiError("Could not reach Newdryve.", 502);
  }

  const body = (await response.json().catch(() => null)) as {
    items?: Parameters<typeof mapOrganisationResponse>[0][];
    unavailable?: unknown;
    error?: string | { message?: string };
  } | null;

  if (!response.ok) {
    const message =
      typeof body?.error === "string"
        ? body.error
        : body?.error?.message || "Could not load your organisation.";
    throw new OrganisationPortalApiError(message, response.status);
  }

  // Map, never cast. The API's field names are not the client's, and the ops
  // panel has always translated them — the portal skipping that step is what
  // made every member row blank.
  return {
    organisations: (body?.items ?? []).map(mapOrganisationResponse),
    unavailable: readUnavailable(body?.unavailable),
  };
}
