"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/types";
import { api, clearStoredAuth, getStoredToken, setStoredAuth } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: {
    name: string;
    email: string;
    tel: string;
    password: string;
    role: "member" | "admin";
  }) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      setToken(storedToken);
      const res = await api.getMe();
      const meUser: User = {
        ...res.data,
        id: res.data._id || res.data.id,
      };
      setUser(meUser);
      setStoredAuth(storedToken, meUser);
    } catch {
      clearStoredAuth();
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.login({ email, password });
    const { token: jwtToken, ...userData } = res.data;
    setStoredAuth(jwtToken, userData);
    setToken(jwtToken);
    try {
      const meRes = await api.getMe();
      const fullUser: User = {
        ...meRes.data,
        id: meRes.data._id || userData.id,
      };
      setStoredAuth(jwtToken, fullUser);
      setUser(fullUser);
      return fullUser;
    } catch {
      setUser(userData);
      return userData;
    }
  };

  const register = async (payload: {
    name: string;
    email: string;
    tel: string;
    password: string;
    role: "member" | "admin";
  }): Promise<User> => {
    const res = await api.register(payload);
    const { token: jwtToken, ...userData } = res.data;
    const fullUser: User = { ...userData, tel: payload.tel };
    setStoredAuth(jwtToken, fullUser);
    setToken(jwtToken);
    setUser(fullUser);
    return fullUser;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore logout API errors and clear client session
    } finally {
      clearStoredAuth();
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
