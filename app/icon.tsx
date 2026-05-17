import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 6,
          color: "white",
          fontSize: 22,
          fontWeight: 800,
          fontFamily: '"DM Sans", system-ui, sans-serif',
          letterSpacing: -1,
        }}
      >
        N
      </div>
    ),
    { ...size },
  );
}
