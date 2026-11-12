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
      <div className="bg-white rounded-xl border border-[#D2CEC3] shadow-card overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* Left Column: Sport Court Visual & Short Message (Desktop Only) */}
        <div className="hidden lg:flex lg:col-span-6 relative bg-[#143628] overflow-hidden flex-col justify-between p-8">
          <img
            src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80"
            alt={t("สนามกีฬา SportArenaHub", "SportArenaHub Court")}
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-[#143628]/55" />

          <div className="relative z-10 flex items-center gap-2.5 text-white">
            <div className="w-8 h-8 rounded-lg bg-[#143628] border border-white/25 flex items-center justify-center shadow-soft">
              <Trophy className="w-4 h-4" />
            </div>
            <span className="font-semibold text-lg tracking-tight">
              SportArenaHub
            </span>
          </div>

          <div className="relative z-10 bg-white/95 rounded-xl p-6 space-y-3 border border-[#D2CEC3] shadow-soft">
            <h2 className="text-xl font-semibold text-[#181A18]">
              {t(
                "สำรองเวลาสนามกีฬาได้ทุกวัน",
                "Book Your Favorite Sports Court Anytime"
              )}
            </h2>
            <p className="text-sm text-[#4A4F4B] leading-relaxed">
              {t(
                "เช็คตารางเวลาว่างแบบเรียลไทม์ เลือกเวลาเล่นได้ตั้งแต่ 30 นาที ถึง 2 ชั่วโมง พร้อมรับรหัสเข้าสนามทันที",
                "Check real-time availability, select 30-min to 2-hour slots, and get instant court confirmation."
              )}
            </p>
            <div className="flex items-center gap-4 pt-1 text-xs font-medium text-[#143628]">
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
              <h1 className="text-2xl font-semibold text-[#181A18]">
                {t("เข้าสู่ระบบ", "Log In")}
              </h1>
              <p className="text-sm text-[#767B76]">
                {t(
                  "เข้าสู่ระบบเพื่อจองสนามและจัดการรายการจองของคุณ",
                  "Sign in to book courts and manage your upcoming sessions."
                )}
              </p>
            </div>

            {formError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3.5 rounded-lg bg-[#FAF0EE] border border-[#E8C8C3] text-[#8B2E22] text-xs sm:text-sm font-medium"
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
                      className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg text-[#767B76] hover:text-[#181A18]"
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
                    className="text-xs font-medium text-[#143628] hover:underline py-1"
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

            {/* Quick-Access Account Switcher */}
            <div className="pt-4 border-t border-[#EFECE6] space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#767B76]">
                <UserCheck className="w-3.5 h-3.5 text-[#143628]" />
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
                  className="min-h-[38px] px-2.5 py-1.5 rounded-lg border border-[#D2CEC3] bg-[#F6F5F0] hover:bg-[#EBF2EE] hover:border-[#143628] text-xs font-medium text-[#181A18] hover:text-[#143628] transition-colors text-center"
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
                  className="min-h-[38px] px-2.5 py-1.5 rounded-lg border border-[#D2CEC3] bg-[#F6F5F0] hover:bg-[#EBF2EE] hover:border-[#143628] text-xs font-medium text-[#181A18] hover:text-[#143628] transition-colors text-center"
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
                  className="min-h-[38px] px-2.5 py-1.5 rounded-lg border border-[#D2CEC3] bg-[#F6F5F0] hover:bg-[#EBF2EE] hover:border-[#143628] text-xs font-medium text-[#181A18] hover:text-[#143628] transition-colors text-center"
                >
                  {t("ผู้ดูแลสนาม", "Admin")}
                </button>
              </div>
            </div>

            <p className="text-center text-sm text-[#767B76] pt-2">
              {t("ยังไม่มีบัญชีสมาชิก?", "Don't have an account?")}{" "}
              <Link
                href="/register"
                className="font-semibold text-[#143628] hover:underline"
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
          <div className="p-4 rounded-lg bg-[#EBF2EE] border border-[#C5D9CE] text-[#143628] text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#143628] shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">
                {t("ส่งคำขอรีเซ็ตรหัสผ่านแล้ว", "Reset instructions sent")}
              </div>
              <p className="text-xs text-[#4A4F4B] mt-1">
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
