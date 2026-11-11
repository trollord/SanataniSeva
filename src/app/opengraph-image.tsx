import { ImageResponse } from "next/og";

/**
 * Link preview card for WhatsApp, which is how most of this gets shared.
 * Generated at build time so it cannot drift from the brand, and no binary
 * needs checking in. Next reuses it for the Twitter card too.
 */
export const alt =
  "Sanatani Seva - homes, local services and marketplace for Hiranandani Estate, Thane";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#1C0A00",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 512 512">
            <rect width="512" height="512" rx="116" fill="#FF5F15" />
            <path
              fill="#fff"
              d="M256 104c6 0 10 4 13 9 14 25 28 44 40 61 15 21 24 41 24 64a77 77 0 0 1-154 0c0-23 9-43 24-64 12-17 26-36 40-61 3-5 7-9 13-9z"
            />
            <path
              fill="#fff"
              d="M104 318h304c0 14-6 27-17 38-25 25-78 42-135 42s-110-17-135-42c-11-11-17-24-17-38z"
            />
            <rect x="104" y="296" width="304" height="26" rx="13" fill="#fff" />
          </svg>
          <div style={{ display: "flex", fontSize: 40, color: "#fff", letterSpacing: -1 }}>
            <span style={{ fontWeight: 700 }}>Sanatani</span>
            <span style={{ color: "rgba(255,255,255,0.55)", marginLeft: 10 }}>Seva</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 68,
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.12,
            marginTop: 56,
            maxWidth: 940,
            letterSpacing: -2,
          }}
        >
          Everything Hiranandani Estate needs, in one place.
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "rgba(255,255,255,0.55)",
            marginTop: 28,
            maxWidth: 900,
            lineHeight: 1.4,
          }}
        >
          Flats for rent and sale · Trusted local services · Marketplace · Bus timings
        </div>
      </div>
    ),
    size
  );
}
