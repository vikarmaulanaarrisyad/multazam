import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { PwaUpdatePrompt } from "@/components/pwa-update-prompt";
import { GlobalDeveloperModalClient } from "@/components/GlobalDeveloperModalClient";
import prisma from "@/lib/prisma";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistem Inventori DIA MAKMUR ABADI",
  description: "Aplikasi Manajemen Inventori DIA MAKMUR ABADI",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DIA MAKMUR ABADI",
  },
  icons: {
    apple: "/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let setting = null;
  try {
    setting = await prisma.setting.findFirst();
  } catch (error) {
    console.error("Failed to fetch settings for GlobalModal", error);
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-center" richColors />
        <PwaInstallPrompt />
        <PwaUpdatePrompt />
        {setting?.showDeveloperModal && (
          <GlobalDeveloperModalClient 
            show={true}
            title={setting.developerModalTitle}
            content={setting.developerModalContent}
          />
        )}
      </body>
    </html>
  );
}
