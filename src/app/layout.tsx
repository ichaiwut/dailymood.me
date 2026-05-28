import type { Metadata } from "next";
import Script from "next/script";
import { Urbanist, Noto_Sans_Thai } from "next/font/google";
import { getLocale } from "next-intl/server";
import { PageViewTracker } from "@/components/page-view-tracker";
import "./globals.css";

const GA_ID = "G-MQKCJQP4NP";
const isProd = process.env.NODE_ENV === "production";

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
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dailymood",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
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
      suppressHydrationWarning
      className={`${sans.variable} ${thai.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#f9a8d4" />
      </head>
      <body className="min-h-full flex flex-col">
        <Script id="dark-mode-init" strategy="beforeInteractive">{`(function(){try{var t=localStorage.getItem("theme")||"light";var d=t==="auto"?window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light":t;if(d==="dark")document.documentElement.classList.add("dark")}catch(e){}})()`}</Script>
        {isProd && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="gtag-init" strategy="afterInteractive">{`
              window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
              gtag('js',new Date());gtag('config','${GA_ID}',{'send_page_view':false});
            `}</Script>
            <PageViewTracker />
          </>
        )}
        {children}
      </body>
    </html>
  );
}
