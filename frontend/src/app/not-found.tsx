"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Compass, Home, Search } from "lucide-react";

export default function NotFoundPage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="max-w-md mx-auto bg-white rounded-card border border-slate-200 p-8 sm:p-10 text-center shadow-soft space-y-5">
        <div className="w-14 h-14 rounded-full bg-primary-light text-primary flex items-center justify-center mx-auto">
          <Compass className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 tabular-price">
            404
          </span>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
            {t("ไม่พบหน้าที่คุณต้องการ", "Page Not Found")}
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            {t(
              "ลิงก์ที่คุณเปิดอาจถูกย้ายหรือไม่มีอยู่ในระบบ คุณสามารถกลับไปหน้าแรกเพื่อค้นหาสนามกีฬาที่เปิดให้บริการได้ทันที",
              "The page you are looking for might have been moved or does not exist."
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-control bg-primary hover:bg-primary-hover text-white text-sm font-medium shadow-soft transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>{t("กลับหน้าแรก", "Back to Home")}</span>
          </Link>
          <Link
            href="/bookings"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-control border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>{t("ดูการจองของฉัน", "My Bookings")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
