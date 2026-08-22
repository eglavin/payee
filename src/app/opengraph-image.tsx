import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Payee — bank transaction dashboard";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 24,
          padding: "0 100px",
          background: "#0a0a0a",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: 20,
            background: "#171717",
            color: "#fafafa",
            fontSize: 52,
            fontWeight: 700,
          }}
        >
          P
        </div>
        <div style={{ display: "flex", color: "#fafafa", fontSize: 72, fontWeight: 700 }}>
          Payee
        </div>
        <div style={{ display: "flex", color: "#a1a1a1", fontSize: 32, maxWidth: 820 }}>
          Breakdown of AIB and Revolut bank transactions by payee — parsed entirely in your
          browser.
        </div>
      </div>
    ),
    { ...size },
  );
}
