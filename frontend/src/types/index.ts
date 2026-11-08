export type UserRole = "member" | "admin";

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  tel?: string;
  role: UserRole;
  createdAt?: string;
}

export interface AuthData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  token: string;
}

export interface Facility {
  _id: string;
  name: string;
  sportType: string;
  location: string;
  capacity: number;
  hourlyRate: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FacilityInput {
  name: string;
  sportType: string;
  location: string;
  capacity: number;
  hourlyRate: number;
}

export interface Booking {
  _id: string;
  facility: Facility | string;
  user: User | string;
  bookingDate: string;
  startTime: string;
  durationHours: number;
  startMinutes: number;
  endMinutes: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingInput {
  facility: string;
  bookingDate: string;
  startTime: string;
  durationHours: number;
}

export interface AvailabilitySlot {
  _id: string;
  startTime: string;
  durationHours: number;
  startMinutes: number;
  endMinutes: number;
  user: string;
  bookingDate: string;
}

export interface ApiResponse<T> {
  success: boolean;
  count?: number;
  data: T;
  error?: string;
}
