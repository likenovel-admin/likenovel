import assert from "node:assert/strict";
import { createInitialScrolledBodyCoordinator } from "./initialScrolledBodyCoordinator.ts";

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
    return managerReady ? "started" : "waiting";
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
      return "started";
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
