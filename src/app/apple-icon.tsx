import { ImageResponse } from "next/og";

/**
 * Generated rather than checked in, so the home-screen icon cannot drift from
 * icon.svg - both draw the same diya. Safari ignores SVG for apple-touch-icon,
 * which is why this one has to be a raster.
 */
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
          background: "#FF5F15",
        }}
      >
        {/* Apple applies its own rounding, so this one is drawn square. */}
        <svg width="180" height="180" viewBox="0 0 512 512">
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
      </div>
    ),
    size
  );
}
