"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  UserPlus,
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Shield,
  AlertCircle,
} from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError(
        t(
          "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
          "Password must be at least 6 characters long"
        )
      );
      return;
    }

    try {
      setLoading(true);
      const newUser = await register({
        name: name.trim(),
        email: email.trim(),
        tel: tel.trim(),
        role,
        password,
      });
      if (newUser.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-br from-slate-900 to-emerald-950 px-6 py-7 text-white text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto text-emerald-400">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold">
            {t("ลงทะเบียนผู้ใช้งานใหม่", "Create an Account")}
          </h1>
          <p className="text-xs text-slate-300">
            {t(
              "ระบุชื่อ อีเมล เบอร์โทรศัพท์ บทบาท (member / admin) และรหัสผ่าน",
              "Enter your name, email, telephone, role (member or admin), and password."
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("ชื่อ-นามสกุล (Name) *", "Full Name *")}
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("เช่น สมชาย ใจดี", "e.g. Somchai Jaidee")}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("อีเมล (Email) *", "Email Address *")}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="member@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("เบอร์โทรศัพท์ (Tel) *", "Telephone Number *")}
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={tel}
                onChange={(e) => setTel(e.target.value)}
                placeholder="081-234-5678"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t("บทบาทผู้ใช้งาน (Role) *", "User Role *")}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("member")}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                  role === "member"
                    ? "bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-200"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <UserIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold">Member</div>
                  <div className="text-[10px] opacity-80">
                    {t("จองและจัดการคิวตัวเอง", "Book facilities")}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                  role === "admin"
                    ? "bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-200"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold">Admin</div>
                  <div className="text-[10px] opacity-80">
                    {t("ดูแลสนาม & คิวทั้งหมด", "Manage all")}
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t(
                "รหัสผ่าน (Password - อย่างน้อย 6 ตัวอักษร) *",
                "Password (Min 6 characters) *"
              )}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                minLength={6}
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
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 mt-2"
          >
            <UserPlus className="w-4 h-4" />
            {loading
              ? t("กำลังสร้างบัญชี...", "Creating Account...")
              : t("ยืนยันการลงทะเบียน", "Complete Registration")}
          </button>

          <p className="text-center text-xs text-slate-500 pt-2">
            {t("มีบัญชีผู้ใช้งานอยู่แล้ว?", "Already have an account?")}{" "}
            <Link
              href="/login"
              className="font-bold text-emerald-600 hover:underline"
            >
              {t("เข้าสู่ระบบที่นี่", "Log In here")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
