import assert from "node:assert/strict";
import {
  createInitialScrolledBodyCoordinator,
  createInitialScrolledBodyViewAttacher,
} from "./initialScrolledBodyCoordinator.ts";

type ScheduledCallback = {
  callback: () => void;
  delayMs: number;
  cancelled: boolean;
};

const scheduled: ScheduledCallback[] = [];
let managerReady = false;
let attemptCount = 0;

const coordinator = createInitialScrolledBodyCoordinator({
  waitForBookReady: async () => undefined,
  attemptBodyAttachment: () => {
    attemptCount += 1;
    return managerReady
      ? { state: "started", completion: Promise.resolve() }
      : "waiting";
  },
  schedule: (callback, delayMs) => {
    scheduled.push({ callback, delayMs, cancelled: false });
    return scheduled.length as ReturnType<typeof setTimeout>;
  },
  clearScheduled: (handle) => {
    const scheduledCallback = scheduled[Number(handle) - 1];
    if (scheduledCallback) scheduledCallback.cancelled = true;
  },
});

coordinator.start();
await Promise.resolve();

scheduled.find(({ delayMs }) => delayMs === 0)?.callback();
assert.equal(attemptCount, 1);

managerReady = true;
coordinator.onRendered();

assert.equal(
  attemptCount,
  2,
  "a rendered event must retry body attachment immediately once the manager is ready"
);

coordinator.onRendered();
scheduled
  .filter(({ cancelled }) => !cancelled)
  .forEach(({ callback }) => callback());
assert.equal(attemptCount, 2, "body attachment must start only once");
assert.deepEqual(
  scheduled.map(({ delayMs }) => delayMs),
  [250],
  "only one short manager-race fallback may be scheduled"
);
assert.equal(scheduled[0].cancelled, true);

{
  const callbacks: ScheduledCallback[] = [];
  let attempts = 0;
  const cancelledCoordinator = createInitialScrolledBodyCoordinator({
    waitForBookReady: async () => undefined,
    attemptBodyAttachment: () => {
      attempts += 1;
      return "waiting";
    },
    schedule: (callback, delayMs) => {
      callbacks.push({ callback, delayMs, cancelled: false });
      return callbacks.length as ReturnType<typeof setTimeout>;
    },
    clearScheduled: (handle) => {
      const scheduledCallback = callbacks[Number(handle) - 1];
      if (scheduledCallback) scheduledCallback.cancelled = true;
    },
  });

  cancelledCoordinator.start();
  await Promise.resolve();
  assert.equal(attempts, 1);

  cancelledCoordinator.cancel();
  cancelledCoordinator.onRendered();
  callbacks
    .filter(({ cancelled }) => !cancelled)
    .forEach(({ callback }) => callback());

  assert.equal(attempts, 1, "cancelled runs must not perform stale attachment");
  assert.equal(callbacks[0].cancelled, true);
}

{
  let resolveBookReady: (() => void) | null = null;
  let attempts = 0;
  const cancelledBeforeReady = createInitialScrolledBodyCoordinator({
    waitForBookReady: () =>
      new Promise<void>((resolve) => {
        resolveBookReady = resolve;
      }),
    attemptBodyAttachment: () => {
      attempts += 1;
      return { state: "started", completion: Promise.resolve() };
    },
  });

  cancelledBeforeReady.start();
  cancelledBeforeReady.cancel();
  resolveBookReady?.();
  await Promise.resolve();

  assert.equal(attempts, 0, "book readiness from an old run must be ignored");
}

{
  let attempts = 0;
  let fallbackScheduled = false;
  const alreadyComplete = createInitialScrolledBodyCoordinator({
    waitForBookReady: async () => undefined,
    attemptBodyAttachment: () => {
      attempts += 1;
      return "complete";
    },
    schedule: () => {
      fallbackScheduled = true;
      return 1 as ReturnType<typeof setTimeout>;
    },
  });

  alreadyComplete.start();
  await Promise.resolve();
  alreadyComplete.onRendered();

  assert.equal(attempts, 1);
  assert.equal(fallbackScheduled, false);
}

