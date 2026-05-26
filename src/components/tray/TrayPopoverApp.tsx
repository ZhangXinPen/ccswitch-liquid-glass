import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ExternalLink,
  Power,
  RefreshCw,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { exit } from "@tauri-apps/plugin-process";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { Provider } from "@/types";
import type { AppId } from "@/lib/api";
import { providersApi } from "@/lib/api/providers";
import { ProviderIcon } from "@/components/ProviderIcon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TRAY_APPS: AppId[] = ["claude", "codex", "gemini"];

const APP_LABEL: Record<AppId, string> = {
  claude: "Claude",
  "claude-desktop": "Claude Desktop",
  codex: "Codex",
  gemini: "Gemini",
  opencode: "OpenCode",
  openclaw: "OpenClaw",
  hermes: "Hermes",
};

const APP_ICON: Record<AppId, string> = {
  claude: "claude",
  "claude-desktop": "claude",
  codex: "openai",
  gemini: "gemini",
  opencode: "opencode",
  openclaw: "openclaw",
  hermes: "hermes",
};

interface ProviderGroup {
  appId: AppId;
  providers: Provider[];
  currentId: string;
}

function providerUrl(provider: Provider) {
  if (provider.notes?.trim()) return provider.notes.trim();
  if (provider.websiteUrl?.trim()) return provider.websiteUrl.trim();

  const config = provider.settingsConfig as Record<string, any>;
  return (
    config?.env?.ANTHROPIC_BASE_URL ||
    config?.env?.GOOGLE_GEMINI_BASE_URL ||
    "未配置接口地址"
  );
}

