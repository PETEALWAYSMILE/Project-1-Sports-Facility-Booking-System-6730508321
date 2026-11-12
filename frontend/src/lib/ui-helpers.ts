"use client";

import { useState, useEffect, useCallback } from "react";
import { Booking, Facility } from "@/types";

export type SportKey = "badminton" | "tennis" | "futsal" | "basketball" | "fitness";

export interface SportMeta {
  key: SportKey;
  labelTH: string;
  labelEN: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  fallbackBg: string;
  fallbackIconText: string;
  defaultImages: string[];
  amenities: { id: string; labelTH: string; labelEN: string }[];
  descriptionTH: string;
  descriptionEN: string;
}

export const SPORT_META_MAP: Record<SportKey, SportMeta> = {
  badminton: {
    key: "badminton",
    labelTH: "แบดมินตัน",
    labelEN: "Badminton",
    badgeBg: "bg-[#F3F1EC]",
    badgeText: "text-[#143628]",
    badgeBorder: "border-[#DCD8CE]",
    dotColor: "bg-[#143628]",
    fallbackBg: "bg-[#EFECE6]",
    fallbackIconText: "text-[#143628]",
    defaultImages: [
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1613918431703-aa50889e3be9?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80",
    ],
    amenities: [
      { id: "mat", labelTH: "พื้นสนามยางมาตรฐาน BWF", labelEN: "BWF Standard Court Mat" },
      { id: "light", labelTH: "ไฟ LED ข้างคอร์ทไม่แยงตา", labelEN: "Anti-Glare Side LED Lighting" },
      { id: "air", labelTH: "ระบบระบายอากาศ / แอร์", labelEN: "Climate Controlled Hall" },
      { id: "shower", labelTH: "ห้องอาบน้ำและล็อกเกอร์", labelEN: "Showers & Lockers" },
      { id: "parking", labelTH: "ที่จอดรถฟรี", labelEN: "Free Parking" },
      { id: "rental", labelTH: "บริการเช่าไม้และจำหน่ายลูกแบด", labelEN: "Racket Rental & Shuttlecocks" },
    ],
    descriptionTH:
      "สนามแบดมินตันในร่มพื้นยางสังเคราะห์เกรดแข่งขัน ลดแรงกระแทกหัวเข่า ติดตั้งไฟ LED มาตรฐานสนามอาชีพพร้อมพื้นที่พักนักกีฬากว้างขวาง",
    descriptionEN:
      "Indoor professional-grade synthetic floor badminton court designed for shock absorption, featuring anti-glare LED court lighting and spacious player seating.",
  },
  tennis: {
    key: "tennis",
    labelTH: "เทนนิส",
    labelEN: "Tennis",
    badgeBg: "bg-[#F3F1EC]",
    badgeText: "text-[#143628]",
    badgeBorder: "border-[#DCD8CE]",
    dotColor: "bg-[#143628]",
    fallbackBg: "bg-[#EFECE6]",
    fallbackIconText: "text-[#143628]",
    defaultImages: [
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1530915365347-e35b749a0381?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?auto=format&fit=crop&w=900&q=80",
    ],
    amenities: [
      { id: "surface", labelTH: "พื้น Hard Court มาตรฐาน ITF", labelEN: "ITF Acrylic Hard Court" },
      { id: "floodlight", labelTH: "ไฟสปอร์ตไลท์สำหรับเล่นกลางคืน", labelEN: "Night Floodlights" },
      { id: "seating", labelTH: "อัฒจันทร์และม้านั่งข้างสนาม", labelEN: "Court-side Benches & Shade" },
      { id: "shower", labelTH: "ห้องอาบน้ำและห้องแต่งตัว", labelEN: "Changing Rooms & Showers" },
      { id: "parking", labelTH: "ที่จอดรถสะดวกสบาย", labelEN: "Convenient Parking" },
      { id: "water", labelTH: "จุดบริการน้ำดื่มและเครื่องดื่มเกลือแร่", labelEN: "Hydration & Refreshment Station" },
    ],
    descriptionTH:
      "สนามเทนนิสพื้น Acrylic Hard Court ความหนืดมาตรฐาน ให้จังหวะกระดอนลูกที่แม่นยำ พร้อมระบบไฟส่องสว่างรอบสนามสำหรับช่วงเย็นและค่ำ",
    descriptionEN:
      "Standard acrylic hard court offering consistent ball bounce and grip, complete with full perimeter floodlights for evening matches.",
  },
  futsal: {
    key: "futsal",
    labelTH: "ฟุตซอล",
    labelEN: "Futsal",
    badgeBg: "bg-[#F3F1EC]",
    badgeText: "text-[#143628]",
    badgeBorder: "border-[#DCD8CE]",
    dotColor: "bg-[#143628]",
    fallbackBg: "bg-[#EFECE6]",
    fallbackIconText: "text-[#143628]",
    defaultImages: [
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=900&q=80",
    ],
    amenities: [
      { id: "turf", labelTH: "หญ้าเทียมเกรดพรีเมียม / พื้นสนามในร่ม", labelEN: "FIFA Quality Pro Turf" },
      { id: "bibs", labelTH: "เสื้อกั๊กแบ่งทีมและลูกฟุตซอลฟรี", labelEN: "Complimentary Team Bibs & Balls" },
      { id: "scoreboard", labelTH: "ป้ายสกอร์บอร์ดดิจิทัล", labelEN: "Digital Scoreboard" },
      { id: "shower", labelTH: "ห้องอาบน้ำแยกชาย-หญิง", labelEN: "Separate Locker & Shower Rooms" },
      { id: "parking", labelTH: "ลานจอดรถรองรับทีมนักกีฬา", labelEN: "Spacious Team Parking" },
      { id: "lounge", labelTH: "โซนนั่งพักและเครื่องดื่ม", labelEN: "Spectator Lounge & Drinks" },
    ],
    descriptionTH:
      "สนามฟุตซอลในร่มพร้อมตาข่ายกั้นรอบสนาม พื้นสนามรองรับการยึดเกาะและการวิ่งความเร็วสูง เหมาะสำหรับการซ้อมทีมและแข่งขันกระชับมิตร",
    descriptionEN:
      "Covered futsal pitch with full perimeter netting, high-traction turf surface, digital scoreboard, and team bench areas.",
  },
  basketball: {
    key: "basketball",
    labelTH: "บาสเกตบอล",
    labelEN: "Basketball",
    badgeBg: "bg-[#F3F1EC]",
    badgeText: "text-[#143628]",
    badgeBorder: "border-[#DCD8CE]",
    dotColor: "bg-[#143628]",
    fallbackBg: "bg-[#EFECE6]",
    fallbackIconText: "text-[#143628]",
    defaultImages: [
      "https://images.unsplash.com/photo-1505666287802-931dc83948e9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?auto=format&fit=crop&w=900&q=80",
    ],
    amenities: [
      { id: "hardwood", labelTH: "พื้นไม้ปาร์เก้ซับแรงกระแทก", labelEN: "Pro Hardwood Maple Court" },
      { id: "hoop", labelTH: "แป้นกระจกนิรภัยมาตรฐาน FIBA", labelEN: "FIBA Tempered Glass Backboards" },
      { id: "ac", labelTH: "ฮอลล์ในร่มปรับอากาศ", labelEN: "Air-Conditioned Indoor Arena" },
      { id: "scoreboard", labelTH: "นาฬิกาจับเวลาและสกอร์บอร์ด", labelEN: "Shot Clock & Scoreboard" },
      { id: "shower", labelTH: "ห้องล็อกเกอร์และห้องอาบน้ำ", labelEN: "Locker Rooms & Showers" },
      { id: "parking", labelTH: "ที่จอดรถภายในอาคาร", labelEN: "Indoor Parking" },
    ],
    descriptionTH:
      "สนามบาสเกตบอลในร่มแบบเต็มคอร์ท พื้นไม้ขัดเคลือบกันลื่นพร้อมแป้นกระจกนิรภัยมาตรฐานแข่งขัน รองรับทั้งการซ้อมทีมและแข่งแบบ 5x5",
    descriptionEN:
      "Full-size indoor hardwood basketball court with tempered glass backboards, shot clocks, and spectator seating.",
  },
  fitness: {
    key: "fitness",
    labelTH: "ฟิตเนส",
    labelEN: "Fitness",
    badgeBg: "bg-[#F3F1EC]",
    badgeText: "text-[#143628]",
    badgeBorder: "border-[#DCD8CE]",
    dotColor: "bg-[#143628]",
    fallbackBg: "bg-[#EFECE6]",
    fallbackIconText: "text-[#143628]",
    defaultImages: [
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=900&q=80",
    ],
    amenities: [
      { id: "weights", labelTH: "โซนเวทเทรนนิ่งและดัมเบลครบชุด", labelEN: "Full Free-Weight & Rack Zone" },
      { id: "cardio", labelTH: "ลู่วิ่งและเครื่องคาร์ดิโอรุ่นใหม่", labelEN: "Modern Cardio Machines" },
      { id: "mat", labelTH: "พื้นที่ Functional & เสื่อโยคะ", labelEN: "Functional Turf & Stretching Mats" },
      { id: "ac", labelTH: "ระบบปรับอากาศและฟอกอากาศ", labelEN: "Air Conditioning & Purification" },
      { id: "shower", labelTH: "ห้องอาบน้ำพร้อมตู้ล็อกเกอร์", labelEN: "Private Showers & Lockers" },
      { id: "water", labelTH: "ตู้กดน้ำดื่มสะอาด", labelEN: "Filtered Water Refill Station" },
    ],
    descriptionTH:
      "ห้องออกกำลังกายและสตูดิโอฟิตเนสครบวงจร มาพร้อมอุปกรณ์เวทเทรนนิ่ง เครื่องคาร์ดิโอ และโซน Functional Training ในห้องปรับอากาศส่วนตัว",
    descriptionEN:
      "Fully equipped fitness and conditioning studio featuring cardio machines, free weights, functional training turf, and full locker amenities.",
  },
};

