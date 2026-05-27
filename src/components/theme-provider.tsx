import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";
import type {
  SkinMode,
  ThemeAppearanceSettings,
  ThemeBackgroundSettings,
  ThemeMode,
} from "@/types";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
  storageKey?: string;
  appearance?: ThemeAppearanceSettings | null;
}

interface ThemeContextValue {
  theme: ThemeMode;
  skin: SkinMode;
  appearance: ThemeAppearanceSettings;
  setTheme: (theme: ThemeMode) => void;
  setSkin: (skin: SkinMode) => void;
  setAppearance: (appearance: ThemeAppearanceSettings) => void;
  setBackground: (background: ThemeBackgroundSettings) => void;
}

const STORAGE_KEY = "cc-switch-theme";
const SKIN_STORAGE_KEY = "cc-switch-skin";

const DEFAULT_THEME_BY_SKIN: Record<SkinMode, ThemeMode> = {
  original: "system",
  glass: "system",
  custom: "system",
};

const DEFAULT_APPEARANCE: ThemeAppearanceSettings = {
  activeSkin: "glass",
  themeBySkin: { ...DEFAULT_THEME_BY_SKIN },
  background: {
    enabled: false,
    opacity: 1,
    blur: 0,
    fit: "cover",
    position: "center",
    overlayOpacity: 0.28,
  },
};

const ThemeProviderContext = createContext<ThemeContextValue | undefined>(
  undefined,
);

function normalizeAppearance(
  appearance?: ThemeAppearanceSettings | null,
): ThemeAppearanceSettings {
  const merged: ThemeAppearanceSettings = {
    ...DEFAULT_APPEARANCE,
    ...(appearance ?? {}),
    themeBySkin: {
      ...DEFAULT_THEME_BY_SKIN,
      ...(appearance?.themeBySkin ?? {}),
    },
    background: {
      ...DEFAULT_APPEARANCE.background,
      ...(appearance?.background ?? {}),
    },
  };

  if (
    merged.activeSkin !== "original" &&
    merged.activeSkin !== "glass" &&
    merged.activeSkin !== "custom"
  ) {
    merged.activeSkin = "glass";
  }
  return merged;
}

function readStoredTheme(storageKey: string, fallback: ThemeMode): ThemeMode {
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(storageKey);
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : fallback;
}

