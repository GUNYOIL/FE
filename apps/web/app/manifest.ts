import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "근요일",
    short_name: "근요일",
    description: "교내 헬스장 환경에 맞춘 운동 루틴, 기록, 단백질 관리 앱",
    id: "/",
    start_url: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "browser"],
    background_color: "#ffffff",
    theme_color: "#3182f6",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/apple-touch-icon.svg",
        sizes: "180x180",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/geunyoil_mark.svg",
        sizes: "1024x1024",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
