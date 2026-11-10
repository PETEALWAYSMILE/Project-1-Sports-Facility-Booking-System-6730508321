"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button, Input } from "@/components/ui/Primitives";
import {
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Trophy,
  Shield,
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
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    tel?: string;
    password?: string;
    form?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const nextErrors: typeof errors = {};
    if (!name.trim()) {
      nextErrors.name = t(
        "กรุณากรอกชื่อ-นามสกุลของคุณ",
        "Please enter your full name"
      );
    }
    if (!email.trim() || !email.includes("@")) {
      nextErrors.email = t(
        "กรุณากรอกรูปแบบอีเมลให้ถูกต้อง",
        "Please enter a valid email address"
      );
    }
    if (!tel.trim() || tel.trim().length < 9) {
      nextErrors.tel = t(
        "กรุณากรอกเบอร์โทรศัพท์ที่ติดต่อได้",
        "Please enter a valid phone number"
      );
    }
    if (password.length < 6) {
      nextErrors.password = t(
        "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
        "Password must be at least 6 characters"
      );
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

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
      setErrors({
        form:
          err instanceof Error
            ? err.message
            : t(
                "ไม่สามารถสร้างบัญชีได้ อีเมลนี้อาจถูกใช้งานแล้ว",
                "Registration failed. This email may already be in use."
              ),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="bg-white rounded-3xl border border-black/5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        {/* Left Column: Sport Court Photo & Short Message (Desktop Only) */}
        <div className="hidden lg:flex lg:col-span-6 relative bg-slate-100 overflow-hidden flex-col justify-between p-8">
          <img
            src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80"
            alt={t("สนามกีฬา SportArenaHub", "SportArenaHub Arena")}
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
                "เริ่มต้นจองสนามกีฬาได้ในไม่กี่วินาที",
                "Join SportArenaHub in Seconds"
              )}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t(
                "สมาชิกสามารถจองสนามแบดมินตัน เทนนิส ฟุตซอล บาสเกตบอล และฟิตเนส พร้อมจัดการตารางนัดหมายได้ในที่เดียว",
                "Create a free account to reserve courts, track your upcoming games, and bookmark your favorite venues."
              )}
            </p>
            <div className="flex items-center gap-4 pt-1 text-xs font-medium text-[#0071e3]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                {t("สมัครสมาชิกฟรี", "Free membership")}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                {t("จัดการคิวจองง่าย", "Easy booking management")}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Registration Form */}
        <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-5">
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold text-[#1d1d1f]">
                {t("สมัครสมาชิกใหม่", "Create Your Account")}
              </h1>
              <p className="text-sm text-[#86868b]">
                {t(
                  "กรอกข้อมูลด้านล่างเพื่อเริ่มต้นใช้งาน SportArenaHub",
                  "Complete the form below to start booking courts."
                )}
              </p>
            </div>

            {errors.form && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errors.form}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <Input
                label={t("ชื่อ-นามสกุล", "Full Name")}
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                placeholder={t("เช่น สมชาย ใจดี", "e.g. Somchai Jaidee")}
                leftIcon={<UserIcon className="w-4 h-4" />}
                error={errors.name}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t("อีเมล", "Email Address")}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  placeholder="name@example.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                  error={errors.email}
                />

                <Input
                  label={t("เบอร์โทรศัพท์", "Phone Number")}
                  type="tel"
                  required
                  value={tel}
                  onChange={(e) => {
                    setTel(e.target.value);
                    if (errors.tel) setErrors({ ...errors, tel: undefined });
                  }}
                  placeholder="081-234-5678"
                  leftIcon={<Phone className="w-4 h-4" />}
                  error={errors.tel}
                />
              </div>

              {/* Account Type Selection */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#1d1d1f]">
                  {t("ประเภทบัญชีผู้ใช้งาน", "Account Type")}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("member")}
                    aria-pressed={role === "member"}
                    className={`min-h-[48px] p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 active:scale-98 ${
                      role === "member"
                        ? "bg-[#0071e3]/10 border-[#0071e3] text-[#1d1d1f] shadow-sm"
                        : "bg-white border-slate-200/90 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <UserIcon className="w-4 h-4 text-[#0071e3] shrink-0" />
                    <div>
                      <div className="text-xs font-semibold">
                        {t("สมาชิกทั่วไป", "Member")}
                      </div>
                      <div className="text-[11px] text-[#86868b]">
                        {t("ค้นหาและจองสนาม", "Book courts")}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    aria-pressed={role === "admin"}
                    className={`min-h-[48px] p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 active:scale-98 ${
                      role === "admin"
                        ? "bg-[#0071e3]/10 border-[#0071e3] text-[#1d1d1f] shadow-sm"
                        : "bg-white border-slate-200/90 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Shield className="w-4 h-4 text-[#0071e3] shrink-0" />
                    <div>
                      <div className="text-xs font-semibold">
                        {t("ผู้ดูแลสนาม", "Venue Admin")}
                      </div>
                      <div className="text-[11px] text-[#86868b]">
                        {t("จัดการสนามและคิว", "Manage venue")}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <Input
                label={t("รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)", "Password (Min 6 characters)")}
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password)
                    setErrors({ ...errors, password: undefined });
                }}
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.password}
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

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
              >
                {loading
                  ? t("กำลังสร้างบัญชี...", "Creating account...")
                  : t("ลงทะเบียน", "Create Account")}
              </Button>
            </form>

            <p className="text-center text-sm text-[#86868b] pt-2">
              {t("มีบัญชีสมาชิกอยู่แล้ว?", "Already have an account?")}{" "}
              <Link
                href="/login"
                className="font-semibold text-[#0071e3] hover:underline"
              >
                {t("เข้าสู่ระบบ", "Log In")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
