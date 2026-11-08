import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "SportArenaHub — Sports Facility Booking System",
  description:
    "Project 1: Sports Facility Booking System — Search, manage, and book sports facilities with real-time slot availability.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <LanguageProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="bg-white border-t border-slate-200 py-6 mt-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                <div>
                  <span className="font-bold text-slate-800">
                    SportArenaHub
                  </span>{" "}
                  — Project 1: Sports Facility Booking System (6730508321)
                </div>
                <div className="flex items-center gap-4">
                  <a
                    href="http://localhost:5000/api-docs"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-600 hover:underline font-medium"
                  >
                    Swagger API Docs (:5000/api-docs)
                  </a>
                  <span>•</span>
                  <a
                    href="http://localhost:5000/health"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    API Health Check
                  </a>
                </div>
              </div>
            </footer>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
