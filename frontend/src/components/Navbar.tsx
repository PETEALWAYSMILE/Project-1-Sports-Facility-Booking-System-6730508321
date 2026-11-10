"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useFavorites } from "@/lib/ui-helpers";
import ProfileFavoritesModal from "./ProfileFavoritesModal";
import {
  Trophy,
  CalendarCheck,
  ShieldCheck,
  LogOut,
  Globe,
  Building2,
  User as UserIcon,
  Heart,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { lang, toggleLang, t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const userId = user?._id || user?.id;
  const { favoriteIds } = useFavorites(userId);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState<"profile" | "favorites">("profile");

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen to custom event so other pages (e.g., Bookings page) can open Profile/Favorites modal
  useEffect(() => {
    const handleOpenModal = (e: Event) => {
      const customEvent = e as CustomEvent<"profile" | "favorites">;
      setAccountModalTab(customEvent.detail || "profile");
      setAccountModalOpen(true);
    };
    window.addEventListener("sah-open-account-modal", handleOpenModal);
    return () =>
      window.removeEventListener("sah-open-account-modal", handleOpenModal);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    router.push("/login");
  };

  const openAccountSection = (tab: "profile" | "favorites") => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    setAccountModalTab(tab);
    setAccountModalOpen(true);
  };

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname?.startsWith(path);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-black/5 supports-[backdrop-filter]:bg-white/75 transition-all">
        <div className="max-w-container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus:outline-none rounded-full"
          >
            <div className="w-8 h-8 rounded-full bg-[#0071e3] flex items-center justify-center text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <span className="font-semibold text-lg tracking-tight text-[#1d1d1f]">
                SportArena<span className="text-[#0071e3]">Hub</span>
              </span>
            </div>
          </Link>

          {/* Center: Desktop Navigation */}
          <nav
            aria-label={t("เมนูหลัก", "Main navigation")}
            className="hidden md:flex items-center gap-1.5"
          >
            <Link
              href="/"
              className={`inline-flex items-center gap-2 min-h-[38px] px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                isActive("/") && !pathname?.startsWith("/facilities")
                  ? "text-[#0071e3] bg-[#0071e3]/10 font-semibold"
                  : "text-slate-600 hover:bg-black/5 hover:text-[#1d1d1f]"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>{t("สนามทั้งหมด", "All Courts")}</span>
            </Link>

            <Link
              href={user ? "/bookings" : "/login"}
              className={`inline-flex items-center gap-2 min-h-[38px] px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                isActive("/bookings")
                  ? "text-[#0071e3] bg-[#0071e3]/10 font-semibold"
                  : "text-slate-600 hover:bg-black/5 hover:text-[#1d1d1f]"
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>{t("การจองของฉัน", "My Bookings")}</span>
            </Link>

            {user?.role === "admin" && (
              <Link
                href="/admin"
                className={`inline-flex items-center gap-2 min-h-[38px] px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isActive("/admin")
                    ? "text-[#0071e3] bg-[#0071e3]/10 font-semibold"
                    : "text-slate-600 hover:bg-black/5 hover:text-[#1d1d1f]"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{t("จัดการระบบ", "Admin Panel")}</span>
              </Link>
            )}
          </nav>

          {/* Right: Language Switcher & Auth / Avatar */}
          <div className="flex items-center gap-2">
            {/* Favorites quick button */}
            <button
              type="button"
              onClick={() => openAccountSection("favorites")}
              aria-label={t("รายการโปรด", "Saved Courts")}
              className="relative min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-full text-slate-600 hover:bg-black/5 hover:text-[#1d1d1f] transition-colors"
            >
              <Heart className="w-4 h-4" />
              {favoriteIds.length > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#0071e3] text-white text-[10px] font-semibold flex items-center justify-center tabular-price">
                  {favoriteIds.length}
                </span>
              )}
            </button>

            {/* Language Toggle */}
            <button
              type="button"
              onClick={toggleLang}
              aria-label={t("สลับภาษา ไทย / อังกฤษ", "Switch language TH / EN")}
              className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1 rounded-full border border-slate-300/80 bg-white/70 hover:bg-white text-xs font-medium text-slate-700 hover:text-slate-900 transition-all active:scale-95 shadow-sm"
            >
              <Globe className="w-3.5 h-3.5 text-[#0071e3] shrink-0" />
              <span>{lang === "TH" ? "TH" : "EN"}</span>
            </button>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="menu"
                  aria-label={t("เมนูบัญชีผู้ใช้", "User account menu")}
                  className="inline-flex items-center gap-2 min-h-[38px] pl-2 pr-3 py-1 rounded-full border border-slate-300/80 bg-white/80 hover:bg-white transition-all shadow-sm active:scale-95"
                >
                  <div className="w-6 h-6 rounded-full bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center font-semibold text-xs">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="hidden sm:inline-block text-xs font-medium text-slate-800 max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-60 bg-white/95 backdrop-blur-xl rounded-2xl border border-black/5 shadow-elevated py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-sm font-semibold text-[#1d1d1f] truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-[#86868b] truncate">
                        {user.email}
                      </p>
                      <span className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#0071e3]/10 text-[#0071e3]">
                        {user.role === "admin"
                          ? t("ผู้ดูแลระบบ", "Administrator")
                          : t("สมาชิก", "Member")}
                      </span>
                    </div>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => openAccountSection("profile")}
                      className="w-full min-h-[40px] px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>{t("โปรไฟล์", "Profile")}</span>
                    </button>

                    <Link
                      href="/bookings"
                      role="menuitem"
                      onClick={() => setDropdownOpen(false)}
                      className="w-full min-h-[40px] px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                    >
                      <CalendarCheck className="w-4 h-4 text-slate-400" />
                      <span>{t("การจองของฉัน", "My Bookings")}</span>
                    </Link>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => openAccountSection("favorites")}
                      className="w-full min-h-[40px] px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2.5">
                        <Heart className="w-4 h-4 text-slate-400" />
                        <span>{t("รายการโปรด", "Saved Courts")}</span>
                      </span>
                      {favoriteIds.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 tabular-price">
                          {favoriteIds.length}
                        </span>
                      )}
                    </button>

                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        role="menuitem"
                        onClick={() => setDropdownOpen(false)}
                        className="w-full min-h-[40px] px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#0071e3]" />
                        <span>{t("แดชบอร์ดผู้ดูแลระบบ", "Admin Panel")}</span>
                      </Link>
                    )}

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="w-full min-h-[40px] px-4 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t("ออกจากระบบ", "Log Out")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2.5">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center min-h-[38px] px-5 py-1.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#0062c4] text-sm font-medium text-white shadow-[0_1px_2px_rgba(0,113,227,0.3)] transition-all active:scale-95 tracking-tight"
                >
                  {t("เข้าสู่ระบบ", "Log In")}
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center min-h-[38px] px-4 py-1.5 rounded-full border border-slate-300 hover:border-slate-400 bg-white/80 hover:bg-white text-sm font-medium text-slate-800 transition-all active:scale-95 shadow-sm tracking-tight"
                >
                  {t("ลงทะเบียน", "Sign Up")}
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={t("เปิดเมนู", "Toggle navigation menu")}
              aria-expanded={mobileMenuOpen}
              className="md:hidden min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-full text-slate-700 hover:bg-black/5"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Drawer / Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-black/5 bg-white/95 backdrop-blur-xl px-4 py-3 space-y-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 min-h-[44px] px-3 py-2 rounded-control text-sm font-medium ${
                isActive("/")
                  ? "bg-primary-light text-primary"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>{t("สนามทั้งหมด", "All Courts")}</span>
            </Link>

            <Link
              href={user ? "/bookings" : "/login"}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 min-h-[44px] px-3 py-2 rounded-control text-sm font-medium ${
                isActive("/bookings")
                  ? "bg-primary-light text-primary"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>{t("การจองของฉัน", "My Bookings")}</span>
            </Link>

            <button
              type="button"
              onClick={() => openAccountSection("favorites")}
              className="w-full flex items-center justify-between min-h-[44px] px-3 py-2 rounded-control text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <span className="flex items-center gap-2.5">
                <Heart className="w-4 h-4" />
                <span>{t("รายการโปรด", "Saved Courts")}</span>
              </span>
              {favoriteIds.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-primary-light text-primary tabular-price">
                  {favoriteIds.length}
                </span>
              )}
            </button>

            {user?.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 min-h-[44px] px-3 py-2 rounded-control text-sm font-medium ${
                  isActive("/admin")
                    ? "bg-primary-light text-primary"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{t("จัดการระบบ (แอดมิน)", "Admin Panel")}</span>
              </Link>
            )}

            {!user && (
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center min-h-[42px] px-4 py-2 rounded-full bg-[#0071e3] text-sm font-medium text-white shadow-sm active:scale-95 transition-all"
                >
                  {t("เข้าสู่ระบบ", "Log In")}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center min-h-[42px] px-4 py-2 rounded-full border border-slate-300 bg-white text-sm font-medium text-slate-800 shadow-sm active:scale-95 transition-all"
                >
                  {t("ลงทะเบียน", "Sign Up")}
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label={t("แถบเมนูด้านล่างบนมือถือ", "Mobile bottom navigation")}
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/80 backdrop-blur-xl border-t border-black/5 px-2 py-1 flex items-center justify-around supports-[backdrop-filter]:bg-white/75"
      >
        <Link
          href="/"
          className={`flex flex-col items-center justify-center min-h-[48px] px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
            isActive("/") && !pathname?.startsWith("/facilities")
              ? "text-[#0071e3]"
              : "text-slate-500 hover:text-[#1d1d1f]"
          }`}
        >
          <Building2 className="w-5 h-5 mb-0.5" />
          <span>{t("สนามทั้งหมด", "Courts")}</span>
        </Link>

        <Link
          href={user ? "/bookings" : "/login"}
          className={`flex flex-col items-center justify-center min-h-[48px] px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
            isActive("/bookings")
              ? "text-[#0071e3]"
              : "text-slate-500 hover:text-[#1d1d1f]"
          }`}
        >
          <CalendarCheck className="w-5 h-5 mb-0.5" />
          <span>{t("การจองของฉัน", "Bookings")}</span>
        </Link>

        <button
          type="button"
          onClick={() => openAccountSection("favorites")}
          className="flex flex-col items-center justify-center min-h-[48px] px-3 py-1 rounded-full text-[11px] font-medium text-slate-500 hover:text-[#1d1d1f]"
        >
          <Heart className="w-5 h-5 mb-0.5" />
          <span>{t("รายการโปรด", "Saved")}</span>
        </button>

        {user?.role === "admin" ? (
          <Link
            href="/admin"
            className={`flex flex-col items-center justify-center min-h-[48px] px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
              isActive("/admin")
                ? "text-[#0071e3]"
                : "text-slate-500 hover:text-[#1d1d1f]"
            }`}
          >
            <ShieldCheck className="w-5 h-5 mb-0.5" />
            <span>{t("แอดมิน", "Admin")}</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() =>
              user ? openAccountSection("profile") : router.push("/login")
            }
            className={`flex flex-col items-center justify-center min-h-[48px] px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
              isActive("/login") || isActive("/register")
                ? "text-[#0071e3]"
                : "text-slate-500 hover:text-[#1d1d1f]"
            }`}
          >
            <UserIcon className="w-5 h-5 mb-0.5" />
            <span>{user ? t("โปรไฟล์", "Profile") : t("เข้าสู่ระบบ", "Log In")}</span>
          </button>
        )}
      </nav>

      {/* Account Profile & Favorites Modal */}
      <ProfileFavoritesModal
        isOpen={accountModalOpen}
        initialTab={accountModalTab}
        onClose={() => setAccountModalOpen(false)}
      />
    </>
  );
}