{
  const callbacks: ScheduledCallback[] = [];
  let attempts = 0;
  let rejectDisplay: ((reason?: unknown) => void) | null = null;
  const displayRecoveryCoordinator = createInitialScrolledBodyCoordinator({
    waitForBookReady: async () => undefined,
    attemptBodyAttachment: () => {
      attempts += 1;
      if (attempts > 1) return "complete";
      return {
        state: "started",
        completion: new Promise((_, reject) => {
          rejectDisplay = reject;
        }),
      };
    },
    schedule: (callback, delayMs) => {
      callbacks.push({ callback, delayMs, cancelled: false });
      return callbacks.length as ReturnType<typeof setTimeout>;
    },
    clearScheduled: (handle) => {
      const scheduledCallback = callbacks[Number(handle) - 1];
      if (scheduledCallback) scheduledCallback.cancelled = true;
    },
  });

  displayRecoveryCoordinator.start();
  await Promise.resolve();
  assert.equal(attempts, 1);
  displayRecoveryCoordinator.onRendered();
  displayRecoveryCoordinator.onRendered();
  assert.equal(attempts, 1, "rendered events must not overlap an active display");

  rejectDisplay?.(new Error("display failed"));
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(
    callbacks.length,
    1,
    "a rejected helper-owned display must schedule one bounded recovery"
  );
  assert.equal(callbacks[0].delayMs, 250);
  callbacks[0].callback();
  assert.equal(attempts, 2);
}

{
  let managerDisplayCalls = 0;
  let appendCalls = 0;
  const managerOwnedView = {
    displayed: false,
    display: () => {
      managerDisplayCalls += 1;
    },
  };
  const managerOwnedAttacher = createInitialScrolledBodyViewAttacher({
    findBodyView: () => managerOwnedView,
    appendBodyView: () => {
      appendCalls += 1;
      return null;
    },
    request: undefined,
  });

  assert.equal(managerOwnedAttacher.attempt(), "waiting");
  assert.equal(managerDisplayCalls, 0);
  assert.equal(appendCalls, 0);
}

{
  let appendCalls = 0;
  let displayCalls = 0;
  let rejectFirstDisplay: ((reason?: unknown) => void) | null = null;
  let rejectSecondDisplay: ((reason?: unknown) => void) | null = null;
  let appendedView:
    | {
        displayed: boolean;
        display: () => Promise<void>;
        show: () => void;
      }
    | null = null;
  const helperOwnedAttacher = createInitialScrolledBodyViewAttacher({
    findBodyView: () => appendedView,
    appendBodyView: () => {
      appendCalls += 1;
      appendedView = {
        displayed: false,
        display: () => {
          displayCalls += 1;
          if (displayCalls === 1) {
            return new Promise<void>((_, reject) => {
              rejectFirstDisplay = reject;
            });
          }
          return new Promise<void>((_, reject) => {
            rejectSecondDisplay = reject;
          });
        },
        show: () => undefined,
      };
      return appendedView;
    },
    request: undefined,
  });

  const firstAttempt = helperOwnedAttacher.attempt();
  const repeatedPendingAttempt = helperOwnedAttacher.attempt();
  assert.equal(typeof firstAttempt, "object");
  assert.equal(typeof repeatedPendingAttempt, "object");
  assert.equal(appendCalls, 1);
  assert.equal(displayCalls, 1, "pending helper display must not run twice");

  rejectFirstDisplay?.(new Error("first display failed"));
  await Promise.resolve();
  await Promise.resolve();

  const recoveryAttempt = helperOwnedAttacher.attempt();
  assert.equal(typeof recoveryAttempt, "object");
  assert.equal(appendCalls, 1, "display recovery must reuse the owned view");
  assert.equal(displayCalls, 2, "display recovery is bounded to one retry");

  const repeatedRecoveryAttempt = helperOwnedAttacher.attempt();
  assert.equal(typeof repeatedRecoveryAttempt, "object");
  assert.equal(displayCalls, 2, "pending recovery must not run concurrently");
  rejectSecondDisplay?.(new Error("recovery display failed"));
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(helperOwnedAttacher.attempt(), "failed");
  assert.equal(displayCalls, 2, "a failed recovery must be terminal");
  await Promise.resolve();
}
