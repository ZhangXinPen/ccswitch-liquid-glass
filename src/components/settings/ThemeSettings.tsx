import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Monitor,
  Moon,
  Palette,
  Sun,
  Image,
  Trash2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { settingsApi } from "@/lib/api";
import { useTheme } from "@/components/theme-provider";
import { convertFileSrc } from "@tauri-apps/api/core";
import type { SettingsFormState } from "@/hooks/useSettings";
import type {
  SkinMode,
  ThemeMode,
  ThemeAppearanceSettings,
  ThemeBackgroundSettings,
} from "@/types";

interface ThemeSettingsProps {
  value?: ThemeAppearanceSettings;
  onChange?: (updates: Partial<SettingsFormState>) => void;
}

const SKINS: Array<{
  key: SkinMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "original", label: "settings.themeSkinOriginal", icon: Monitor },
  { key: "glass", label: "settings.themeSkinGlass", icon: Sparkles },
  { key: "custom", label: "settings.themeSkinCustom", icon: Palette },
];

const THEMES: Array<{
  key: ThemeMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "light", label: "settings.themeLight", icon: Sun },
  { key: "dark", label: "settings.themeDark", icon: Moon },
  { key: "system", label: "settings.themeSystem", icon: Monitor },
];

export function ThemeSettings({ value, onChange }: ThemeSettingsProps) {
  const { t } = useTranslation();
  const { appearance, skin, theme, setAppearance } = useTheme();
  const [isPicking, setIsPicking] = useState(false);

  const resolved = value ?? appearance;
  const activeSkin = resolved?.activeSkin ?? skin;
  const themeBySkin = resolved?.themeBySkin ?? appearance.themeBySkin ?? {};
  const background = resolved?.background ?? appearance.background;

  const currentTheme = themeBySkin?.[activeSkin] ?? theme;

  const updateAppearance = (next: ThemeAppearanceSettings) => {
    setAppearance(next);
    onChange?.({ themeAppearance: next });
  };

  const handleSkinChange = (nextSkin: SkinMode) => {
    const next = {
      ...resolved,
      activeSkin: nextSkin,
      themeBySkin: {
        ...(resolved?.themeBySkin ?? {}),
        [activeSkin]: theme,
      },
      background: resolved?.background ?? appearance.background,
    } satisfies ThemeAppearanceSettings;
    updateAppearance(next);
  };

  const handleThemeChange = (nextTheme: ThemeMode) => {
    const next = {
      ...resolved,
      activeSkin,
      themeBySkin: {
        ...(resolved?.themeBySkin ?? {}),
        [activeSkin]: nextTheme,
      },
      background: resolved?.background ?? appearance.background,
    } satisfies ThemeAppearanceSettings;
    updateAppearance(next);
  };

  const handleBackgroundChange = (nextBackground: ThemeBackgroundSettings) => {
    const next = {
      ...resolved,
      activeSkin,
      themeBySkin,
      background: nextBackground,
    } satisfies ThemeAppearanceSettings;
    updateAppearance(next);
  };

  const handlePickBackground = async () => {
    setIsPicking(true);
    try {
      const picked = await settingsApi.pickThemeImage(background?.imagePath);
      if (!picked) return;
      handleBackgroundChange({
        ...(background ?? {}),
        enabled: true,
        imagePath: picked,
      });
    } finally {
      setIsPicking(false);
    }
  };

  const previewStyle = useMemo(
    () => ({
      backgroundImage:
        background?.enabled && background.imagePath
          ? `url("${convertFileSrc(background.imagePath)}")`
          : undefined,
      backgroundSize: background?.fit ?? "cover",
      backgroundPosition: background?.position ?? "center",
      opacity: background?.enabled ? (background.opacity ?? 1) : 0,
      filter: `blur(${background?.blur ?? 0}px)`,
    }),
    [background],
  );

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h3 className="text-sm font-medium">{t("settings.theme")}</h3>
        <p className="text-xs text-muted-foreground">
          {t("settings.themeHint")}
        </p>
      </header>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            {t("settings.themeSkin")}
          </div>
          <div className="grid gap-2">
            {SKINS.map((item) => {
              const Icon = item.icon;
              const active = activeSkin === item.key;
              return (
                <Button
                  key={item.key}
                  type="button"
                  variant={active ? "default" : "ghost"}
                  className={cn("justify-start gap-2", active && "shadow-sm")}
                  onClick={() => handleSkinChange(item.key)}
                >
                  <Icon className="h-4 w-4" />
                  {t(item.label)}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            {t("settings.themeMode")}
          </div>
          <div className="grid gap-2">
            {THEMES.map((item) => {
              const Icon = item.icon;
              const active = currentTheme === item.key;
              return (
                <Button
                  key={item.key}
                  type="button"
                  variant={active ? "default" : "ghost"}
                  className={cn("justify-start gap-2", active && "shadow-sm")}
                  onClick={() => handleThemeChange(item.key)}
                >
                  <Icon className="h-4 w-4" />
                  {t(item.label)}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            {t("settings.themeBackground")}
          </div>
          <div className="rounded-xl border border-border/60 bg-background/60 p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handlePickBackground}
                disabled={isPicking}
              >
                <Image className="mr-2 h-4 w-4" />
                {isPicking ? t("common.loading") : t("settings.themePickImage")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  handleBackgroundChange({
                    ...(background ?? {}),
                    enabled: false,
                    imagePath: undefined,
                  })
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("settings.themeBackgroundOpacity")}</span>
                <span>{Math.round((background?.opacity ?? 1) * 100)}%</span>
              </div>
              <input
                type="range"
                className="w-full accent-cyan-500"
                value={Math.round((background?.opacity ?? 1) * 100)}
                min={0}
                max={100}
                step={1}
                onChange={(event) =>
                  handleBackgroundChange({
                    ...(background ?? {}),
                    opacity: Number(event.target.value) / 100,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("settings.themeBackgroundBlur")}</span>
                <span>{background?.blur ?? 0}px</span>
              </div>
              <input
                type="range"
                className="w-full accent-cyan-500"
                value={background?.blur ?? 0}
                min={0}
                max={40}
                step={1}
                onChange={(event) =>
                  handleBackgroundChange({
                    ...(background ?? {}),
                    blur: Number(event.target.value),
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Select
                value={background?.fit ?? "cover"}
                onValueChange={(fit) =>
                  handleBackgroundChange({
                    ...(background ?? {}),
                    fit: fit as "cover" | "contain",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("settings.themeBackgroundFit")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cover">
                    {t("settings.themeBackgroundFitCover")}
                  </SelectItem>
                  <SelectItem value="contain">
                    {t("settings.themeBackgroundFitContain")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={background?.position ?? "center"}
                onChange={(event) =>
                  handleBackgroundChange({
                    ...(background ?? {}),
                    position: event.target.value,
                  })
                }
                placeholder={t("settings.themeBackgroundPosition")}
              />
            </div>

            <div className="rounded-lg border border-border/50 bg-muted/40 p-2">
              <div className="h-24 overflow-hidden rounded-md">
                <div
                  className="h-full w-full bg-cover bg-center"
                  style={previewStyle}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
