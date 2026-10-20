import "server-only";

import { cookies } from "next/headers";
import { SCHOOL_COOKIE, isUuid } from "@/lib/organisations/scope";

/** The school this browser chose in the portal's picker, or null for "all of mine". */
export async function getChosenSchool(): Promise<string | null> {
  const value = (await cookies()).get(SCHOOL_COOKIE)?.value;
  return isUuid(value) ? value : null;
}