export const ALL_SPORT_KEYS: SportKey[] = [
  "badminton",
  "tennis",
  "futsal",
  "basketball",
  "fitness",
];

export function resolveSportKey(rawSportType?: string): SportKey {
  const s = (rawSportType || "").toLowerCase().trim();
  if (s.includes("badminton") || s.includes("แบด")) return "badminton";
  if (s.includes("tennis") || s.includes("เทนนิส")) return "tennis";
  if (s.includes("futsal") || s.includes("football") || s.includes("soccer") || s.includes("ฟุต"))
    return "futsal";
  if (s.includes("basketball") || s.includes("บาส")) return "basketball";
  if (s.includes("gym") || s.includes("fitness") || s.includes("ฟิตเนส") || s.includes("ออกกำลัง"))
    return "fitness";
  return "badminton";
}

export function getSportMeta(rawSportType?: string): SportMeta {
  return SPORT_META_MAP[resolveSportKey(rawSportType)];
}

export function getSportName(rawSportType: string | undefined, lang: "TH" | "EN"): string {
  const meta = getSportMeta(rawSportType);
  return lang === "TH" ? meta.labelTH : meta.labelEN;
}

// Custom facility image overrides saved in localStorage (for Admin UI)
const CUSTOM_FACILITY_IMG_KEY = "sah_facility_images";

