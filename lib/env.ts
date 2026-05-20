// External app URLs. The dashboard + login routes live in a separate repo.
// Override at build time:
//   NEXT_PUBLIC_APP_URL=https://app.newdryve.com
//   NEXT_PUBLIC_SITE_URL=https://newdryve.com
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.newdryve.com";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://newdryve.com";

export const DASHBOARD_URL = `${APP_URL}/dashboard`;
export const LOGIN_URL = `${APP_URL}/login`;
