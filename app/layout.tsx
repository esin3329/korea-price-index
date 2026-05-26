import type { Metadata } from "next";
import SiteShell from "@/app/components/SiteShell";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://korea-price-index.pages.dev"),
  title: "Korea Price Index",
  description: "한국을 기준값 100으로 둔 G20 가격수준 비교 대시보드와 국가별 해설.",
  openGraph: {
    title: "Korea Price Index",
    description: "한국 기준 글로벌 가격수준 비교 대시보드",
    siteName: "Korea Price Index",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
