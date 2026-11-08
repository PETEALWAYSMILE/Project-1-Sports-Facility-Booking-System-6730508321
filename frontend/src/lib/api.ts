import {
  ApiResponse,
  AuthData,
  AvailabilitySlot,
  Booking,
  BookingInput,
  Facility,
  FacilityInput,
  User,
} from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("sf_token");
};

export const setStoredAuth = (token: string, user: User) => {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("sf_token", token);
  sessionStorage.setItem("sf_user", JSON.stringify(user));
};

export const clearStoredAuth = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("sf_token");
  sessionStorage.removeItem("sf_user");
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await response.json().catch(() => ({
    success: false,
    error: `HTTP Error ${response.status}`,
  }));

  if (!response.ok || json.success === false) {
    throw new Error(json.error || `Request failed with status ${response.status}`);
  }

  return json as ApiResponse<T>;
}

export const api = {
  // Authentication
  register: (payload: {
    name: string;
    email: string;
    tel: string;
    password: string;
    role: "member" | "admin";
  }) =>
    request<AuthData>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<AuthData>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMe: () => request<User>("/auth/me"),

  logout: () => request<Record<string, never>>("/auth/logout"),

  // Facilities
  getFacilities: () => request<Facility[]>("/facilities"),

  getFacility: (id: string) => request<Facility>(`/facilities/${id}`),

  getFacilityAvailability: (id: string, date: string) =>
    request<AvailabilitySlot[]>(
      `/facilities/${id}/availability?date=${encodeURIComponent(date)}`
    ),

  createFacility: (payload: FacilityInput) =>
    request<Facility>("/facilities", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateFacility: (id: string, payload: Partial<FacilityInput>) =>
    request<Facility>(`/facilities/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteFacility: (id: string) =>
    request<Record<string, never>>(`/facilities/${id}`, {
      method: "DELETE",
    }),

  // Bookings
  getBookings: () => request<Booking[]>("/bookings"),

  getBooking: (id: string) => request<Booking>(`/bookings/${id}`),

  createBooking: (payload: BookingInput) =>
    request<Booking>("/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateBooking: (id: string, payload: Partial<BookingInput>) =>
    request<Booking>(`/bookings/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteBooking: (id: string) =>
    request<Record<string, never>>(`/bookings/${id}`, {
      method: "DELETE",
    }),
};

export const formatMinutesToTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

export const getTodayUtcString = (): string => {
  return new Date().toISOString().slice(0, 10);
};
