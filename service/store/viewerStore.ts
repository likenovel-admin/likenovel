import { create } from "zustand";
import { persist } from "zustand/middleware";

interface IWorkSettings {
  fontFamily: "고딕" | "명조체" | "마루부리";
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
  resetSettings: () => void;
  setSettings: (newSettings: Partial<IWorkSettings>) => void;
}

const useViewStore = create<IWork>()(
  persist(
    (set) => ({
      currentLocation: "epubcfi(/6/2!/4/1:0)",
      setCurrentLocation: (newLocation) =>
        set(() => ({ currentLocation: newLocation })),
      settings: {
        fontFamily: "고딕",
        theme: "light",
        fontSize: 5,
        letterSpacing: 1,
        lineHeight: 2,
        marginSize: 2,
        useParagraphIndent: true,
        hideImageCover: false,
      },
      setSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      resetSettings: () =>
        set(() => ({
          settings: {
            fontFamily: "고딕",
            theme: "light",
            fontSize: 5,
            letterSpacing: 1,
            lineHeight: 2,
            marginSize: 2,
            useParagraphIndent: true,
            hideImageCover: false,
          },
        })),
    }),
    {
      name: "work-settings",
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<IWork> | undefined;
        return {
          ...currentState,
          ...persisted,
          settings: {
            ...currentState.settings,
            ...(persisted?.settings ?? {}),
          },
        };
      },
    }
  )
);

export default useViewStore;
