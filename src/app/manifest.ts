import type { MetadataRoute } from "next";

/**
 * Makes the site installable as an app. Installable only - there is no
 * service worker, so nothing here promises offline use.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sanatani Seva",
    short_name: "Sanatani Seva",
    description:
      "Homes, trusted local services, a resident marketplace, bus timings and the estate newspaper for Hiranandani Estate, Thane.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FAF8F5",
    theme_color: "#FAF8F5",
    // Drawn from the same diya as icon.svg; see public/icons
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
