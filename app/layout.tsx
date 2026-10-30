import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Geist, Instrument_Sans } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const display = Instrument_Sans({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Set up your booking site · BookingTours",
  description: "Get your tours online and taking bookings in about fifteen minutes.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
