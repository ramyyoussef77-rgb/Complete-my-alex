
import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { User, Theme, Language } from '../types';
import { firebaseLogin } from '../services/firebaseService';

interface AppContextType {
  user: User | null;
  login: (user: Omit<User, 'uid'>) => Promise<void>;
  logout: () => void;
  
  // Active settings used by the app
  theme: Theme;
  language: Language;
  voice: string;
  contentVersion: number; // To trigger re-translation

  // Temporary settings for the Settings page
  tempTheme: Theme;
  setTempTheme: (theme: Theme) => void;
  tempLanguage: Language;
  setTempLanguage: (language: Language) => void;
  tempVoice: string;
  setTempVoice: (voice: string) => void;
  saveSettings: () => void;
  resetTempSettings: () => void;
}

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  
  // Active state
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');
  const [language, setLanguageState] = useState<Language>(() => (localStorage.getItem('language') as Language) || 'en');
  const [voice, setVoiceState] = useState<string>(() => localStorage.getItem('voice') || 'Zephyr');
  const [contentVersion, setContentVersion] = useState(0);

  // Temporary state for settings form
  const [tempTheme, setTempTheme] = useState<Theme>(theme);
  const [tempLanguage, setTempLanguage] = useState<Language>(language);
  const [tempVoice, setTempVoice] = useState<string>(voice);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
   useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('language', language);
  }, [language]);
  
  useEffect(() => {
      if(user) localStorage.setItem('user', JSON.stringify(user));
      else localStorage.removeItem('user');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('voice', voice);
  }, [voice]);

  const login = useCallback(async (userData: Omit<User, 'uid'>) => {
    const firebaseUser = await firebaseLogin(userData);
    setUser(firebaseUser);
  }, []);

  const logout = useCallback(() => {
    setUser(null)
  }, []);

  const saveSettings = useCallback(() => {
    setThemeState(tempTheme);
    if(tempLanguage !== language) {
        setLanguageState(tempLanguage);
        setContentVersion(v => v + 1); // Trigger content refresh
    }
    setVoiceState(tempVoice);
  }, [tempTheme, tempLanguage, tempVoice, language]);

  const resetTempSettings = useCallback(() => {
    setTempTheme(theme);
    setTempLanguage(language);
    setTempVoice(voice);
  }, [theme, language, voice]);

  const value = useMemo(() => ({
    user, login, logout,
    theme, language, voice, contentVersion,
    tempTheme, setTempTheme,
    tempLanguage, setTempLanguage,
    tempVoice, setTempVoice,
    saveSettings,
    resetTempSettings
  }), [user, theme, language, voice, contentVersion, tempTheme, tempLanguage, tempVoice, login, logout, saveSettings, resetTempSettings]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};