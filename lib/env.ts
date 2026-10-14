// External URLs. Override at build time:
//   NEXT_PUBLIC_SITE_URL=https://newdryve.com
// app.newdryve.com is no longer the web app; it is a download page with
// App Store and Google Play buttons, so nothing here links to it.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://newdryve.com";
