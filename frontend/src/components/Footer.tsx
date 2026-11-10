"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Trophy, Globe, Phone, Mail, MapPin, Clock } from "lucide-react";

export default function Footer() {
  const { lang, toggleLang, t } = useLanguage();

  return (
    <footer className="bg-[#f5f5f7] border-t border-black/5 mt-16 pb-20 md:pb-8 text-xs text-[#86868b]">
      <div className="max-w-container mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-black/5">
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-3">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#0071e3] flex items-center justify-center text-white shadow-sm">
                <Trophy className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-base tracking-tight text-[#1d1d1f]">
                SportArena<span className="text-[#0071e3]">Hub</span>
              </span>
            </Link>
            <p className="text-xs text-[#86868b] leading-relaxed max-w-sm">
              {t(
                "แพลตฟอร์มค้นหาและจองสนามกีฬาออนไลน์ เช็คตารางเวลาว่างแบบเรียลไทม์ จองง่ายทั้งแบดมินตัน เทนนิส ฟุตซอล บาสเกตบอล และฟิตเนส",
                "Real-time sports court discovery and booking platform for badminton, tennis, futsal, basketball, and fitness studios."
              )}
            </p>
            <div className="pt-1 flex items-center gap-2 text-xs text-[#86868b]">
              <Clock className="w-3.5 h-3.5 text-[#0071e3] shrink-0" />
              <span>
                {t(
                  "เวลาเปิดให้บริการสนาม: ทุกวัน 06:00 - 22:00 น.",
                  "Operating Hours: Daily 06:00 – 22:00"
                )}
              </span>
            </div>
          </div>

          {/* Sports Categories */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider">
              {t("ประเภทสนามกีฬา", "Sports Categories")}
            </h3>
            <ul className="space-y-2 text-xs text-[#86868b]">
              <li>
                <Link href="/?sport=badminton" className="hover:text-[#0071e3] transition-colors">
                  {t("สนามแบดมินตัน", "Badminton Courts")}
                </Link>
              </li>
              <li>
                <Link href="/?sport=tennis" className="hover:text-[#0071e3] transition-colors">
                  {t("สนามเทนนิส", "Tennis Courts")}
                </Link>
              </li>
              <li>
                <Link href="/?sport=futsal" className="hover:text-[#0071e3] transition-colors">
                  {t("สนามฟุตซอล", "Futsal Pitches")}
                </Link>
              </li>
              <li>
                <Link href="/?sport=basketball" className="hover:text-[#0071e3] transition-colors">
                  {t("สนามบาสเกตบอล", "Basketball Courts")}
                </Link>
              </li>
              <li>
                <Link href="/?sport=fitness" className="hover:text-[#0071e3] transition-colors">
                  {t("ห้องฟิตเนส", "Fitness Studios")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider">
              {t("เมนูใช้งาน", "Quick Links")}
            </h3>
            <ul className="space-y-2 text-xs text-[#86868b]">
              <li>
                <Link href="/" className="hover:text-[#0071e3] transition-colors">
                  {t("ค้นหาสนามทั้งหมด", "Explore Courts")}
                </Link>
              </li>
              <li>
                <Link href="/bookings" className="hover:text-[#0071e3] transition-colors">
                  {t("การจองของฉัน", "My Bookings")}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#0071e3] transition-colors">
                  {t("เข้าสู่ระบบ", "Log In")}
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-[#0071e3] transition-colors">
                  {t("สมัครสมาชิก", "Register")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider">
              {t("ติดต่อศูนย์กีฬา", "Contact Us")}
            </h3>
            <ul className="space-y-2.5 text-xs text-[#86868b]">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#0071e3] shrink-0 mt-0.5" />
                <span>
                  {t(
                    "ศูนย์กีฬา SportArenaHub ถนนพระราม 1 ปทุมวัน กรุงเทพฯ 10330",
                    "SportArenaHub Complex, Rama I Rd, Pathum Wan, Bangkok 10330"
                  )}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#0071e3] shrink-0" />
                <span className="tabular-price">02-123-4567</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#0071e3] shrink-0" />
                <span>support@sportarenahub.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#86868b]">
          <p>
            © {new Date().getFullYear()} SportArenaHub.{" "}
            {t("สงวนลิขสิทธิ์ทุกประการ", "All rights reserved.")}
          </p>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleLang}
              className="inline-flex items-center gap-1.5 min-h-[32px] px-3 py-1 rounded-full border border-slate-300/80 bg-white hover:bg-slate-50 text-xs font-medium text-[#1d1d1f] transition-all shadow-sm active:scale-95"
            >
              <Globe className="w-3.5 h-3.5 text-[#0071e3]" />
              <span>
                {lang === "TH" ? "ภาษาไทย (TH)" : "English (EN)"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
