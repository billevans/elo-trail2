import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "ELO Trail",
  description: "Age of Empires IV ELO tracking",
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