export function getCustomFacilityImage(facilityId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CUSTOM_FACILITY_IMG_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string>;
    return map[facilityId] || null;
  } catch {
    return null;
  }
}

export function setCustomFacilityImage(facilityId: string, imageUrl: string) {
  if (typeof window === "undefined" || !facilityId) return;
  try {
    const raw = localStorage.getItem(CUSTOM_FACILITY_IMG_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    if (imageUrl.trim()) {
      map[facilityId] = imageUrl.trim();
    } else {
      delete map[facilityId];
    }
    localStorage.setItem(CUSTOM_FACILITY_IMG_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

export function getFacilityGallery(facility: Facility): string[] {
  const meta = getSportMeta(facility.sportType);
  const custom = getCustomFacilityImage(facility._id);
  // Deterministic offset so Court A and Court B of the same sport get distinct primary images
  const nameSum = (facility.name || "")
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const offset = nameSum % 2; // 0 or 1 for primary image variety
  const rotated = [
    ...meta.defaultImages.slice(offset),
    ...meta.defaultImages.slice(0, offset),
  ];
  if (custom) {
    return [custom, ...rotated.filter((u) => u !== custom)].slice(0, 5);
  }
  return rotated.slice(0, 5);
}

export function getFacilityPrimaryImage(facility: Facility): string {
  return getFacilityGallery(facility)[0];
}

// Human-friendly Booking Reference Code: SAH-XXXXXX (never expose raw MongoDB _id)
export function formatBookingCode(id?: string): string {
  if (!id) return "SAH-000000";
  const clean = id.replace(/[^a-fA-F0-9]/g, "");
  if (clean.length >= 6) {
    const tail = clean.slice(-6);
    const num = (parseInt(tail, 16) % 900000) + 100000;
    return `SAH-${String(num).padStart(6, "0")}`;
  }
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) % 900000;
  }
  return `SAH-${String(Math.abs(hash) + 100000).slice(0, 6)}`;
}

// Booking Status calculation
export type BookingStatusType = "pending" | "confirmed" | "completed" | "cancelled";

export function getBookingComputedStatus(
  booking: Booking & { isCancelled?: boolean }
): BookingStatusType {
  if (booking.isCancelled) return "cancelled";

  const datePart = (booking.bookingDate || "").slice(0, 10);
  const todayStr = new Date().toISOString().slice(0, 10);

  if (datePart < todayStr) {
    return "completed";
  }
  if (datePart === todayStr) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    if (booking.endMinutes <= currentMinutes) {
      return "completed";
    }
  }
  return "confirmed";
}

// Format YYYY-MM-DD to readable Thai/English date
const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

const EN_MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const THAI_DAYS_SHORT = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const EN_DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatReadableDate(dateStr: string, lang: "TH" | "EN"): string {
  if (!dateStr) return "-";
  const clean = dateStr.slice(0, 10);
  const [y, m, d] = clean.split("-").map(Number);
  if (!y || !m || !d) return clean;
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  const dow = dateObj.getUTCDay();
  if (lang === "TH") {
    return `${THAI_DAYS_SHORT[dow]} ${d} ${THAI_MONTHS_SHORT[m - 1]} ${y + 543}`;
  }
  return `${EN_DAYS_SHORT[dow]}, ${d} ${EN_MONTHS_SHORT[m - 1]} ${y}`;
}

export function getNext14Days(): {
  dateStr: string;
  dayNum: number;
  dayNameTH: string;
  dayNameEN: string;
  monthTH: string;
  monthEN: string;
  isToday: boolean;
}[] {
  const result = [];
  const base = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const dow = d.getUTCDay();
    const monthIdx = d.getUTCMonth();
    result.push({
      dateStr,
      dayNum: d.getUTCDate(),
      dayNameTH: i === 0 ? "วันนี้" : THAI_DAYS_SHORT[dow],
      dayNameEN: i === 0 ? "Today" : EN_DAYS_SHORT[dow],
      monthTH: THAI_MONTHS_SHORT[monthIdx],
      monthEN: EN_MONTHS_SHORT[monthIdx],
      isToday: i === 0,
    });
  }
  return result;
}

