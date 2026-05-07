import type { Metadata } from "next";
import { Urbanist, Noto_Sans_Thai } from "next/font/google";
import { getLocale } from "next-intl/server";
import "./globals.css";

const sans = Urbanist({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const thai = Noto_Sans_Thai({
  weight: ["400", "500", "700"],
  subsets: ["thai"],
  display: "swap",
  variable: "--font-thai",
});

export const metadata: Metadata = {
  title: "Dailymood — your mood, every day",
  description: "Track your mood, journal, and discover patterns. AI-powered.",
  robots: { index: false, follow: false },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${sans.variable} ${thai.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
