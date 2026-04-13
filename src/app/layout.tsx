import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Satria Elektronik - Toko Elektronik Terpercaya",
  description: "Toko Elektronik Terpercaya dengan Layanan Service Panggilan. Belanja produk elektronik berkualitas dengan harga terbaik.",
  keywords: ["Satria Elektronik", "elektronik", "e-commerce", "TokoKu", "produk", "varian", "service", "pesanan", "service panggilan"],
  authors: [{ name: "Satria Elektronik" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Satria Elektronik",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    title: "Satria Elektronik - Toko Elektronik Terpercaya",
    description: "Toko Elektronik Terpercaya dengan Layanan Service Panggilan",
    type: "website",
    url: "https://banjarelektro.vercel.app",
    siteName: "Satria Elektronik",
  },
  twitter: {
    card: "summary",
    title: "Satria Elektronik",
    description: "Toko Elektronik Terpercaya dengan Layanan Service Panggilan",
  },
};

export const viewport: Viewport = {
  themeColor: "#0891b2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        <meta name="msapplication-TileColor" content="#0891b2" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