function readStoredSkin(): SkinMode {
  if (typeof window === "undefined") return "glass";
  const stored = window.localStorage.getItem(SKIN_STORAGE_KEY);
  return stored === "original" || stored === "glass" || stored === "custom"
    ? stored
    : "glass";
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = STORAGE_KEY,
  appearance,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(() =>
    readStoredTheme(storageKey, defaultTheme),
  );
  const [skin, setSkinState] = useState<SkinMode>(() => readStoredSkin());
  const [themeAppearance, setThemeAppearance] =
    useState<ThemeAppearanceSettings>(() => {
      const normalized = normalizeAppearance(appearance);
      if (appearance) return normalized;
      const storedSkin = readStoredSkin();
      const storedTheme = readStoredTheme(storageKey, defaultTheme);
      return normalizeAppearance({
        ...normalized,
        activeSkin: storedSkin,
        themeBySkin: {
          ...normalized.themeBySkin,
          [storedSkin]: storedTheme,
        },
      });
    });

  useEffect(() => {
    if (!appearance) return;
    const next = normalizeAppearance(appearance);
    setThemeAppearance(next);
    setSkinState(next.activeSkin as SkinMode);
    setThemeState(
      next.themeBySkin?.[next.activeSkin as SkinMode] ?? defaultTheme,
    );
  }, [appearance, defaultTheme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, theme);
  }, [storageKey, theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SKIN_STORAGE_KEY, skin);
  }, [skin]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = window.document.documentElement;
    root.dataset.skin = skin;
    root.dataset.theme = theme;

    const resolvedTheme = theme === "system" ? getSystemTheme() : theme;

    root.classList.toggle("dark", resolvedTheme === "dark");
    root.classList.toggle("light", resolvedTheme === "light");
    root.style.setProperty("--app-theme-mode", resolvedTheme);
    root.style.setProperty("--app-skin-mode", skin);
  }, [skin, theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = window.document.documentElement;
    const background: ThemeBackgroundSettings = {
      ...DEFAULT_APPEARANCE.background,
      ...(themeAppearance.background ?? {}),
    };

    if (background.enabled && background.imagePath) {
      root.style.setProperty(
        "--app-bg-image",
        `url("${convertFileSrc(background.imagePath)}")`,
      );
      root.style.setProperty(
        "--app-bg-opacity",
        String(background.opacity ?? 1),
      );
      root.style.setProperty("--app-bg-blur", `${background.blur ?? 0}px`);
      root.style.setProperty("--app-bg-fit", background.fit ?? "cover");
      root.style.setProperty(
        "--app-bg-position",
        background.position ?? "center",
      );
      root.style.setProperty(
        "--app-bg-overlay-opacity",
        String(background.overlayOpacity ?? 0.28),
      );
      root.dataset.bgEnabled = "true";
    } else {
      root.style.removeProperty("--app-bg-image");
      root.style.setProperty("--app-bg-opacity", "0");
      root.style.setProperty("--app-bg-blur", "0px");
      root.style.setProperty("--app-bg-overlay-opacity", "0");
      root.dataset.bgEnabled = "false";
    }
  }, [themeAppearance]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme !== "system") return;
      const resolved = mediaQuery.matches ? "dark" : "light";
      window.document.documentElement.classList.toggle(
        "dark",
        resolved === "dark",
      );
      window.document.documentElement.classList.toggle(
        "light",
        resolved === "light",
      );
      window.document.documentElement.style.setProperty(
        "--app-theme-mode",
        resolved,
      );
    };

    mediaQuery.addEventListener("change", handleChange);
    handleChange();
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let active = true;
    void invoke("set_window_theme", { theme }).catch((error) => {
      if (active) {
        console.debug("Failed to set native window theme:", error);
      }
    });
    return () => {
      active = false;
    };
  }, [theme]);

  const updateTheme = useCallback(
    (nextTheme: ThemeMode) => {
      setThemeState(nextTheme);
      setThemeAppearance((prev) => ({
        ...prev,
        themeBySkin: {
          ...(prev.themeBySkin ?? DEFAULT_THEME_BY_SKIN),
          [skin]: nextTheme,
        },
      }));
    },
    [skin],
  );

  const updateSkin = useCallback(
    (nextSkin: SkinMode) => {
      setSkinState(nextSkin);
      setThemeAppearance((prev) => ({
        ...prev,
        activeSkin: nextSkin,
      }));
      setThemeState(
        themeAppearance.themeBySkin?.[nextSkin] ??
          DEFAULT_THEME_BY_SKIN[nextSkin],
      );
    },
    [themeAppearance.themeBySkin],
  );

  const updateAppearance = useCallback(
    (nextAppearance: ThemeAppearanceSettings) => {
      const normalized = normalizeAppearance(nextAppearance);
      setThemeAppearance(normalized);
      setSkinState(normalized.activeSkin as SkinMode);
      setThemeState(
        normalized.themeBySkin?.[normalized.activeSkin as SkinMode] ??
          DEFAULT_THEME_BY_SKIN[normalized.activeSkin as SkinMode],
      );
    },
    [],
  );

  const updateBackground = useCallback(
    (background: ThemeBackgroundSettings) => {
      setThemeAppearance((prev) =>
        normalizeAppearance({ ...prev, background }),
      );
    },
    [],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      skin,
      appearance: themeAppearance,
      setTheme: updateTheme,
      setSkin: updateSkin,
      setAppearance: updateAppearance,
      setBackground: updateBackground,
    }),
    [
      skin,
      theme,
      themeAppearance,
      updateAppearance,
      updateBackground,
      updateSkin,
      updateTheme,
    ],
  );

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
