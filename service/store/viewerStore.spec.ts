import assert from "node:assert/strict";
import type useViewStoreType from "./viewerStore";

const installLocalStorage = (seed: Record<string, string> = {}) => {
  const storage = { ...seed };

  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
    },
    configurable: true,
  });

  return storage;
};

const loadViewerStore = (): typeof useViewStoreType => {
  delete require.cache[require.resolve("./viewerStore")];
  return require("./viewerStore").default;
};

{
  installLocalStorage();
  const useViewStore = loadViewerStore();
  const { settings } = useViewStore.getState();

  assert.equal(settings.hideImageCover, true);

  useViewStore.getState().setSettings({ hideImageCover: false });

  assert.equal(useViewStore.getState().settings.hideImageCover, false);

  useViewStore.getState().resetSettings();

  assert.equal(useViewStore.getState().settings.hideImageCover, true);
}

{
  installLocalStorage({
    "work-settings": JSON.stringify({
      state: {
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
        episodeListAlignType: "new",
      },
      version: 2,
    }),
  });
  const useViewStore = loadViewerStore();

  assert.equal(useViewStore.getState().settings.hideImageCover, true);
}
