export type InitialScrolledBodyAttemptResult =
  | "waiting"
  | "complete"
  | "failed"
  | {
      state: "started";
      completion: Promise<unknown>;
    };

type TimerHandle = ReturnType<typeof setTimeout>;

interface InitialScrolledBodyCoordinatorOptions {
  waitForBookReady: () => Promise<unknown> | unknown;
  attemptBodyAttachment: () => InitialScrolledBodyAttemptResult;
  schedule?: (callback: () => void, delayMs: number) => TimerHandle;
  clearScheduled?: (handle: TimerHandle) => void;
}

export interface InitialScrolledBodyCoordinator {
  start: () => void;
  onRendered: () => void;
  cancel: () => void;
}

interface ScrolledRenditionLocation {
  start?: {
    cfi?: unknown;
  };
}

export const getScrolledResizeCfi = (
  location: ScrolledRenditionLocation | null | undefined
) => {
  const cfi = location?.start?.cfi;
  return typeof cfi === "string" && cfi.length > 0 ? cfi : null;
};

export type ScrolledResizeAnchor =
  | { kind: "cfi"; cfi: string }
  | { kind: "last-page"; viewportTop: number };

export const resolveScrolledResizeAnchor = (
  lastPageViewportTop: number | null,
  resizeCfi: string | null
): ScrolledResizeAnchor | null => {
  if (
    lastPageViewportTop !== null &&
    Number.isFinite(lastPageViewportTop)
  ) {
    return { kind: "last-page", viewportTop: lastPageViewportTop };
  }
  return resizeCfi ? { kind: "cfi", cfi: resizeCfi } : null;
};

interface ScrolledLastPageScrollContainer {
  addEventListener(
    type: "scroll",
    listener: () => void,
    options?: { passive?: boolean }
  ): void;
  removeEventListener(type: "scroll", listener: () => void): void;
}

interface ScrolledLastPageViewportTrackerOptions<
  Container extends ScrolledLastPageScrollContainer,
> {
  readViewportTop: (container: Container) => number | null;
  isFrozen: () => boolean;
  onViewportTopChange: (viewportTop: number | null) => void;
}

export interface ScrolledLastPageViewportTracker<
  Container extends ScrolledLastPageScrollContainer,
> {
  bind: (container: Container) => void;
  clear: () => void;
}

export const createScrolledLastPageViewportTracker = <
  Container extends ScrolledLastPageScrollContainer,
>({
  readViewportTop,
  isFrozen,
  onViewportTopChange,
}: ScrolledLastPageViewportTrackerOptions<Container>): ScrolledLastPageViewportTracker<Container> => {
  let boundContainer: Container | null = null;

  const updateViewportTop = () => {
    if (!boundContainer || isFrozen()) return;
    onViewportTopChange(readViewportTop(boundContainer));
  };

  const clear = () => {
    boundContainer?.removeEventListener("scroll", updateViewportTop);
    boundContainer = null;
    onViewportTopChange(null);
  };

  return {
    bind: (container) => {
      if (boundContainer === container) {
        updateViewportTop();
        return;
      }

      boundContainer?.removeEventListener("scroll", updateViewportTop);
      boundContainer = container;
      updateViewportTop();
      container.addEventListener("scroll", updateViewportTop, {
        passive: true,
      });
    },
    clear,
  };
};

type AnimationFrameHandle = ReturnType<typeof requestAnimationFrame>;

interface ScrolledResizeLocationRestorerOptions {
  enqueueAfterRenditionWork: () => Promise<unknown> | unknown;
  waitForStableLayout: () => Promise<unknown> | unknown;
  restoreAnchor: (
    anchor: ScrolledResizeAnchor
  ) => Promise<unknown> | unknown;
  isActive?: () => boolean;
  scheduleFrame?: (callback: () => void) => AnimationFrameHandle;
  cancelFrame?: (handle: AnimationFrameHandle) => void;
  onRestoreError?: (error: unknown) => void;
  onIdle?: () => void;
}

export interface ScrolledResizeLocationRestorer {
  onResized: (anchor: ScrolledResizeAnchor | null) => boolean;
  isBusy: () => boolean;
  cancel: () => void;
}

const isValidScrolledResizeAnchor = (
  anchor: ScrolledResizeAnchor | null
): anchor is ScrolledResizeAnchor =>
  Boolean(
    anchor &&
      ((anchor.kind === "cfi" && anchor.cfi.length > 0) ||
        (anchor.kind === "last-page" &&
          Number.isFinite(anchor.viewportTop)))
  );

