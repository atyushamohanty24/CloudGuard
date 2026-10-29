import { create } from 'zustand';

interface ThemeStore {
  isDark: boolean;
  toggleTheme: () => void;
  setDark: (val: boolean) => void;
}

const getInitialTheme = (): boolean => {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem('cg_theme');
  if (saved) return saved === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const useThemeStore = create<ThemeStore>((set) => ({
  isDark: getInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const next = !state.isDark;
      if (typeof window !== 'undefined') {
        localStorage.setItem('cg_theme', next ? 'dark' : 'light');
        if (next) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return { isDark: next };
    }),
  setDark: (val: boolean) =>
    set(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cg_theme', val ? 'dark' : 'light');
        if (val) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return { isDark: val };
    }),
}));
