import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
