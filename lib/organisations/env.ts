export const PRODUCT_SUPABASE_URL = process.env.NEXT_PUBLIC_PRODUCT_SUPABASE_URL || "";
export const PRODUCT_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_PRODUCT_SUPABASE_ANON_KEY || "";
export const NEWDRYVE_API_ORIGIN = (process.env.NEWDRYVE_API_ORIGIN || "").replace(/\/$/, "");

export function assertOrganisationPortalEnv(): void {
  if (!PRODUCT_SUPABASE_URL || !PRODUCT_SUPABASE_ANON_KEY) {
    throw new Error(
      "Organisation portal Supabase env missing: set NEXT_PUBLIC_PRODUCT_SUPABASE_URL and NEXT_PUBLIC_PRODUCT_SUPABASE_ANON_KEY"
    );
  }
  if (!NEWDRYVE_API_ORIGIN) {
    throw new Error("Organisation portal API env missing: set NEWDRYVE_API_ORIGIN");
  }
}