function formatDate(value?: number) {
  if (!value) return "暂无更新时间";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function TrayPopoverApp() {
  const [groups, setGroups] = useState<ProviderGroup[]>([]);
  const [activeApp, setActiveApp] = useState<AppId>("claude");
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const next = await Promise.all(
        TRAY_APPS.map(async (appId) => {
          const [providerMap, currentId] = await Promise.all([
            providersApi.getAll(appId),
            providersApi.getCurrent(appId),
          ]);
          const providers = Object.values(providerMap).sort((a, b) => {
            const sortA = a.sortIndex ?? Number.MAX_SAFE_INTEGER;
            const sortB = b.sortIndex ?? Number.MAX_SAFE_INTEGER;
            if (sortA !== sortB) return sortA - sortB;
            return (a.createdAt ?? 0) - (b.createdAt ?? 0);
          });
          return { appId, providers, currentId };
        }),
      );
      setGroups(next);
      setActiveApp((prev) =>
        next.some((group) => group.appId === prev) ? prev : next[0]?.appId || "claude",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        void getCurrentWindow().hide();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let active = true;
    void getCurrentWindow()
      .onFocusChanged(({ payload }) => {
        if (!payload) {
          void getCurrentWindow().hide();
        }
      })
      .then((off) => {
        if (active) {
          unlisten = off;
        } else {
          off();
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
      unlisten?.();
    };
  }, []);

  const currentGroup = useMemo(
    () => groups.find((group) => group.appId === activeApp),
    [activeApp, groups],
  );

  const currentProvider = useMemo(() => {
    if (!currentGroup) return undefined;
    return currentGroup.providers.find(
      (provider) => provider.id === currentGroup.currentId,
    );
  }, [currentGroup]);

  const otherProviders = useMemo(() => {
    if (!currentGroup) return [];
    return currentGroup.providers;
  }, [currentGroup]);

  const handleSwitch = async (provider: Provider) => {
    if (!currentGroup || provider.id === currentGroup.currentId) return;
    setIsSwitching(provider.id);
    try {
      await providersApi.switch(provider.id, currentGroup.appId);
      await providersApi.updateTrayMenu();
      await load();
    } finally {
      setIsSwitching(null);
    }
  };

  const openMainWindow = async () => {
    await invoke("show_main_window");
    await getCurrentWindow().hide();
  };

  const openSettings = async () => {
    await invoke("show_main_window");
    await getCurrentWindow().hide();
  };

  return (
    <div className="tray-shell text-foreground">
      <section className="tray-popover" aria-label="CC Switch tray quick switch">
        <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="glass-icon-box flex h-9 w-9 items-center justify-center">
                <Sparkles className="h-4 w-4 text-cyan-600" />
              </span>
              <div>
                <h1 className="brand-gradient-text text-lg font-bold leading-tight">
                  CC Switch
                </h1>
                <p className="text-xs text-[var(--text-secondary)]">
                  {currentProvider ? "当前已启用" : "快速切换面板"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="glass-icon-button h-8 w-8"
              aria-label="设置"
              onClick={() => void openSettings()}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="glass-icon-button h-8 w-8"
              aria-label="关闭"
              onClick={() => void getCurrentWindow().hide()}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-1 px-4 pb-3">
          {groups.map((group) => (
            <button
              key={group.appId}
              type="button"
              className={cn(
                "glass-icon-button flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full text-xs font-semibold",
                activeApp === group.appId && "bg-white/65 text-blue-700 shadow-sm",
              )}
              onClick={() => setActiveApp(group.appId)}
              aria-label={`切换到 ${APP_LABEL[group.appId]}`}
            >
              <ProviderIcon
                icon={APP_ICON[group.appId]}
                name={APP_LABEL[group.appId]}
                size={15}
              />
              {APP_LABEL[group.appId]}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3">
          {isLoading ? (
            <div className="tray-provider-item px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
              正在读取服务商...
            </div>
          ) : error ? (
            <div className="tray-provider-item px-4 py-4 text-sm text-red-600">
              加载失败：{error}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="tray-provider-item tray-provider-item-active p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-600">
                    当前启用
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(24,168,255,0.85)]" />
                    在线
                  </span>
                </div>
                {currentProvider ? (
                  <ProviderSummary provider={currentProvider} appId={activeApp} />
                ) : (
                  <p className="text-sm text-[var(--text-secondary)]">
                    暂未选择服务商
                  </p>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between px-1">
                  <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                    快速切换
                  </h2>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {otherProviders.length} 项
                  </span>
                </div>
                <div className="space-y-2">
                  {otherProviders.map((provider) => {
                    const isCurrent = provider.id === currentGroup?.currentId;
                    return (
                      <button
                        key={provider.id}
                        type="button"
                        className={cn(
                          "tray-provider-item flex w-full items-center gap-3 p-3 text-left",
                          isCurrent && "tray-provider-item-active",
                        )}
                        onClick={() => void handleSwitch(provider)}
                        aria-label={`启用 ${provider.name}`}
                      >
                        <span className="glass-icon-box flex h-9 w-9 shrink-0 items-center justify-center">
                          <ProviderIcon
                            icon={provider.icon}
                            name={provider.name}
                            color={provider.iconColor}
                            size={18}
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">
                            {provider.name}
                          </span>
                          <span className="block truncate text-xs text-[var(--text-secondary)]">
                            {providerUrl(provider)}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "h-2.5 w-2.5 rounded-full",
                            isCurrent
                              ? "bg-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.7)]"
                              : "bg-slate-300/70",
                          )}
                        />
                        {isSwitching === provider.id && (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2 border-t border-white/45 px-4 py-3">
          <TrayAction label="打开" onClick={() => void openMainWindow()}>
            <ExternalLink className="h-4 w-4" />
          </TrayAction>
          <TrayAction label="刷新" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" />
          </TrayAction>
          <TrayAction label="设置" onClick={() => void openSettings()}>
            <Settings className="h-4 w-4" />
          </TrayAction>
          <TrayAction label="退出" danger onClick={() => void exit(0)}>
            <Power className="h-4 w-4" />
          </TrayAction>
        </div>
      </section>
    </div>
  );
}

function ProviderSummary({
  provider,
  appId,
}: {
  provider: Provider;
  appId: AppId;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="glass-icon-box flex h-11 w-11 shrink-0 items-center justify-center">
        <ProviderIcon
          icon={provider.icon || APP_ICON[appId]}
          name={provider.name}
          color={provider.iconColor}
          size={22}
        />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-base font-[650] text-[var(--text-primary)] dark:text-foreground">
          {provider.name}
        </h2>
        <p className="mt-1 truncate text-xs text-[#0969f6] dark:text-blue-300">
          {providerUrl(provider)}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)]">
          <span className="rounded-full bg-white/45 px-2 py-1">
            余额：自动查询
          </span>
          <span className="rounded-full bg-white/45 px-2 py-1">
            {formatDate(provider.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

function TrayAction({
  children,
  label,
  danger,
  onClick,
}: {
  children: ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "glass-icon-button flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-xs font-medium",
        danger && "hover:bg-red-500/10 hover:text-red-500",
      )}
      aria-label={label}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}
