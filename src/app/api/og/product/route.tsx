import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const revalidate = 86400;

const TONES = [
  ["#2563eb", "#1e3a8a"],
  ["#0ea5e9", "#075985"],
  ["#6366f1", "#312e81"],
  ["#0891b2", "#164e63"],
  ["#3b82f6", "#1e40af"],
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "Товар";
  const category = searchParams.get("category") ?? "";
  const seed = Number(searchParams.get("seed") ?? "0");
  const [from, to] = TONES[Math.abs(seed) % TONES.length];
  const initials = title
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 220,
            height: 220,
            borderRadius: 999,
            background: "rgba(255,255,255,0.14)",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 84,
            fontWeight: 700,
            color: "white",
            fontFamily: "sans-serif",
            border: "4px solid rgba(255,255,255,0.35)",
          }}
        >
          {initials}
        </div>
        {category ? (
          <div
            style={{
              marginTop: 28,
              fontSize: 26,
              color: "rgba(255,255,255,0.85)",
              fontFamily: "sans-serif",
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            {category}
          </div>
        ) : null}
      </div>
    ),
    { width: 800, height: 800 }
  );
}
