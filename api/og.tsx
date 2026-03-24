import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

export default function handler() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          background: "#0e0e0e",
          position: "relative",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top accent bar */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "1200px", height: "5px", background: "#44aaff", display: "flex" }} />

        {/* Card surface */}
        <div
          style={{
            position: "absolute",
            top: "100px",
            left: "80px",
            width: "1040px",
            height: "430px",
            background: "#181818",
            border: "1px solid #2a2a2a",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingLeft: "80px",
          }}
        >
          {/* Left accent strip */}
          <div style={{ position: "absolute", top: 0, left: 0, width: "6px", height: "430px", background: "#44aaff", borderRadius: "3px", display: "flex" }} />

          {/* Title */}
          <div style={{ fontSize: "88px", fontWeight: 700, color: "#f0f0f0", letterSpacing: "-2px", display: "flex" }}>
            HowMuchUp
          </div>

          {/* Subtitle */}
          <div style={{ fontSize: "30px", color: "#777", marginTop: "8px", display: "flex" }}>
            Galactica gUBI rank &amp; reward simulator
          </div>

          {/* Tags */}
          <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
            {["veGNET", "SoulScore", "gUBI"].map((tag) => (
              <div
                key={tag}
                style={{
                  background: "#0e2030",
                  color: "#44aaff",
                  fontSize: "18px",
                  padding: "8px 20px",
                  borderRadius: "6px",
                  display: "flex",
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom accent bar */}
        <div style={{ position: "absolute", bottom: 0, left: 0, width: "1200px", height: "5px", background: "#44aaff", opacity: 0.3, display: "flex" }} />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
