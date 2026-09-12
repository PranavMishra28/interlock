import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Interlock Control Room",
  description: "Evidence for one revision-bound operational constraint.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
