import type { Metadata } from "next";
import { Handjet } from "next/font/google";
import "./globals.css";

const handjet = Handjet({
  variable: "--font-handjet",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
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
    <html lang="en">
      <body
        className={`${handjet.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
