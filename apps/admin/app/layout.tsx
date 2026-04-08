import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "근요일 Admin",
  description: "근요일 운영용 관리자 화면",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link crossOrigin="" href="https://cdn.jsdelivr.net" rel="preconnect" />
        <link
          href="https://cdn.jsdelivr.net/gh/fonts-archive/Pretendard/subsets/Pretendard-dynamic-subset.css"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
