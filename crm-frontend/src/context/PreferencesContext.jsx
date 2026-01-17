import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const PreferencesContext = createContext();

export const usePreferences = () => {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
};

const defaultPrefs = {
  theme: 'light', // 'light' | 'dark' | 'auto'
  language: 'en',
  itemsPerPage: 25,
};

export const PreferencesProvider = ({ children }) => {
  const [prefs, setPrefs] = useState(defaultPrefs);

  // Load saved prefs
  useEffect(() => {
    try {
      const saved = localStorage.getItem('preferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        setPrefs({ ...defaultPrefs, ...parsed });
      }
    } catch {}
  }, []);

  // Apply theme and language
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (theme) => {
      const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const effective = theme === 'auto' ? (systemDark ? 'dark' : 'light') : theme;
      if (effective === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };
    applyTheme(prefs.theme);
    root.setAttribute('lang', prefs.language || 'en');
  }, [prefs.theme, prefs.language]);

  const savePreferences = (updates) => {
    const next = { ...prefs, ...updates };
    setPrefs(next);
    try {
      localStorage.setItem('preferences', JSON.stringify(next));
    } catch {}
    return true;
  };

  const value = useMemo(() => ({
    preferences: prefs,
    setTheme: (theme) => savePreferences({ theme }),
    setLanguage: (language) => savePreferences({ language }),
    setItemsPerPage: (itemsPerPage) => savePreferences({ itemsPerPage: Number(itemsPerPage) || 25 }),
    savePreferences,
  }), [prefs]);

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export default PreferencesContext;