import { create } from "zustand";
import { persist } from "zustand/middleware";

interface IWorkSettings {
  fontFamily: "고딕" | "명조체" | "마루부리" | "조선궁서" | "나눔고딕" | "본고딕" | "KoPub돋움";
  theme: "light" | "dark" | "green" | "blue";
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  marginSize: number;
  useParagraphIndent: boolean;
  hideImageCover: boolean;
}

interface IWork {
  currentLocation: string | number;
  setCurrentLocation: (newLocation: string | number) => void;
  settings: IWorkSettings;
  episodeListAlignType: "new" | "old";
  setEpisodeListAlignType: (alignType: "new" | "old") => void;
  resetSettings: () => void;
  setSettings: (newSettings: Partial<IWorkSettings>) => void;
}

const DEFAULT_SETTINGS: IWorkSettings = {
  fontFamily: "고딕",
  theme: "light",
  fontSize: 5,
  letterSpacing: 1,
  lineHeight: 2,
  marginSize: 2,
  useParagraphIndent: true,
  hideImageCover: true,
};

const clampNumber = (value: unknown, min: number, max: number, fallback: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

const sanitizeSettings = (
  settings?: Partial<IWorkSettings> | null
): IWorkSettings => {
  const next = settings ?? {};
  const fontFamily =
    next.fontFamily === "고딕" ||
    next.fontFamily === "명조체" ||
    next.fontFamily === "마루부리" ||
    next.fontFamily === "조선궁서" ||
    next.fontFamily === "나눔고딕" ||
    next.fontFamily === "본고딕" ||
    next.fontFamily === "KoPub돋움"
      ? next.fontFamily
      : DEFAULT_SETTINGS.fontFamily;
  const theme =
    next.theme === "light" ||
    next.theme === "dark" ||
    next.theme === "green" ||
    next.theme === "blue"
      ? next.theme
      : DEFAULT_SETTINGS.theme;

  return {
    fontFamily,
    theme,
    fontSize: clampNumber(next.fontSize, 0, 9, DEFAULT_SETTINGS.fontSize),
    letterSpacing: clampNumber(
      next.letterSpacing,
      0,
      4,
      DEFAULT_SETTINGS.letterSpacing
    ),
    lineHeight: clampNumber(next.lineHeight, 0, 4, DEFAULT_SETTINGS.lineHeight),
    marginSize: clampNumber(next.marginSize, 0, 4, DEFAULT_SETTINGS.marginSize),
    useParagraphIndent:
      typeof next.useParagraphIndent === "boolean"
        ? next.useParagraphIndent
        : DEFAULT_SETTINGS.useParagraphIndent,
    hideImageCover:
      typeof next.hideImageCover === "boolean"
        ? next.hideImageCover
        : DEFAULT_SETTINGS.hideImageCover,
  };
};

const useViewStore = create<IWork>()(
  persist(
    (set) => ({
      currentLocation: "epubcfi(/6/2!/4/1:0)",
      setCurrentLocation: (newLocation) =>
        set(() => ({ currentLocation: newLocation })),
      settings: DEFAULT_SETTINGS,
      episodeListAlignType: "new",
      setEpisodeListAlignType: (episodeListAlignType) =>
        set(() => ({ episodeListAlignType })),
      setSettings: (newSettings) =>
        set((state) => ({
          settings: sanitizeSettings({ ...state.settings, ...newSettings }),
        })),
      resetSettings: () =>
        set(() => ({
          settings: DEFAULT_SETTINGS,
        })),
    }),
    {
      name: "work-settings",
      version: 3,
      partialize: (state) => ({
        settings: sanitizeSettings(state.settings),
        episodeListAlignType:
          state.episodeListAlignType === "old" ? "old" : "new",
      }),
      migrate: (persistedState, version) => {
        const persisted = persistedState as Partial<IWork> | undefined;
        const settings = sanitizeSettings(persisted?.settings);
        const migratedSettings =
          typeof version !== "number" || version < 3
            ? { ...settings, hideImageCover: true }
            : settings;

        return {
          settings: migratedSettings,
          episodeListAlignType:
            persisted?.episodeListAlignType === "old" ? "old" : "new",
        };
      },
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<IWork> | undefined;
        return {
          ...currentState,
          settings: sanitizeSettings(persisted?.settings),
          episodeListAlignType:
            persisted?.episodeListAlignType === "old" ? "old" : "new",
        };
      },
    }
  )
);

export default useViewStore;