// Client-side Favorites Management
const FAVORITES_STORAGE_KEY = "sah_favorites_v1";
const FAVORITES_EVENT = "sah-favorites-updated";

export function useFavorites(userId?: string) {
  const storageKey = userId ? `${FAVORITES_STORAGE_KEY}_${userId}` : FAVORITES_STORAGE_KEY;
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const loadFavorites = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(storageKey);
      setFavoriteIds(raw ? JSON.parse(raw) : []);
    } catch {
      setFavoriteIds([]);
    }
  }, [storageKey]);

  useEffect(() => {
    loadFavorites();
    const handler = () => loadFavorites();
    window.addEventListener(FAVORITES_EVENT, handler);
    return () => window.removeEventListener(FAVORITES_EVENT, handler);
  }, [loadFavorites]);

  const toggleFavorite = useCallback(
    (facilityId: string) => {
      if (typeof window === "undefined") return;
      try {
        const raw = localStorage.getItem(storageKey);
        const current: string[] = raw ? JSON.parse(raw) : [];
        const exists = current.includes(facilityId);
        const next = exists
          ? current.filter((id) => id !== facilityId)
          : [...current, facilityId];
        localStorage.setItem(storageKey, JSON.stringify(next));
        setFavoriteIds(next);
        window.dispatchEvent(new CustomEvent(FAVORITES_EVENT));
      } catch {
        // ignore
      }
    },
    [storageKey]
  );

  const isFavorite = useCallback(
    (facilityId: string) => favoriteIds.includes(facilityId),
    [favoriteIds]
  );

  return { favoriteIds, toggleFavorite, isFavorite };
}

// Client-side Cancelled Bookings History (since DELETE /api/v1/bookings/:id hard-deletes in backend)
const CANCELLED_BOOKINGS_KEY = "sah_cancelled_bookings_v1";

export interface CancelledBookingRecord extends Booking {
  isCancelled: true;
  cancelledAt: string;
}

export function getCancelledBookings(userId?: string, isAdmin?: boolean): CancelledBookingRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CANCELLED_BOOKINGS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as CancelledBookingRecord[];
    if (isAdmin) return list;
    if (!userId) return [];
    return list.filter((b) => {
      const bUserId = typeof b.user === "object" ? b.user._id || b.user.id : b.user;
      return bUserId === userId;
    });
  } catch {
    return [];
  }
}

export function saveCancelledBooking(booking: Booking) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(CANCELLED_BOOKINGS_KEY);
    const list: CancelledBookingRecord[] = raw ? JSON.parse(raw) : [];
    const exists = list.some((item) => item._id === booking._id);
    if (!exists) {
      const record: CancelledBookingRecord = {
        ...booking,
        isCancelled: true,
        cancelledAt: new Date().toISOString(),
      };
      localStorage.setItem(
        CANCELLED_BOOKINGS_KEY,
        JSON.stringify([record, ...list].slice(0, 50))
      );
    }
  } catch {
    // ignore
  }
}

// Pending Booking Draft across Login redirect
const BOOKING_DRAFT_KEY = "sah_pending_booking_draft";

export interface BookingDraft {
  facilityId: string;
  bookingDate: string;
  startTime: string;
  durationHours: number;
}

export function saveBookingDraft(draft: BookingDraft) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(draft));
}

export function consumeBookingDraft(facilityId: string): BookingDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(BOOKING_DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as BookingDraft;
    if (draft.facilityId === facilityId) {
      sessionStorage.removeItem(BOOKING_DRAFT_KEY);
      return draft;
    }
    return null;
  } catch {
    return null;
  }
}
