"use client";

import React, { useState, useEffect } from "react";
import { Facility, FacilityInput } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { X, Building2, AlertCircle } from "lucide-react";

interface FacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FacilityInput) => Promise<void>;
  initialData?: Facility | null;
}

const SPORT_PRESETS = [
  "Badminton",
  "Tennis",
  "Futsal",
  "Gym",
  "Basketball",
  "Table Tennis",
  "Volleyball",
  "Swimming",
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
  const [hourlyRate, setHourlyRate] = useState<number>(150);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSportType(initialData.sportType);
      setLocation(initialData.location);
      setCapacity(initialData.capacity);
      setHourlyRate(initialData.hourlyRate);
    } else {
      setName("");
      setSportType("Badminton");
      setLocation("");
      setCapacity(4);
      setHourlyRate(200);
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !sportType.trim() || !location.trim()) {
      setError(
        t("กรุณากรอกข้อมูลให้ครบทุกช่อง", "Please fill in all required fields.")
      );
      return;
    }
    if (capacity < 1) {
      setError(
        t("ความจุต้องอย่างน้อย 1 คน", "Capacity must be at least 1 person.")
      );
      return;
    }
    if (hourlyRate < 0) {
      setError(
        t("อัตราค่าบริการต้องไม่ติดลบ", "Hourly rate cannot be negative.")
      );
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        name: name.trim(),
        sportType: sportType.trim(),
        location: location.trim(),
        capacity: Number(capacity),
        hourlyRate: Number(hourlyRate),
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save facility");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">
              {initialData
                ? t("แก้ไขข้อมูลสนามกีฬา", "Update Sports Facility")
                : t("เพิ่มสนามกีฬาใหม่", "Add New Sports Facility")}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {initialData && (
            <div className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 font-mono">
              Facility ID: {initialData._id}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("ชื่อสถานที่ / สนามกีฬา (Name) *", "Facility Name *")}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("เช่น Badminton Court C (VIP)", "e.g. Badminton Court C (VIP)")}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("ประเภทกีฬา (Sport Type) *", "Sport Type *")}
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {SPORT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSportType(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                    sportType.toLowerCase() === preset.toLowerCase()
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              type="text"
              required
              value={sportType}
              onChange={(e) => setSportType(e.target.value)}
              placeholder="Badminton, Tennis, Futsal, Gym..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("สถานที่ตั้ง (Location) *", "Location *")}
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("เช่น อาคารศูนย์กีฬา ชั้น 2", "e.g. Sports Center Building, Floor 2")}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("ความจุสูงสุด (คน) *", "Capacity (Persons) *")}
              </label>
              <input
                type="number"
                min={1}
                required
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("ค่าบริการต่อชั่วโมง (บาท/ชม.) *", "Hourly Rate (THB/hr) *")}
              </label>
              <input
                type="number"
                min={0}
                step="any"
                required
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              {t("ยกเลิก", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-xs font-semibold text-white shadow-sm transition"
            >
              {submitting
                ? t("กำลังบันทึก...", "Saving...")
                : initialData
                ? t("บันทึกการแก้ไข", "Update Facility")
                : t("เพิ่มสนามกีฬา", "Create Facility")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
