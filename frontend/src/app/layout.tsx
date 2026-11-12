import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title:
    "SportArenaHub — จองสนามกีฬาออนไลน์ แบดมินตัน เทนนิส ฟุตซอล บาสเกตบอล ฟิตเนส",
  description:
    "ค้นหาและจองสนามกีฬาได้ทันที เช็คตารางเวลาว่างแบบเรียลไทม์ รองรับแบดมินตัน เทนนิส ฟุตซอล บาสเกตบอล และฟิตเนส",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#F6F5F0] text-[#181A18] font-sans antialiased">
        <LanguageProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
