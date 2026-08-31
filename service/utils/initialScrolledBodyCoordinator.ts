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
