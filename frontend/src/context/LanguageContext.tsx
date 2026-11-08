"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Lang = "TH" | "EN";

interface LanguageContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (th: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLang] = useState<Lang>("TH");

  useEffect(() => {
    const saved = sessionStorage.getItem("sf_lang") as Lang | null;
    if (saved === "TH" || saved === "EN") {
      setLang(saved);
    }
  }, []);

  const toggleLang = () => {
    setLang((prev) => {
      const next = prev === "TH" ? "EN" : "TH";
      sessionStorage.setItem("sf_lang", next);
      return next;
    });
  };

  const t = (th: string, en: string) => (lang === "TH" ? th : en);

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
