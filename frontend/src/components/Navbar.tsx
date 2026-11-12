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
  const [accountModalTab, setAccountModalTab] = useState<
    "profile" | "favorites"
  >("profile");

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
      <header className="sticky top-0 z-40 bg-[#F6F5F0]/95 backdrop-blur-md border-b border-[#E2DFD7]">
        <div className="max-w-container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand Logo — Monolith Clubhouse Emblem */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus:outline-none rounded-lg"
          >
            <div className="w-8 h-8 rounded-lg bg-[#143628] flex items-center justify-center text-white shadow-soft">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <span className="font-semibold text-base sm:text-lg tracking-tight text-[#181A18]">
                SportArenaHub
              </span>
            </div>
          </Link>

          {/* Center: Desktop Navigation */}
          <nav
            aria-label={t("เมนูหลัก", "Main navigation")}
            className="hidden md:flex items-center gap-1"
          >
            <Link
              href="/"
              className={`inline-flex items-center gap-2 min-h-[38px] px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive("/") && !pathname?.startsWith("/facilities")
                  ? "text-[#143628] bg-[#EBF2EE] font-semibold"
                  : "text-[#4A4F4B] hover:bg-[#EFECE6] hover:text-[#181A18]"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>{t("สนามทั้งหมด", "All Courts")}</span>
            </Link>

            <Link
              href={user ? "/bookings" : "/login"}
              className={`inline-flex items-center gap-2 min-h-[38px] px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive("/bookings")
                  ? "text-[#143628] bg-[#EBF2EE] font-semibold"
                  : "text-[#4A4F4B] hover:bg-[#EFECE6] hover:text-[#181A18]"
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>{t("การจองของฉัน", "My Bookings")}</span>
            </Link>

            {user?.role === "admin" && (
              <Link
                href="/admin"
                className={`inline-flex items-center gap-2 min-h-[38px] px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/admin")
                    ? "text-[#143628] bg-[#EBF2EE] font-semibold"
                    : "text-[#4A4F4B] hover:bg-[#EFECE6] hover:text-[#181A18]"
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
              className="relative min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg text-[#4A4F4B] hover:bg-[#EFECE6] hover:text-[#181A18] transition-colors"
            >
              <Heart className="w-4 h-4" />
              {favoriteIds.length > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-md bg-[#143628] text-white text-[10px] font-semibold flex items-center justify-center tabular-price">
                  {favoriteIds.length}
                </span>
              )}
            </button>

            {/* Language Toggle */}
            <button
              type="button"
              onClick={toggleLang}
              aria-label={t(
                "สลับภาษา ไทย / อังกฤษ",
                "Switch language TH / EN"
              )}
              className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1 rounded-lg border border-[#D2CEC3] bg-white hover:bg-[#F3F1EC] text-xs font-medium text-[#181A18] transition-colors shadow-soft"
            >
              <Globe className="w-3.5 h-3.5 text-[#143628] shrink-0" />
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
                  className="inline-flex items-center gap-2 min-h-[38px] pl-2 pr-2.5 py-1 rounded-lg border border-[#D2CEC3] bg-white hover:bg-[#F3F1EC] transition-colors shadow-soft"
                >
                  <div className="w-6 h-6 rounded-md bg-[#143628] text-white flex items-center justify-center font-semibold text-xs">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="hidden sm:inline-block text-xs font-medium text-[#181A18] max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#767B76]" />
                </button>

                {dropdownOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-60 bg-white rounded-xl border border-[#D2CEC3] shadow-elevated py-1.5 z-50"
                  >
                    <div className="px-4 py-2.5 border-b border-[#EFECE6]">
                      <p className="text-sm font-semibold text-[#181A18] truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-[#767B76] truncate">
                        {user.email}
                      </p>
                      <span className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#EBF2EE] text-[#143628]">
                        {user.role === "admin"
                          ? t("ผู้ดูแลระบบ", "Administrator")
                          : t("สมาชิก", "Member")}
                      </span>
                    </div>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => openAccountSection("profile")}
                      className="w-full min-h-[40px] px-4 py-2 text-left text-sm text-[#181A18] hover:bg-[#F6F5F0] flex items-center gap-2.5"
                    >
                      <UserIcon className="w-4 h-4 text-[#767B76]" />
                      <span>{t("โปรไฟล์", "Profile")}</span>
                    </button>

                    <Link
                      href="/bookings"
                      role="menuitem"
                      onClick={() => setDropdownOpen(false)}
                      className="w-full min-h-[40px] px-4 py-2 text-left text-sm text-[#181A18] hover:bg-[#F6F5F0] flex items-center gap-2.5"
                    >
                      <CalendarCheck className="w-4 h-4 text-[#767B76]" />
                      <span>{t("การจองของฉัน", "My Bookings")}</span>
                    </Link>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => openAccountSection("favorites")}
                      className="w-full min-h-[40px] px-4 py-2 text-left text-sm text-[#181A18] hover:bg-[#F6F5F0] flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2.5">
                        <Heart className="w-4 h-4 text-[#767B76]" />
                        <span>{t("รายการโปรด", "Saved Courts")}</span>
                      </span>
                      {favoriteIds.length > 0 && (
                        <span className="px-2 py-0.5 rounded-md text-xs bg-[#EFECE6] text-[#181A18] tabular-price">
                          {favoriteIds.length}
                        </span>
                      )}
                    </button>

                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        role="menuitem"
                        onClick={() => setDropdownOpen(false)}
                        className="w-full min-h-[40px] px-4 py-2 text-left text-sm text-[#181A18] hover:bg-[#F6F5F0] flex items-center gap-2.5"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#143628]" />
                        <span>
                          {t("แดชบอร์ดผู้ดูแลระบบ", "Admin Panel")}
                        </span>
                      </Link>
                    )}

                    <div className="border-t border-[#EFECE6] mt-1 pt-1">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="w-full min-h-[40px] px-4 py-2 text-left text-sm font-medium text-[#992B1E] hover:bg-[#FAF0EE] flex items-center gap-2.5"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t("ออกจากระบบ", "Log Out")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center min-h-[38px] px-4 py-1.5 rounded-lg bg-[#143628] hover:bg-[#1B4534] active:bg-[#0E271D] text-sm font-medium text-white shadow-soft transition-colors"
                >
                  {t("เข้าสู่ระบบ", "Log In")}
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center min-h-[38px] px-4 py-1.5 rounded-lg border border-[#D2CEC3] hover:border-[#B8B3A6] bg-white hover:bg-[#F3F1EC] text-sm font-medium text-[#181A18] transition-colors shadow-soft"
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
              className="md:hidden min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg text-[#181A18] hover:bg-[#EFECE6]"
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
          <div className="md:hidden border-t border-[#E2DFD7] bg-white px-4 py-3 space-y-1.5">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium ${
                isActive("/")
                  ? "bg-[#EBF2EE] text-[#143628] font-semibold"
                  : "text-[#4A4F4B] hover:bg-[#F6F5F0]"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>{t("สนามทั้งหมด", "All Courts")}</span>
            </Link>

            <Link
              href={user ? "/bookings" : "/login"}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium ${
                isActive("/bookings")
                  ? "bg-[#EBF2EE] text-[#143628] font-semibold"
                  : "text-[#4A4F4B] hover:bg-[#F6F5F0]"
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>{t("การจองของฉัน", "My Bookings")}</span>
            </Link>

            <button
              type="button"
              onClick={() => openAccountSection("favorites")}
              className="w-full flex items-center justify-between min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium text-[#4A4F4B] hover:bg-[#F6F5F0]"
            >
              <span className="flex items-center gap-2.5">
                <Heart className="w-4 h-4" />
                <span>{t("รายการโปรด", "Saved Courts")}</span>
              </span>
              {favoriteIds.length > 0 && (
                <span className="px-2 py-0.5 rounded-md text-xs bg-[#EBF2EE] text-[#143628] tabular-price">
                  {favoriteIds.length}
                </span>
              )}
            </button>

            {user?.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive("/admin")
                    ? "bg-[#EBF2EE] text-[#143628] font-semibold"
                    : "text-[#4A4F4B] hover:bg-[#F6F5F0]"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{t("จัดการระบบ (แอดมิน)", "Admin Panel")}</span>
              </Link>
            )}

            {!user && (
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[#EFECE6]">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center min-h-[42px] px-4 py-2 rounded-lg bg-[#143628] text-sm font-medium text-white shadow-soft"
                >
                  {t("เข้าสู่ระบบ", "Log In")}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center min-h-[42px] px-4 py-2 rounded-lg border border-[#D2CEC3] bg-white text-sm font-medium text-[#181A18] shadow-soft"
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
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E2DFD7] px-2 py-1 flex items-center justify-around"
      >
        <Link
          href="/"
          className={`flex flex-col items-center justify-center min-h-[48px] px-3 py-1 rounded-lg text-[11px] font-medium transition-colors ${
            isActive("/") && !pathname?.startsWith("/facilities")
              ? "text-[#143628] font-semibold"
              : "text-[#767B76] hover:text-[#181A18]"
          }`}
        >
          <Building2 className="w-5 h-5 mb-0.5" />
          <span>{t("สนามทั้งหมด", "Courts")}</span>
        </Link>

        <Link
          href={user ? "/bookings" : "/login"}
          className={`flex flex-col items-center justify-center min-h-[48px] px-3 py-1 rounded-lg text-[11px] font-medium transition-colors ${
            isActive("/bookings")
              ? "text-[#143628] font-semibold"
              : "text-[#767B76] hover:text-[#181A18]"
          }`}
        >
          <CalendarCheck className="w-5 h-5 mb-0.5" />
          <span>{t("การจองของฉัน", "Bookings")}</span>
        </Link>

        <button
          type="button"
          onClick={() => openAccountSection("favorites")}
          className="flex flex-col items-center justify-center min-h-[48px] px-3 py-1 rounded-lg text-[11px] font-medium text-[#767B76] hover:text-[#181A18]"
        >
          <Heart className="w-5 h-5 mb-0.5" />
          <span>{t("รายการโปรด", "Saved")}</span>
        </button>

        {user?.role === "admin" ? (
          <Link
            href="/admin"
            className={`flex flex-col items-center justify-center min-h-[48px] px-3 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              isActive("/admin")
                ? "text-[#143628] font-semibold"
                : "text-[#767B76] hover:text-[#181A18]"
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
            className={`flex flex-col items-center justify-center min-h-[48px] px-3 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              isActive("/login") || isActive("/register")
                ? "text-[#143628] font-semibold"
                : "text-[#767B76] hover:text-[#181A18]"
            }`}
          >
            <UserIcon className="w-5 h-5 mb-0.5" />
            <span>
              {user ? t("โปรไฟล์", "Profile") : t("เข้าสู่ระบบ", "Log In")}
            </span>
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
