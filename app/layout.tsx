import type { Metadata } from "next";
import { Space_Grotesk, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "BookingTours — Set Up Your Adventure Business",
  description:
    "The complete booking platform for adventure and tourism businesses. Set up your booking website, AI assistant, and admin dashboard in minutes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${sourceSerif.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
