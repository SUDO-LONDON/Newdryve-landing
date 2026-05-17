import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Newdryve — Book Driving Lessons",
    short_name: "Newdryve",
    description:
      "Book driving lessons with DBS-verified instructors in Norwich. Real-time availability, pay by card, bank transfer, or cash.",
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
