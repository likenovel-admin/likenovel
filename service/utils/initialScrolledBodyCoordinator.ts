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

interface InitialScrolledBodyView {
  displayed?: boolean;
  display?: (request: unknown) => Promise<unknown> | unknown;
  show?: () => void;
}

interface InitialScrolledBodyViewAttacherOptions {
  findBodyView: () => InitialScrolledBodyView | null | undefined;
  appendBodyView: () => InitialScrolledBodyView | null | undefined;
  request: unknown;
  onDisplayError?: (error: unknown, attempt: number) => void;
}

export interface InitialScrolledBodyViewAttacher {
  attempt: () => InitialScrolledBodyAttemptResult;
}

export const createInitialScrolledBodyViewAttacher = ({
  findBodyView,
  appendBodyView,
  request,
  onDisplayError,
}: InitialScrolledBodyViewAttacherOptions): InitialScrolledBodyViewAttacher => {
  let ownedView: InitialScrolledBodyView | null = null;
  let ownedCompletion: Promise<unknown> | null = null;
  let displayAttempts = 0;

  const startOwnedDisplay = (
    view: InitialScrolledBodyView
  ): InitialScrolledBodyAttemptResult => {
    if (typeof view.display !== "function" || displayAttempts >= 2) {
      return "failed";
    }

    displayAttempts += 1;
    let completion: Promise<unknown>;
    try {
      completion = Promise.resolve(view.display(request)).then(() => {
        view.show?.();
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
        onDisplayError?.(error, displayAttempts);
      }
    );

    return { state: "started", completion };
  };

  return {
    attempt: () => {
      const bodyView = findBodyView();
      if (bodyView) {
        if (bodyView.displayed) {
          bodyView.show?.();
          return "complete";
        }
        if (bodyView !== ownedView) return "waiting";
        if (ownedCompletion) {
          return { state: "started", completion: ownedCompletion };
        }
        return startOwnedDisplay(bodyView);
      }

      if (ownedView) return "failed";

      const appendedView = appendBodyView();
      if (!appendedView) return "failed";
      ownedView = appendedView;
      return startOwnedDisplay(appendedView);
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
        () => {
          if (cancelled) return;
          displayInFlight = false;
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
