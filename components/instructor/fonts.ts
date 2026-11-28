/**
 * The redesign typefaces, loaded only by the instructor onboarding pages.
 *
 * The root layout still loads DM Sans and Fraunces for the ops and
 * organisations portals. These three are exposed as CSS variables on the
 * `.nd-theme` wrapper (see OnboardingFrame in Shell.tsx), and
 * app/instructor-theme.css reads them from there, so nothing outside that
 * wrapper ever picks them up.
 */
import { Bricolage_Grotesque, Caveat, Instrument_Sans } from "next/font/google";

const bricolage = Bricolage_Grotesque({
  variable: "--nd-font-bricolage",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  variable: "--nd-font-instrument",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

// For the one hand-written aside a page may carry. Not preloaded: the browser
// only fetches it if a page actually sets something in it.
const caveat = Caveat({
  variable: "--nd-font-caveat",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
  preload: false,
});

export const themeFontVariables = `${bricolage.variable} ${instrumentSans.variable} ${caveat.variable}`;
