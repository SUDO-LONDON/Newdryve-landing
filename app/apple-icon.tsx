import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2D6A4F",
          color: "white",
          fontSize: 120,
          fontWeight: 800,
          fontFamily: '"DM Sans", system-ui, sans-serif',
          letterSpacing: -4,
        }}
      >
        N
      </div>
    ),
    { ...size },
  );
}
