import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Newdryve · Early Access",
    short_name: "Newdryve",
    description:
      "Newdryve. Early access for learner drivers and instructors in Norwich. Apply to join the first cohort.",
    start_url: "/",
    display: "standalone",
    background_color: "#F0EDF0",
    theme_color: "#2D6A4F",
    orientation: "portrait",
    categories: ["education", "lifestyle", "travel"],
    lang: "en-GB",
    icons: [
      {
        src: "/icon",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
