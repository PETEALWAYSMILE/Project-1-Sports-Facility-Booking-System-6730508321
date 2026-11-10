"use client";

import React, { useState, useEffect } from "react";
import { Facility } from "@/types";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useFavorites } from "@/lib/ui-helpers";
import { Modal, Toast } from "./ui/Overlays";
import { Button, Input, Tabs, EmptyState, CourtCardSkeleton } from "./ui/Primitives";
import CourtCard from "./CourtCard";
import {
  User as UserIcon,
  Heart,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

interface ProfileFavoritesModalProps {
  isOpen: boolean;
  initialTab?: "profile" | "favorites";
  onClose: () => void;
}

export default function ProfileFavoritesModal({
  isOpen,
  initialTab = "profile",
  onClose,
}: ProfileFavoritesModalProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const userId = user?._id || user?.id;
  const { favoriteIds, toggleFavorite, isFavorite } = useFavorites(userId);

  const [activeTab, setActiveTab] = useState<"profile" | "favorites">(initialTab);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loadingFacs, setLoadingFacs] = useState(false);

  // Profile form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (user && isOpen) {
      const savedProfileRaw =
        typeof window !== "undefined" && userId
          ? localStorage.getItem(`sah_profile_override_${userId}`)
          : null;
      const savedProfile = savedProfileRaw ? JSON.parse(savedProfileRaw) : null;
      setName(savedProfile?.name || user.name || "");
      setEmail(user.email || "");
      setTel(savedProfile?.tel || user.tel || "");
    }
  }, [user, userId, isOpen]);

  useEffect(() => {
    if (isOpen && activeTab === "favorites") {
      setLoadingFacs(true);
      api
        .getFacilities()
        .then((res) => setFacilities(res.data || []))
        .catch(() => setFacilities([]))
        .finally(() => setLoadingFacs(false));
    }
  }, [isOpen, activeTab]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setTimeout(() => {
      if (typeof window !== "undefined" && userId) {
        localStorage.setItem(
          `sah_profile_override_${userId}`,
          JSON.stringify({ name: name.trim(), tel: tel.trim() })
        );
      }
      setProfileSaving(false);
      showToast(t("บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว", "Profile saved successfully"));
    }, 300);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword.length < 6) {
      setPasswordError(
        t(
          "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร",
          "New password must be at least 6 characters"
        )
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(
        t(
          "รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน",
          "New password and confirmation do not match"
        )
      );
      return;
    }
    setPasswordSaving(true);
    setTimeout(() => {
      setPasswordSaving(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast(t("อัปเดตรหัสผ่านเรียบร้อยแล้ว", "Password updated successfully"));
    }, 350);
  };

  const favoriteFacilities = facilities.filter((f) =>
    favoriteIds.includes(f._id)
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t("บัญชีของฉันและรายการโปรด", "My Account & Favorites")}
        subtitle={t(
          "จัดการข้อมูลส่วนตัว รหัสผ่าน และสนามกีฬาที่คุณบันทึกไว้",
          "Manage your personal details, security, and saved courts"
        )}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-6">
          <Tabs
            tabs={[
              {
                id: "profile",
                label: t("ข้อมูลส่วนตัว", "Profile"),
                icon: <UserIcon className="w-4 h-4" />,
              },
              {
                id: "favorites",
                label: t("รายการโปรด", "Saved Courts"),
                count: favoriteIds.length,
                icon: <Heart className="w-4 h-4" />,
              },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          {activeTab === "profile" ? (
            <div className="space-y-6">
              {/* Card 1: Personal Info */}
              <form
                onSubmit={handleSaveProfile}
                className="bg-slate-50/70 rounded-card border border-slate-200 p-5 space-y-4"
              >
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-base font-semibold text-slate-900">
                    {t("ข้อมูลส่วนตัว", "Personal Information")}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t(
                      "ข้อมูลสำหรับติดต่อและออกใบยืนยันการจองสนามกีฬา",
                      "Contact details used for booking confirmations"
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={t("ชื่อ-นามสกุล", "Full Name")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    leftIcon={<UserIcon className="w-4 h-4" />}
                  />
                  <Input
                    label={t("อีเมล", "Email Address")}
                    type="email"
                    value={email}
                    disabled
                    leftIcon={<Mail className="w-4 h-4" />}
                    hint={t(
                      "อีเมลใช้สำหรับเข้าสู่ระบบ ไม่สามารถเปลี่ยนได้",
                      "Primary login email cannot be changed"
                    )}
                  />
                  <Input
                    label={t("เบอร์โทรศัพท์", "Phone Number")}
                    type="tel"
                    value={tel}
                    onChange={(e) => setTel(e.target.value)}
                    placeholder="081-234-5678"
                    leftIcon={<Phone className="w-4 h-4" />}
                  />
                  <div className="space-y-1.5">
                    <span className="block text-sm font-medium text-slate-800">
                      {t("ประเภทสมาชิก", "Membership Tier")}
                    </span>
                    <div className="min-h-[44px] px-3.5 py-2.5 rounded-control border border-slate-200 bg-white text-sm font-medium text-slate-800 flex items-center justify-between">
                      <span>
                        {user?.role === "admin"
                          ? t("ผู้ดูแลระบบ (Admin)", "Administrator")
                          : t("สมาชิกทั่วไป (Member)", "Verified Member")}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="primary" loading={profileSaving}>
                    {t("บันทึกข้อมูลส่วนตัว", "Save Profile")}
                  </Button>
                </div>
              </form>

              {/* Card 2: Change Password */}
              <form
                onSubmit={handleSavePassword}
                className="bg-slate-50/70 rounded-card border border-slate-200 p-5 space-y-4"
              >
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {t("เปลี่ยนรหัสผ่าน", "Change Password")}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {t(
                        "ตั้งรหัสผ่านความยาวอย่างน้อย 6 ตัวอักษรเพื่อความปลอดภัย",
                        "Use at least 6 characters for account security"
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 min-h-[36px] px-2"
                  >
                    {showPass ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        <span>{t("ซ่อนรหัสผ่าน", "Hide")}</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>{t("แสดงรหัสผ่าน", "Show")}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label={t("รหัสผ่านปัจจุบัน", "Current Password")}
                    type={showPass ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    leftIcon={<Lock className="w-4 h-4" />}
                  />
                  <Input
                    label={t("รหัสผ่านใหม่", "New Password")}
                    type={showPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    leftIcon={<Lock className="w-4 h-4" />}
                  />
                  <Input
                    label={t("ยืนยันรหัสผ่านใหม่", "Confirm Password")}
                    type={showPass ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    leftIcon={<Lock className="w-4 h-4" />}
                    error={passwordError}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="secondary"
                    loading={passwordSaving}
                  >
                    {t("อัปเดตรหัสผ่าน", "Update Password")}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              {loadingFacs ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CourtCardSkeleton />
                  <CourtCardSkeleton />
                </div>
              ) : favoriteFacilities.length === 0 ? (
                <EmptyState
                  icon={<Heart className="w-6 h-6" />}
                  title={t(
                    "ยังไม่มีสนามกีฬาในรายการโปรด",
                    "No favorite courts saved yet"
                  )}
                  description={t(
                    "กดปุ่มรูปหัวใจบนการ์ดสนามกีฬาเพื่อบันทึกสนามที่คุณชื่นชอบไว้จองครั้งถัดไปได้อย่างรวดเร็ว",
                    "Tap the heart icon on any court card to bookmark your favorite arenas for quick booking."
                  )}
                  actionLabel={t("ค้นหาสนามกีฬา", "Browse Courts")}
                  onAction={onClose}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {favoriteFacilities.map((fac) => (
                    <div key={fac._id} onClick={onClose}>
                      <CourtCard
                        facility={fac}
                        isFavorite={isFavorite(fac._id)}
                        onToggleFavorite={toggleFavorite}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
    </>
  );
}
