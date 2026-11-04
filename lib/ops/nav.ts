// The founder portal's map: a handful of sections, each with one line on what
// it is for. The sidebar, the Today page and the Outreach index all read from
// here, so a section is named and described the same way everywhere.

export interface OpsSection {
  href: string;
  label: string;
  /** One plain sentence: what you do there. */
  blurb: string;
}

export const TODAY: OpsSection = {
  href: "/ops",
  label: "Today",
  blurb: "What needs you now: overdue work, applications waiting, money left.",
};

/** The live business. */
export const RUN_SECTIONS: OpsSection[] = [
  {
    href: "/ops/instructors",
    label: "Instructors",
    blurb: "Approve applications, agree membership terms, change what an instructor pays.",
  },
  {
    href: "/ops/organisations",
    label: "Schools",
    blurb: "Driving schools on Newdryve: join codes, their instructors, fees and admin logins.",
  },
  {
    href: "/ops/money",
    label: "Money",
    blurb: "Funding received, what has been spent (with receipts), and what is owed back.",
  },
];

/** The CRM boards: people and organisations being chased. */
export const OUTREACH: OpsSection = {
  href: "/ops/outreach",
  label: "Outreach",
  blurb: "Boards for who we are chasing: instructors, learners, partners, creators, press and investors.",
};

/** How the company itself is run. */
export const TEAM_SECTIONS: OpsSection[] = [
  {
    href: "/ops/pipeline",
    label: "Delivery",
    blurb: "The build plan as a dependency graph: who is on what, and what finishing it unblocks.",
  },
  {
    href: "/ops/data-room",
    label: "Documents",
    blurb: "Company documents, private and versioned: incorporation, equity, legal, financial.",
  },
];

export const DUE: OpsSection = {
  href: "/ops/due",
  label: "Everything due",
  blurb: "Every dated action and obligation across all boards, overdue first.",
};

/** True inside the Outreach area: its index or any board. */
export function isOutreachPath(pathname: string): boolean {
  return /^\/ops\/(outreach|customers|marketing|investors)(\/|$)/.test(pathname);
}
