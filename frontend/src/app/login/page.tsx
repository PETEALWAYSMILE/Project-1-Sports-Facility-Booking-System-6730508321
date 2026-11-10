"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button, Input } from "@/components/ui/Primitives";
import { Modal } from "@/components/ui/Overlays";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Trophy,
  UserCheck,
} from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  // Forgot password modal
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const redir = params.get("redirect");
      if (redir && redir.startsWith("/")) {
        setRedirectPath(redir);
      }
    }
  }, []);

  const validate = () => {
    let valid = true;
    setEmailError(null);
    setPasswordError(null);

    if (!email.trim() || !email.includes("@")) {
      setEmailError(
        t("กรุณากรอกอีเมลให้ถูกต้อง", "Please enter a valid email address")
      );
      valid = false;
    }
    if (!password) {
      setPasswordError(
        t("กรุณากรอกรหัสผ่านของคุณ", "Please enter your password")
      );
      valid = false;
    }
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    try {
      setLoading(true);
      const loggedInUser = await login(email.trim(), password);
      if (redirectPath) {
        router.push(redirectPath);
      } else if (loggedInUser.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      setFormError(
        err instanceof Error
          ? t(
              "อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
              "Invalid email or password. Please try again."
            )
          : t("ไม่สามารถเข้าสู่ระบบได้", "Sign in failed")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="bg-white rounded-3xl border border-black/5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* Left Column: Sport Court Visual & Short Message (Desktop Only) */}
        <div className="hidden lg:flex lg:col-span-6 relative bg-slate-100 overflow-hidden flex-col justify-between p-8">
          <img
            src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80"
            alt={t("สนามกีฬา SportArenaHub", "SportArenaHub Court")}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" />

          <div className="relative z-10 flex items-center gap-2.5 text-white">
            <div className="w-8 h-8 rounded-full bg-[#0071e3] flex items-center justify-center shadow-sm">
              <Trophy className="w-4 h-4" />
            </div>
            <span className="font-semibold text-lg tracking-tight">SportArenaHub</span>
          </div>

          <div className="relative z-10 bg-white/85 backdrop-blur-xl rounded-2xl p-6 space-y-3 border border-white/50 shadow-sm">
            <h2 className="text-xl font-semibold text-[#1d1d1f]">
              {t(
                "จองสนามกีฬาพร้อมเล่นได้ทุกวัน",
                "Book Your Favorite Sports Court Anytime"
              )}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t(
                "เช็คตารางเวลาว่างแบบเรียลไทม์ เลือกเวลาเล่นได้ตั้งแต่ 30 นาที ถึง 2 ชั่วโมง พร้อมรับรหัสเข้าสนามทันที",
                "Check real-time availability, select 30-min to 2-hour slots, and get instant court confirmation."
              )}
            </p>
            <div className="flex items-center gap-4 pt-1 text-xs font-medium text-[#0071e3]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                {t("เช็คคิวว่างเรียลไทม์", "Real-time slots")}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                {t("ยืนยันคิวทันที", "Instant confirmation")}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Login Form */}
        <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold text-[#1d1d1f]">
                {t("เข้าสู่ระบบ", "Log In")}
              </h1>
              <p className="text-sm text-[#86868b]">
                {t(
                  "เข้าสู่ระบบเพื่อจองสนามและจัดการรายการจองของคุณ",
                  "Sign in to book courts and manage your upcoming sessions."
                )}
              </p>
            </div>

            {formError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <Input
                label={t("อีเมล", "Email Address")}
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                placeholder="name@example.com"
                leftIcon={<Mail className="w-4 h-4" />}
                error={emailError}
              />

              <div className="space-y-1">
                <Input
                  label={t("รหัสผ่าน", "Password")}
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-4 h-4" />}
                  error={passwordError}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword
                          ? t("ซ่อนรหัสผ่าน", "Hide password")
                          : t("แสดงรหัสผ่าน", "Show password")
                      }
                      className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  }
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setResetSent(false);
                      setForgotModalOpen(true);
                    }}
                    className="text-xs font-medium text-[#0071e3] hover:underline py-1"
                  >
                    {t("ลืมรหัสผ่าน?", "Forgot password?")}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
              >
                {loading
                  ? t("กำลังเข้าสู่ระบบ...", "Signing in...")
                  : t("เข้าสู่ระบบ", "Log In")}
              </Button>
            </form>

            {/* Subtle Quick-Access Account Switcher */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#86868b]">
                <UserCheck className="w-3.5 h-3.5 text-[#0071e3]" />
                <span>
                  {t(
                    "เข้าใช้งานด่วนด้วยบัญชีสาธิต:",
                    "Quick sign-in with sample accounts:"
                  )}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail("member1@sportbooking.com");
                    setPassword("password123");
                    setEmailError(null);
                    setPasswordError(null);
                  }}
                  className="min-h-[38px] px-2.5 py-1.5 rounded-full border border-slate-200/90 bg-slate-50/80 hover:bg-[#0071e3]/10 hover:border-[#0071e3] text-xs font-medium text-slate-700 hover:text-[#0071e3] transition-all text-center active:scale-95"
                >
                  {t("สมาชิก 1", "Member 1")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("member2@sportbooking.com");
                    setPassword("password123");
                    setEmailError(null);
                    setPasswordError(null);
                  }}
                  className="min-h-[38px] px-2.5 py-1.5 rounded-full border border-slate-200/90 bg-slate-50/80 hover:bg-[#0071e3]/10 hover:border-[#0071e3] text-xs font-medium text-slate-700 hover:text-[#0071e3] transition-all text-center active:scale-95"
                >
                  {t("สมาชิก 2", "Member 2")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("admin@sportbooking.com");
                    setPassword("password123");
                    setEmailError(null);
                    setPasswordError(null);
                  }}
                  className="min-h-[38px] px-2.5 py-1.5 rounded-full border border-slate-200/90 bg-slate-50/80 hover:bg-[#0071e3]/10 hover:border-[#0071e3] text-xs font-medium text-slate-700 hover:text-[#0071e3] transition-all text-center active:scale-95"
                >
                  {t("ผู้ดูแลสนาม", "Admin")}
                </button>
              </div>
            </div>

            <p className="text-center text-sm text-[#86868b] pt-2">
              {t("ยังไม่มีบัญชีสมาชิก?", "Don't have an account?")}{" "}
              <Link
                href="/register"
                className="font-semibold text-[#0071e3] hover:underline"
              >
                {t("สมัครสมาชิกใหม่", "Sign Up")}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title={t("รีเซ็ตรหัสผ่าน", "Reset Password")}
        subtitle={t(
          "กรอกอีเมลที่ใช้สมัครสมาชิกเพื่อรับลิงก์ตั้งรหัสผ่านใหม่",
          "Enter your registered email address to receive a reset link"
        )}
        maxWidth="max-w-md"
        footer={
          resetSent ? (
            <Button
              variant="primary"
              onClick={() => setForgotModalOpen(false)}
            >
              {t("ตกลง", "Done")}
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={() => setForgotModalOpen(false)}
              >
                {t("ยกเลิก", "Cancel")}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (resetEmail.includes("@")) setResetSent(true);
                }}
              >
                {t("ส่งลิงก์รีเซ็ต", "Send Reset Link")}
              </Button>
            </>
          )
        }
      >
        {resetSent ? (
          <div className="p-4 rounded-control bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">
                {t("ส่งคำขอรีเซ็ตรหัสผ่านแล้ว", "Reset instructions sent")}
              </div>
              <p className="text-xs text-emerald-800 mt-1">
                {t(
                  `ระบบได้ส่งคำแนะนำในการตั้งรหัสผ่านใหม่ไปยัง ${resetEmail} เรียบร้อยแล้ว`,
                  `Password recovery instructions have been sent to ${resetEmail}.`
                )}
              </p>
            </div>
          </div>
        ) : (
          <Input
            label={t("อีเมลของคุณ", "Registered Email")}
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            placeholder="name@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
          />
        )}
      </Modal>
    </div>
  );
}
