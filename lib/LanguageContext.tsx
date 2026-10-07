"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import t, { Lang } from "./i18n";

// Generic translations type — compatible with both es and en
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Translations = any;

interface LanguageCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  tr: Translations;
}

const LanguageContext = createContext<LanguageCtx>({
  lang: "es",
  setLang: () => {},
  tr: t.es,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    const stored = localStorage.getItem("obento_lang") as Lang | null;
    if (stored === "es" || stored === "en") setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("obento_lang", l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, tr: t[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

// Independent admin language context
interface AdminLanguageCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  tr: Translations;
}

const AdminLanguageContext = createContext<AdminLanguageCtx>({
  lang: "es",
  setLang: () => {},
  tr: t.es,
});

export function AdminLanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    const stored = localStorage.getItem("obento_admin_lang") as Lang | null;
    if (stored === "es" || stored === "en") setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("obento_admin_lang", l);
  };

  return (
    <AdminLanguageContext.Provider value={{ lang, setLang, tr: t[lang] }}>
      {children}
    </AdminLanguageContext.Provider>
  );
}

export function useAdminLanguage() {
  return useContext(AdminLanguageContext);
}

// Independent monitor language context
const MonitorLanguageContext = createContext<AdminLanguageCtx>({
  lang: "es",
  setLang: () => {},
  tr: t.es,
});

export function MonitorLanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    const stored = localStorage.getItem("obento_monitor_lang") as Lang | null;
    if (stored === "es" || stored === "en") setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("obento_monitor_lang", l);
  };

  return (
    <MonitorLanguageContext.Provider value={{ lang, setLang, tr: t[lang] }}>
      {children}
    </MonitorLanguageContext.Provider>
  );
}

export function useMonitorLanguage() {
  return useContext(MonitorLanguageContext);
}
