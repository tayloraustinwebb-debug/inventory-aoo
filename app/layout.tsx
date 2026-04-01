import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paint Pals Inventory",
  description: "Phone and tablet inventory app starter for Paint Pals."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
