import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "K-Collusion Index",
  description:
    "A Numbeo and OECD based dashboard for Korean consumer price distortion signals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
