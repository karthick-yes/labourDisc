import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PaniBook",
    short_name: "PaniBook",
    description: "Workers and needs, matched",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#eef0f3",
    theme_color: "#c8102e",
    lang: "ml",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
