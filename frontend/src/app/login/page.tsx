"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { LogIn, Mail, Lock, AlertCircle, Trophy } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const loggedInUser = await login(email.trim(), password);
      if (loggedInUser.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-br from-slate-900 to-emerald-950 px-6 py-8 text-white text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto text-emerald-400">
            <Trophy className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold">
            {t("เข้าสู่ระบบ SportArenaHub", "Sign In to SportArenaHub")}
          </h1>
          <p className="text-xs text-slate-300">
            {t(
              "ระบบแยก Session ตาม Tab (สามารถเปิด 2 Tab ล็อกอิน Admin และ Member คู่กันได้)",
              "Per-tab JWT session enabled — open multiple tabs to test Admin & Member simultaneously."
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t("อีเมล (Email) *", "Email Address *")}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t("รหัสผ่าน (Password) *", "Password *")}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            {loading
              ? t("กำลังเข้าสู่ระบบ...", "Signing in...")
              : t("เข้าสู่ระบบ", "Log In")}
          </button>

          {/* Seeded Accounts Reference Box */}
          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
            <div className="font-bold text-slate-700">
              {t(
                "บัญชีตัวอย่างในฐานข้อมูล (คลิกเพื่อกรอกลงฟอร์ม):",
                "Seeded Accounts in Database (Click to fill form):"
              )}
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@sportbooking.com");
                  setPassword("password123");
                }}
                className="text-left px-3 py-2 rounded-xl bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200 text-amber-900 transition flex items-center justify-between"
              >
                <span>
                  <strong>Admin:</strong> admin@sportbooking.com
                </span>
                <span className="font-mono text-[11px]">password123</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("member1@sportbooking.com");
                  setPassword("password123");
                }}
                className="text-left px-3 py-2 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-900 transition flex items-center justify-between"
              >
                <span>
                  <strong>Member 1:</strong> member1@sportbooking.com
                </span>
                <span className="font-mono text-[11px]">password123</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("member2@sportbooking.com");
                  setPassword("password123");
                }}
                className="text-left px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition flex items-center justify-between"
              >
                <span>
                  <strong>Member 2:</strong> member2@sportbooking.com
                </span>
                <span className="font-mono text-[11px]">password123</span>
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 pt-2">
            {t("ยังไม่มีบัญชีผู้ใช้งาน?", "Don't have an account yet?")}{" "}
            <Link
              href="/register"
              className="font-bold text-emerald-600 hover:underline"
            >
              {t("ลงทะเบียนสมาชิกใหม่", "Register here")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
