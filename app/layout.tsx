import type { Metadata } from "next";
import SiteShell from "@/app/components/SiteShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Korea Price Index",
  description: "Compare Korea-based price-level indicators with G20 economies.",
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
