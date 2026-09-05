import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  "https://reserve-opal-xi.vercel.app";

const ogImageUrl =
  "https://reserve-opal-xi.vercel.app/opengraph-image";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "DACOPA | Reserva tu mesa",
    template: "%s | DACOPA",
  },

  description:
    "Reserva tu mesa en DACOPA · CDMX",

  openGraph: {
    title: "DACOPA | Reserva tu mesa",
    description:
      "Reserva tu mesa en DACOPA · CDMX",
    url: siteUrl,
    siteName: "DACOPA",
    locale: "es_MX",
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "DACOPA | Reserva tu mesa",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "DACOPA | Reserva tu mesa",
    description:
      "Reserva tu mesa en DACOPA · CDMX",
    images: [ogImageUrl],
  },

  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}