export const createScrolledResizeLocationRestorer = ({
  enqueueAfterRenditionWork,
  waitForStableLayout,
  restoreAnchor,
  isActive = () => true,
  scheduleFrame = (callback) => globalThis.requestAnimationFrame(callback),
  cancelFrame = (handle) => globalThis.cancelAnimationFrame(handle),
  onRestoreError,
  onIdle,
}: ScrolledResizeLocationRestorerOptions): ScrolledResizeLocationRestorer => {
  let cancelled = false;
  let generation = 0;
  let anchor: ScrolledResizeAnchor | null = null;
  let scheduledFrame: AnimationFrameHandle | null = null;
  let inFlightGeneration: number | null = null;

  const clearFrame = () => {
    if (scheduledFrame === null) return;
    cancelFrame(scheduledFrame);
    scheduledFrame = null;
  };

  const cancel = () => {
    cancelled = true;
    generation += 1;
    inFlightGeneration = null;
    anchor = null;
    clearFrame();
  };

  const settle = (runGeneration: number, error?: unknown) => {
    if (inFlightGeneration === runGeneration) {
      inFlightGeneration = null;
    }
    if (
      cancelled ||
      runGeneration !== generation
    ) {
      return;
    }

    anchor = null;
    if (error !== undefined) onRestoreError?.(error);
    onIdle?.();
  };

  const isCurrent = (runGeneration: number) =>
    !cancelled && runGeneration === generation && isActive();

  const startRestore = (
    runGeneration: number,
    restoreTarget: ScrolledResizeAnchor
  ) => {
    void Promise.resolve()
      .then(enqueueAfterRenditionWork)
      .then(async () => {
        if (!isCurrent(runGeneration)) return false;
        await waitForStableLayout();
        return true;
      })
      .then(
        (layoutReady) => {
          if (!layoutReady || !isCurrent(runGeneration)) return;
          try {
            scheduledFrame = scheduleFrame(() => {
              scheduledFrame = null;
              if (!isCurrent(runGeneration)) return;

              inFlightGeneration = runGeneration;
              let restoreResult: Promise<unknown> | unknown;
              try {
                restoreResult = restoreAnchor(restoreTarget);
              } catch (error) {
                settle(runGeneration, error);
                return;
              }

              void Promise.resolve(restoreResult).then(
                () => settle(runGeneration),
                (error) => settle(runGeneration, error)
              );
            });
          } catch (error) {
            settle(runGeneration, error);
          }
        },
        (error) => {
          if (isCurrent(runGeneration)) settle(runGeneration, error);
        }
      );
  };

  return {
    onResized: (nextAnchor) => {
      if (cancelled || !isActive()) return false;
      if (!anchor) {
        if (!isValidScrolledResizeAnchor(nextAnchor)) return false;
        anchor = { ...nextAnchor };
      }

      generation += 1;
      clearFrame();
      startRestore(generation, anchor);
      return true;
    },
    isBusy: () => anchor !== null,
    cancel,
  };
};

interface InitialScrolledSpineSection {
  index?: number;
  href?: string;
  canonical?: string;
  idref?: string;
}

interface InitialScrolledSpine {
  get?: (index: number) => InitialScrolledSpineSection | null | undefined;
  spineItems?: InitialScrolledSpineSection[];
  items?: InitialScrolledSpineSection[];
}

interface InitialScrolledView {
  section?: InitialScrolledSpineSection | null;
}

const getSpineSection = (
  spine: InitialScrolledSpine | null | undefined,
  index: number
) => {
  if (typeof spine?.get === "function") return spine.get(index);
  if (Array.isArray(spine?.spineItems)) return spine.spineItems[index];
  if (Array.isArray(spine?.items)) return spine.items[index];
  return null;
};

const isMatchingSection = (
  view: InitialScrolledView,
  section: InitialScrolledSpineSection
) => {
  const viewSection = view.section;
  return (
    viewSection === section ||
    (typeof viewSection?.index === "number" &&
      viewSection.index === section.index) ||
    Boolean(viewSection?.href && viewSection.href === section.href) ||
    Boolean(viewSection?.idref && viewSection.idref === section.idref)
  );
};

