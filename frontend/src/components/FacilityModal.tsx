"use client";

import React, { useState, useEffect } from "react";
import { Facility, FacilityInput } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import {
  getCustomFacilityImage,
  setCustomFacilityImage,
} from "@/lib/ui-helpers";
import { Modal } from "./ui/Overlays";
import { Button, Input } from "./ui/Primitives";
import { AlertCircle, Image as ImageIcon } from "lucide-react";

interface FacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FacilityInput, customImageUrl?: string) => Promise<void>;
  initialData?: Facility | null;
}

const SPORT_OPTIONS = [
  { value: "Badminton", labelTH: "แบดมินตัน", labelEN: "Badminton" },
  { value: "Tennis", labelTH: "เทนนิส", labelEN: "Tennis" },
  { value: "Futsal", labelTH: "ฟุตซอล", labelEN: "Futsal" },
  { value: "Basketball", labelTH: "บาสเกตบอล", labelEN: "Basketball" },
  { value: "Gym", labelTH: "ฟิตเนส", labelEN: "Fitness / Gym" },
];

export default function FacilityModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: FacilityModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [sportType, setSportType] = useState("Badminton");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState<number>(4);
  const [hourlyRate, setHourlyRate] = useState<number>(180);
  const [openTime, setOpenTime] = useState("06:00");
  const [closeTime, setCloseTime] = useState("22:00");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSportType(initialData.sportType);
      setLocation(initialData.location);
      setCapacity(initialData.capacity);
      setHourlyRate(initialData.hourlyRate);
      setIsActive(initialData.isActive !== false);
      setImageUrl(getCustomFacilityImage(initialData._id) || "");
    } else {
      setName("");
      setSportType("Badminton");
      setLocation("");
      setCapacity(4);
      setHourlyRate(180);
      setIsActive(true);
      setImageUrl("");
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !sportType.trim() || !location.trim()) {
      setError(
        t("กรุณากรอกชื่อสนาม ประเภทกีฬา และทำเลที่ตั้งให้ครบถ้วน", "Please complete all required fields.")
      );
      return;
    }
    if (capacity < 1) {
      setError(
        t("ความจุผู้เล่นต้องอย่างน้อย 1 คน", "Capacity must be at least 1 person.")
      );
      return;
    }
    if (hourlyRate < 0) {
      setError(
        t("ราคาต่อชั่วโมงต้องไม่ติดลบ", "Hourly rate cannot be negative.")
      );
      return;
    }

    try {
      setSubmitting(true);
      if (initialData?._id) {
        setCustomFacilityImage(initialData._id, imageUrl);
      }
      await onSubmit(
        {
          name: name.trim(),
          sportType: sportType.trim(),
          location: location.trim(),
          capacity: Number(capacity),
          hourlyRate: Number(hourlyRate),
        },
        imageUrl
      );
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : t("ไม่สามารถบันทึกข้อมูลสนามได้", "Failed to save facility")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        initialData
          ? t("แก้ไขข้อมูลสนามกีฬา", "Edit Sports Court")
          : t("เพิ่มสนามกีฬาใหม่", "Add New Sports Court")
      }
      subtitle={t(
        "กำหนดรายละเอียดสนาม ประเภทกีฬา ราคาต่อชั่วโมง และรูปภาพสนาม",
        "Configure court name, sport category, hourly rate, and cover photo"
      )}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            {t("ยกเลิก", "Cancel")}
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {initialData
              ? t("บันทึกการแก้ไข", "Save Changes")
              : t("เพิ่มสนามกีฬา", "Create Court")}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3.5 rounded-control bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label={t("ชื่อสนามกีฬา *", "Court Name *")}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t(
            "เช่น สนามแบดมินตัน คอร์ท A (Indoor Pro)",
            "e.g. Badminton Court A (Indoor Pro)"
          )}
        />

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-800">
            {t("ประเภทกีฬา *", "Sport Category *")}
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {SPORT_OPTIONS.map((opt) => {
              const active =
                sportType.toLowerCase() === opt.value.toLowerCase();
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSportType(opt.value)}
                  className={`min-h-[44px] px-2.5 py-2 rounded-control text-xs font-medium border transition-colors ${
                    active
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {t(opt.labelTH, opt.labelEN)}
                </button>
              );
            })}
          </div>
        </div>

        <Input
          label={t("ทำเลที่ตั้ง / อาคาร *", "Location / Zone *")}
          required
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={t(
            "เช่น อาคารศูนย์กีฬาหลัก ชั้น 2 โซน A",
            "e.g. Main Sports Complex, Floor 2, Court A"
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t("ความจุผู้เล่น (คน) *", "Max Capacity (Players) *")}
            type="number"
            min={1}
            required
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
          />

          <Input
            label={t("ราคาต่อชั่วโมง (บาท) *", "Hourly Rate (THB) *")}
            type="number"
            min={0}
            step="any"
            required
            value={hourlyRate}
            onChange={(e) => setHourlyRate(Number(e.target.value))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t("เวลาเปิดให้บริการ", "Opening Time")}
            type="time"
            value={openTime}
            onChange={(e) => setOpenTime(e.target.value)}
          />
          <Input
            label={t("เวลาปิดให้บริการ", "Closing Time")}
            type="time"
            value={closeTime}
            onChange={(e) => setCloseTime(e.target.value)}
          />
        </div>

        <Input
          label={t("ลิงก์รูปภาพสนาม (URL)", "Court Photo URL (Optional)")}
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://images.unsplash.com/..."
          leftIcon={<ImageIcon className="w-4 h-4" />}
          hint={t(
            "หากเว้นว่าง ระบบจะแสดงภาพสนามมาตรฐานตามประเภทกีฬาโดยอัตโนมัติ",
            "Leave blank to automatically use curated high-resolution sport photos."
          )}
        />

        <div className="flex items-center justify-between p-3.5 rounded-control bg-slate-50 border border-slate-200">
          <div>
            <div className="text-sm font-medium text-slate-900">
              {t("สถานะการเปิดให้บริการ", "Court Availability Status")}
            </div>
            <div className="text-xs text-slate-500">
              {t(
                "เปิดเพื่อให้สมาชิกค้นหาและจองคิวสนามนี้ได้",
                "Allow members to discover and book this court"
              )}
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={() => setIsActive((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
              isActive ? "bg-primary" : "bg-slate-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                isActive ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </form>
    </Modal>
  );
}
