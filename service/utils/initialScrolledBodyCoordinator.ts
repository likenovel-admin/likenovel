export type InitialScrolledBodyAttemptResult =
  | "waiting"
  | "started"
  | "complete"
  | "failed";

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

  const clearFallback = () => {
    if (fallbackTimer === null) return;
    clearScheduled(fallbackTimer);
    fallbackTimer = null;
  };

  const attempt = () => {
    if (cancelled || complete || !bookReady) return;

    const result = attemptBodyAttachment();
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
