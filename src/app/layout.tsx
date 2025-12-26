import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SoundProvider } from "@/contexts/SoundContext";
import { UserProvider } from "@/contexts/UserContext";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import AuthProvider from "@/components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "クルクル - AI業務自動化サービス",
  description: "AIエージェントを育成して、あなたの仕事を自動化",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ThemeProvider>
            <UserProvider>
              <SoundProvider>
                <AuthenticatedLayout>
                  {children}
                </AuthenticatedLayout>
              </SoundProvider>
            </UserProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
