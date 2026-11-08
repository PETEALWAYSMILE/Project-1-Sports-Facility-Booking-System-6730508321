"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  Trophy,
  CalendarCheck,
  ShieldCheck,
  LogOut,
  LogIn,
  UserPlus,
  Globe,
  Building2,
  User as UserIcon,
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { lang, toggleLang, t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const navLinkClass = (path: string) => {
    const active =
      path === "/" ? pathname === "/" : pathname?.startsWith(path);
    return `inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
      active
        ? "bg-emerald-600 text-white shadow-sm"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-slate-900 block leading-none">
              SportArena<span className="text-emerald-600">Hub</span>
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {t("ระบบจองสถานที่และสนามกีฬา", "Sports Facility Booking System")}
            </span>
          </div>
        </Link>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-1.5">
          <Link href="/" className={navLinkClass("/")}>
            <Building2 className="w-4 h-4" />
            {t("สนามกีฬาทั้งหมด", "Facilities")}
          </Link>

          {user && (
            <Link href="/bookings" className={navLinkClass("/bookings")}>
              <CalendarCheck className="w-4 h-4" />
              {user.role === "admin"
                ? t("จัดการการจองทั้งหมด", "All Bookings")
                : t("การจองของฉัน", "My Bookings")}
            </Link>
          )}

          {user?.role === "admin" && (
            <Link href="/admin" className={navLinkClass("/admin")}>
              <ShieldCheck className="w-4 h-4" />
              {t("จัดการระบบ (Admin)", "Admin Dashboard")}
            </Link>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Language Switcher */}
          <button
            onClick={toggleLang}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
            title={t("สลับภาษา ไทย / English", "Switch Language TH / EN")}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === "TH" ? "TH 🇹🇭" : "EN 🇬🇧"}</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  {user.name?.charAt(0).toUpperCase() || <UserIcon className="w-3.5 h-3.5" />}
                </div>
                <div className="text-left leading-tight">
                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <span className="truncate max-w-[120px]">{user.name}</span>
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                        user.role === "admin"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                    {user.email}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t("ออกจากระบบ", "Logout")}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                {t("เข้าสู่ระบบ", "Log In")}
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {t("ลงทะเบียน", "Register")}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-100 bg-slate-50/80 py-1.5 px-2">
        <Link href="/" className={navLinkClass("/")}>
          <Building2 className="w-4 h-4" />
          {t("สนามกีฬา", "Facilities")}
        </Link>
        {user && (
          <Link href="/bookings" className={navLinkClass("/bookings")}>
            <CalendarCheck className="w-4 h-4" />
            {user.role === "admin"
              ? t("การจองทั้งหมด", "All Bookings")
              : t("การจองของฉัน", "My Bookings")}
          </Link>
        )}
        {user?.role === "admin" && (
          <Link href="/admin" className={navLinkClass("/admin")}>
            <ShieldCheck className="w-4 h-4" />
            {t("ผู้ดูแลระบบ", "Admin")}
          </Link>
        )}
      </div>
    </header>
  );
}
