import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { DotGothic16 } from "next/font/google";
import "./globals.css";

const dotGothic16 = DotGothic16({
  variable: "--font-dot-gothic-16",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Particle Box Drum Machine",
  description: "A visual drum machine with particle physics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={dotGothic16.variable}>
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
