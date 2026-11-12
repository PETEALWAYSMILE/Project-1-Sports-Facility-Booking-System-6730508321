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
      <div className="bg-white rounded-xl border border-[#D2CEC3] shadow-card overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        {/* Left Column: Sport Court Photo & Short Message (Desktop Only) */}
        <div className="hidden lg:flex lg:col-span-6 relative bg-[#143628] overflow-hidden flex-col justify-between p-8">
          <img
            src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80"
            alt={t("สนามกีฬา SportArenaHub", "SportArenaHub Arena")}
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
                "เริ่มต้นจองสนามกีฬาได้ในไม่กี่วินาที",
                "Join SportArenaHub in Seconds"
              )}
            </h2>
            <p className="text-sm text-[#4A4F4B] leading-relaxed">
              {t(
                "สมาชิกสามารถจองสนามแบดมินตัน เทนนิส ฟุตซอล บาสเกตบอล และฟิตเนส พร้อมจัดการตารางนัดหมายได้ในที่เดียว",
                "Create a free account to reserve courts, track your upcoming games, and bookmark your favorite venues."
              )}
            </p>
            <div className="flex items-center gap-4 pt-1 text-xs font-medium text-[#143628]">
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
              <h1 className="text-2xl font-semibold text-[#181A18]">
                {t("สมัครสมาชิกใหม่", "Create Your Account")}
              </h1>
              <p className="text-sm text-[#767B76]">
                {t(
                  "กรอกข้อมูลด้านล่างเพื่อเริ่มต้นใช้งาน SportArenaHub",
                  "Complete the form below to start booking courts."
                )}
              </p>
            </div>

            {errors.form && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3.5 rounded-lg bg-[#FAF0EE] border border-[#E8C8C3] text-[#8B2E22] text-xs sm:text-sm font-medium"
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
                <label className="block text-sm font-medium text-[#181A18]">
                  {t("ประเภทบัญชีผู้ใช้งาน", "Account Type")}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("member")}
                    aria-pressed={role === "member"}
                    className={`min-h-[48px] p-3 rounded-lg border text-left transition-colors flex items-center gap-2.5 ${
                      role === "member"
                        ? "bg-[#EBF2EE] border-[#143628] text-[#181A18] shadow-soft"
                        : "bg-white border-[#D2CEC3] text-[#4A4F4B] hover:bg-[#F6F5F0]"
                    }`}
                  >
                    <UserIcon className="w-4 h-4 text-[#143628] shrink-0" />
                    <div>
                      <div className="text-xs font-semibold">
                        {t("สมาชิกทั่วไป", "Member")}
                      </div>
                      <div className="text-[11px] text-[#767B76]">
                        {t("ค้นหาและจองสนาม", "Book courts")}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    aria-pressed={role === "admin"}
                    className={`min-h-[48px] p-3 rounded-lg border text-left transition-colors flex items-center gap-2.5 ${
                      role === "admin"
                        ? "bg-[#EBF2EE] border-[#143628] text-[#181A18] shadow-soft"
                        : "bg-white border-[#D2CEC3] text-[#4A4F4B] hover:bg-[#F6F5F0]"
                    }`}
                  >
                    <Shield className="w-4 h-4 text-[#143628] shrink-0" />
                    <div>
                      <div className="text-xs font-semibold">
                        {t("ผู้ดูแลสนาม", "Venue Admin")}
                      </div>
                      <div className="text-[11px] text-[#767B76]">
                        {t("จัดการสนามและคิว", "Manage venue")}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <Input
                label={t(
                  "รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)",
                  "Password (Min 6 characters)"
                )}
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

            <p className="text-center text-sm text-[#767B76] pt-2">
              {t("มีบัญชีสมาชิกอยู่แล้ว?", "Already have an account?")}{" "}
              <Link
                href="/login"
                className="font-semibold text-[#143628] hover:underline"
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
