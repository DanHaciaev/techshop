import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const revalidate = 86400;

const TONES = [
  ["#1d4ed8", "#0b1120"],
  ["#0ea5e9", "#0b1120"],
  ["#4f46e5", "#0b1120"],
  ["#0891b2", "#0b1120"],
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "Акция";
  const subtitle = searchParams.get("subtitle") ?? "";
  const badge = searchParams.get("badge") ?? "";
  const seed = Number(searchParams.get("seed") ?? "0");
  const [from, to] = TONES[Math.abs(seed) % TONES.length];

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 90px",
          background: `linear-gradient(120deg, ${from} 0%, ${to} 100%)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -120,
            top: -120,
            width: 520,
            height: 520,
            borderRadius: 999,
            background: "rgba(255,255,255,0.08)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 60,
            bottom: -160,
            width: 320,
            height: 320,
            borderRadius: 999,
            background: "rgba(255,255,255,0.06)",
            display: "flex",
          }}
        />
        {badge ? (
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              background: "rgba(255,255,255,0.16)",
              color: "white",
              fontSize: 28,
              fontWeight: 700,
              padding: "10px 26px",
              borderRadius: 999,
              marginBottom: 28,
              fontFamily: "sans-serif",
            }}
          >
            {badge}
          </div>
        ) : null}
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 800,
            color: "white",
            fontFamily: "sans-serif",
            maxWidth: 900,
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              display: "flex",
              marginTop: 20,
              fontSize: 30,
              color: "rgba(255,255,255,0.82)",
              fontFamily: "sans-serif",
              maxWidth: 780,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
    ),
    { width: 1600, height: 640 }
  );
}
