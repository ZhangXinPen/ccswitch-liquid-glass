import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettingsQuery } from "@/lib/query";
import type { Settings, SkinMode, ThemeMode } from "@/types";

type Language = "zh" | "en" | "ja";

export type SettingsFormState = Omit<Settings, "language"> & {
  language: Language;
};

const DEFAULT_THEME_BY_SKIN: Record<SkinMode, ThemeMode> = {
  original: "system",
  glass: "system",
  custom: "system",
};

const normalizeLanguage = (lang?: string | null): Language => {
  if (!lang) return "zh";
  const normalized = lang.toLowerCase();
  return normalized === "en" || normalized === "ja" ? normalized : "zh";
};

const sanitizeDir = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export interface UseSettingsFormResult {
  settings: SettingsFormState | null;
  isLoading: boolean;
  initialLanguage: Language;
  updateSettings: (updates: Partial<SettingsFormState>) => void;
  resetSettings: (serverData: Settings | null) => void;
  readPersistedLanguage: () => Language;
  syncLanguage: (lang: Language) => void;
}

/**
 * useSettingsForm - 表单状态管理
 * 负责：
 * - 表单数据状态
 * - 表单字段更新
 * - 语言同步
 * - 表单重置
 */
export function useSettingsForm(): UseSettingsFormResult {
  const { i18n } = useTranslation();
  const { data, isLoading } = useSettingsQuery();

  const [settingsState, setSettingsState] = useState<SettingsFormState | null>(
    null,
  );

  const initialLanguageRef = useRef<Language>("zh");

  const readPersistedLanguage = useCallback((): Language => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("language");
      if (stored === "en" || stored === "zh" || stored === "ja") {
        return stored as Language;
      }
    }
    return normalizeLanguage(i18n.language);
  }, [i18n]);

  const syncLanguage = useCallback(
    (lang: Language) => {
      const current = normalizeLanguage(i18n.language);
      if (current !== lang) {
        void i18n.changeLanguage(lang);
      }
    },
    [i18n],
  );

  // 初始化设置数据
  useEffect(() => {
    if (!data) return;

    const normalizedLanguage = normalizeLanguage(
      data.language ?? readPersistedLanguage(),
    );

    const normalized: SettingsFormState = {
      ...data,
      showInTray: data.showInTray ?? true,
      minimizeToTrayOnClose: data.minimizeToTrayOnClose ?? true,
      useAppWindowControls: data.useAppWindowControls ?? false,
      enableClaudePluginIntegration:
        data.enableClaudePluginIntegration ?? false,
      silentStartup: data.silentStartup ?? false,
      skipClaudeOnboarding: data.skipClaudeOnboarding ?? false,
      themeAppearance: {
        activeSkin: data.themeAppearance?.activeSkin ?? "glass",
        themeBySkin: {
          ...DEFAULT_THEME_BY_SKIN,
          ...(data.themeAppearance?.themeBySkin ?? {}),
        },
        background: {
          enabled: data.themeAppearance?.background?.enabled ?? false,
          imagePath: data.themeAppearance?.background?.imagePath,
          opacity: data.themeAppearance?.background?.opacity ?? 1,
          blur: data.themeAppearance?.background?.blur ?? 0,
          fit: data.themeAppearance?.background?.fit ?? "cover",
          position: data.themeAppearance?.background?.position ?? "center",
          overlayOpacity:
            data.themeAppearance?.background?.overlayOpacity ?? 0.28,
        },
      },
      claudeConfigDir: sanitizeDir(data.claudeConfigDir),
      codexConfigDir: sanitizeDir(data.codexConfigDir),
      geminiConfigDir: sanitizeDir(data.geminiConfigDir),
      opencodeConfigDir: sanitizeDir(data.opencodeConfigDir),
      openclawConfigDir: sanitizeDir(data.openclawConfigDir),
      language: normalizedLanguage,
    };

    setSettingsState(normalized);
    initialLanguageRef.current = normalizedLanguage;
    syncLanguage(normalizedLanguage);
  }, [data, readPersistedLanguage, syncLanguage]);

  const updateSettings = useCallback(
    (updates: Partial<SettingsFormState>) => {
      setSettingsState((prev) => {
        const base =
          prev ??
          ({
            showInTray: true,
            minimizeToTrayOnClose: true,
            useAppWindowControls: false,
            enableClaudePluginIntegration: false,
            skipClaudeOnboarding: false,
            themeAppearance: {
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
            },
            language: readPersistedLanguage(),
          } as SettingsFormState);

        const next: SettingsFormState = {
          ...base,
          ...updates,
        };

        if (updates.language) {
          const normalized = normalizeLanguage(updates.language);
          next.language = normalized;
          syncLanguage(normalized);
        }

        return next;
      });
    },
    [readPersistedLanguage, syncLanguage],
  );

  const resetSettings = useCallback(
    (serverData: Settings | null) => {
      if (!serverData) return;

      const normalizedLanguage = normalizeLanguage(
        serverData.language ?? readPersistedLanguage(),
      );

      const normalized: SettingsFormState = {
        ...serverData,
        showInTray: serverData.showInTray ?? true,
        minimizeToTrayOnClose: serverData.minimizeToTrayOnClose ?? true,
        useAppWindowControls: serverData.useAppWindowControls ?? false,
        enableClaudePluginIntegration:
          serverData.enableClaudePluginIntegration ?? false,
        silentStartup: serverData.silentStartup ?? false,
        skipClaudeOnboarding: serverData.skipClaudeOnboarding ?? false,
        themeAppearance: {
          activeSkin: serverData.themeAppearance?.activeSkin ?? "glass",
          themeBySkin: {
            ...DEFAULT_THEME_BY_SKIN,
            ...(serverData.themeAppearance?.themeBySkin ?? {}),
          },
          background: {
            enabled: serverData.themeAppearance?.background?.enabled ?? false,
            imagePath: serverData.themeAppearance?.background?.imagePath,
            opacity: serverData.themeAppearance?.background?.opacity ?? 1,
            blur: serverData.themeAppearance?.background?.blur ?? 0,
            fit: serverData.themeAppearance?.background?.fit ?? "cover",
            position:
              serverData.themeAppearance?.background?.position ?? "center",
            overlayOpacity:
              serverData.themeAppearance?.background?.overlayOpacity ?? 0.28,
          },
        },
        claudeConfigDir: sanitizeDir(serverData.claudeConfigDir),
        codexConfigDir: sanitizeDir(serverData.codexConfigDir),
        geminiConfigDir: sanitizeDir(serverData.geminiConfigDir),
        opencodeConfigDir: sanitizeDir(serverData.opencodeConfigDir),
        openclawConfigDir: sanitizeDir(serverData.openclawConfigDir),
        language: normalizedLanguage,
      };

      setSettingsState(normalized);
      syncLanguage(initialLanguageRef.current);
    },
    [readPersistedLanguage, syncLanguage],
  );

  return {
    settings: settingsState,
    isLoading,
    initialLanguage: initialLanguageRef.current,
    updateSettings,
    resetSettings,
    readPersistedLanguage,
    syncLanguage,
  };
}
