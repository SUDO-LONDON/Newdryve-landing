import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Newdryve · Early Access in Norwich";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background:
            "radial-gradient(ellipse 80% 60% at 75% 20%, rgba(232,82,122,0.18), transparent 70%), radial-gradient(ellipse 60% 80% at 20% 80%, rgba(45,106,79,0.18), transparent 70%), #F0EDF0",
          fontFamily: '"DM Sans", system-ui, sans-serif',
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: -1,
              lineHeight: 1,
            }}
          >
            <span style={{ color: "#2D6A4F" }}>newdr</span>
            <span style={{ color: "#E8527A" }}>y</span>
            <span style={{ color: "#2D6A4F" }}>ve</span>
          </span>
          <span
            style={{
              display: "flex",
              fontSize: 14,
              fontWeight: 700,
              color: "#E8527A",
              textTransform: "uppercase",
              letterSpacing: 2,
              border: "1.5px solid rgba(232,82,122,0.3)",
              padding: "6px 14px",
              borderRadius: 999,
              backgroundColor: "rgba(248,242,244,0.7)",
            }}
          >
            Norwich · Early access
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <h1
            style={{
              fontSize: 84,
              fontWeight: 800,
              letterSpacing: -3,
              color: "#0A0A14",
              lineHeight: 1.02,
              margin: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>A new way to learn</span>
            <span style={{ display: "flex" }}>
              to drive in
              <span
                style={{
                  marginLeft: 24,
                  background: "linear-gradient(90deg, #2D6A4F 0%, #E8527A 100%)",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                Norwich.
              </span>
            </span>
          </h1>

          <p
            style={{
              fontSize: 28,
              color: "#6B6B84",
              fontWeight: 500,
              lineHeight: 1.4,
              margin: 0,
              maxWidth: 900,
            }}
          >
            We&rsquo;re building Newdryve. Apply for early access as a learner or as an ADI-qualified instructor.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 36, alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: "#2D6A4F" }}>For learners</span>
              <span style={{ fontSize: 16, color: "#6B6B84", fontWeight: 500 }}>Be first in line for lessons</span>
            </div>
            <div style={{ width: 1, height: 48, backgroundColor: "#E8E8F2", display: "flex" }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: "#E8527A" }}>For instructors</span>
              <span style={{ fontSize: 16, color: "#6B6B84", fontWeight: 500 }}>Join the founding group</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              backgroundColor: "#0A0A14",
              color: "white",
              padding: "14px 24px",
              borderRadius: 999,
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            <span style={{ display: "flex" }}>Apply for early access →</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