export const shouldDeferInitialScrolledLastPageHost = (
  spine: InitialScrolledSpine | null | undefined,
  views: InitialScrolledView[]
) => {
  const firstSection = getSpineSection(spine, 0);
  if (!firstSection) return false;

  const firstSpineMarker = [
    firstSection.href,
    firstSection.canonical,
    firstSection.idref,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (!firstSpineMarker.includes("cover")) return false;

  const bodySection = getSpineSection(spine, 1);
  if (!bodySection) return false;

  return !views.some(
    (view) => view.section != null && !isMatchingSection(view, firstSection)
  );
};

interface InitialScrolledBodyView {
  displayed?: boolean;
  display?: (request: unknown) => Promise<unknown> | unknown;
  show?: () => void;
}

interface InitialScrolledBodyViewAttacherOptions {
  findBodyView: () => InitialScrolledBodyView | null | undefined;
  appendBodyView: () => InitialScrolledBodyView | null | undefined;
  request: unknown;
  enqueueViewTask?: <T>(task: () => Promise<T> | T) => Promise<T>;
  isActive?: () => boolean;
  onDisplayError?: (error: unknown, attempt: number) => void;
  onAttachmentError?: (error: unknown) => void;
}

export interface InitialScrolledBodyViewAttacher {
  attempt: () => InitialScrolledBodyAttemptResult;
}

export const createInitialScrolledBodyViewAttacher = ({
  findBodyView,
  appendBodyView,
  request,
  enqueueViewTask = (task) => {
    try {
      return Promise.resolve(task());
    } catch (error) {
      return Promise.reject(error);
    }
  },
  isActive = () => true,
  onDisplayError,
  onAttachmentError,
}: InitialScrolledBodyViewAttacherOptions): InitialScrolledBodyViewAttacher => {
  let ownedView: InitialScrolledBodyView | null = null;
  let ownedCompletion: Promise<unknown> | null = null;
  let displayAttempts = 0;

  const startQueuedAttachment = (): InitialScrolledBodyAttemptResult => {
    let completion: Promise<unknown>;
    const displayAttemptsBeforeTask = displayAttempts;
    try {
      completion = enqueueViewTask(async () => {
        if (!isActive()) return "failed";

        let bodyView = findBodyView();
        if (bodyView && bodyView !== ownedView) {
          if (bodyView.displayed) {
            bodyView.show?.();
            return "complete";
          }
          return "waiting";
        }

        if (!bodyView) {
          if (ownedView) return "failed";
          bodyView = appendBodyView();
          if (!bodyView) return "failed";
          ownedView = bodyView;
        }

        if (bodyView.displayed) {
          bodyView.show?.();
          return "complete";
        }
        if (typeof bodyView.display !== "function" || displayAttempts >= 2) {
          return "failed";
        }

        const attemptNumber = displayAttempts + 1;
        displayAttempts = attemptNumber;
        try {
          await bodyView.display(request);
        } catch (error) {
          onDisplayError?.(error, attemptNumber);
          throw error;
        }

        if (!isActive()) return "failed";
        bodyView.show?.();
        return "complete";
      });
    } catch (error) {
      completion = Promise.reject(error);
    }
    ownedCompletion = completion;

    void completion.then(
      () => {
        if (ownedCompletion === completion) ownedCompletion = null;
      },
      (error) => {
        if (ownedCompletion === completion) ownedCompletion = null;
        if (displayAttempts === displayAttemptsBeforeTask) {
          onAttachmentError?.(error);
        }
      }
    );

    return { state: "started", completion };
  };

  return {
    attempt: () => {
      if (!isActive()) return "failed";
      if (ownedCompletion) {
        return { state: "started", completion: ownedCompletion };
      }

      const bodyView = findBodyView();
      if (bodyView) {
        if (bodyView.displayed) {
          bodyView.show?.();
          return "complete";
        }
        if (bodyView !== ownedView) return "waiting";
        if (displayAttempts >= 2) return "failed";
        return startQueuedAttachment();
      }

      if (ownedView) return "failed";
      return startQueuedAttachment();
    },
  };
};

export const createInitialScrolledBodyCoordinator = ({
  waitForBookReady,
  attemptBodyAttachment,
  schedule = (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
  clearScheduled = (handle) => globalThis.clearTimeout(handle),
}: InitialScrolledBodyCoordinatorOptions): InitialScrolledBodyCoordinator => {
  let cancelled = false;
  let complete = false;
  let started = false;
  let bookReady = false;
  let fallbackUsed = false;
  let fallbackTimer: TimerHandle | null = null;
  let displayInFlight = false;
  let displayRecoveryUsed = false;

  const clearFallback = () => {
    if (fallbackTimer === null) return;
    clearScheduled(fallbackTimer);
    fallbackTimer = null;
  };

  const attempt = () => {
    if (cancelled || complete || !bookReady || displayInFlight) return;

    const result = attemptBodyAttachment();
    if (typeof result === "object" && result.state === "started") {
      displayInFlight = true;
      clearFallback();
      void result.completion.then(
        (outcome) => {
          if (cancelled) return;
          displayInFlight = false;
          if (outcome === "waiting") {
            attempt();
            return;
          }
          complete = true;
          clearFallback();
        },
        () => {
          if (cancelled) return;
          displayInFlight = false;
          if (displayRecoveryUsed) {
            complete = true;
            clearFallback();
            return;
          }
          displayRecoveryUsed = true;
          clearFallback();
          fallbackTimer = schedule(() => {
            fallbackTimer = null;
            attempt();
          }, 250);
        }
      );
      return;
    }

    if (result !== "waiting") {
      complete = true;
      clearFallback();
      return;
    }

    if (fallbackUsed || fallbackTimer !== null) return;
    fallbackTimer = schedule(() => {
      fallbackTimer = null;
      fallbackUsed = true;
      attempt();
    }, 250);
  };

  const start = () => {
    if (cancelled || complete || started) return;

    started = true;
    void Promise.resolve(waitForBookReady())
      .then(() => {
        if (cancelled) return;
        bookReady = true;
        attempt();
      })
      .catch(() => {
        complete = true;
        clearFallback();
      });
  };

  return {
    start,
    onRendered: attempt,
    cancel: () => {
      cancelled = true;
      clearFallback();
    },
  };
};
