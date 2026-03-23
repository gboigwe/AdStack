import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ToastContainer } from "@/components/toast";
import { OfflineBanner, ScrollToTop } from "@/components/ui";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'AdStack — Decentralized Advertising Platform',
    template: '%s | AdStack',
  },
  description:
    'Blockchain-powered advertising platform built on Stacks. Create, manage, and monetize ad campaigns with transparent, on-chain verification.',
  metadataBase: new URL('https://adstack.app'),
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    siteName: 'AdStack',
    title: 'AdStack — Decentralized Advertising Platform',
    description:
      'Create, manage, and monetize ad campaigns with transparent, on-chain verification on Stacks.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AdStack — Decentralized Advertising Platform',
    description:
      'Blockchain-powered advertising on Stacks with on-chain campaign verification.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-gray-950 dark:text-gray-100`}
      >
        <Providers>
          <OfflineBanner />
          <Header />
          <main id="main-content" className="min-h-screen">
            {children}
          </main>
          <Footer />
          <ToastContainer />
          <ScrollToTop />
        </Providers>
      </body>
    </html>
  );
}
