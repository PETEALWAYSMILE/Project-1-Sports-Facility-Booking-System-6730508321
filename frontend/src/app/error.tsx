"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/Primitives";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="max-w-md mx-auto bg-white rounded-card border border-slate-200 p-8 sm:p-10 text-center shadow-soft space-y-5">
        <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
            {t("เกิดข้อผิดพลาดบางอย่าง", "Something Went Wrong")}
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            {t(
              "ระบบไม่สามารถแสดงผลหน้านี้ได้ชั่วคราว กรุณากดลองใหม่อีกครั้งหรือกลับไปยังหน้าแรก",
              "We encountered an unexpected issue while loading this page. Please try again or return to the home page."
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button variant="primary" onClick={() => reset()}>
            <RefreshCw className="w-4 h-4" />
            <span>{t("ลองใหม่อีกครั้ง", "Try Again")}</span>
          </Button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-control border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>{t("กลับหน้าแรก", "Back to Home")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
