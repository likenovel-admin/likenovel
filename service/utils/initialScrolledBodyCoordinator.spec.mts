import assert from "node:assert/strict";
import {
  createInitialScrolledBodyCoordinator,
  createInitialScrolledBodyViewAttacher,
  createScrolledResizeLocationRestorer,
  getScrolledResizeCfi,
  shouldDeferInitialScrolledLastPageHost,
} from "./initialScrolledBodyCoordinator.ts";

type ScheduledCallback = {
  callback: () => void;
  delayMs: number;
  cancelled: boolean;
};

const scheduled: ScheduledCallback[] = [];
let managerReady = false;
let attemptCount = 0;
const flushAsyncWork = () =>
  new Promise<void>((resolve) => globalThis.setImmediate(resolve));

assert.equal(
  getScrolledResizeCfi(undefined),
  null,
  "an app-owned resize must not clear initial views before epub.js reports a location"
);
assert.equal(
  getScrolledResizeCfi({ start: { cfi: "epubcfi(/6/2!/4/1:0)" } }),
  "epubcfi(/6/2!/4/1:0)",
  "the reported CFI must be forwarded so epub.js can redisplay after resize"
);

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
  const coverSection = { index: 0, href: "EPUB/cover.xhtml" };
  const bodySection = { index: 1, href: "EPUB/content.xhtml" };
  const spine = {
    get: (index: number) => [coverSection, bodySection][index],
  };

  assert.equal(
    shouldDeferInitialScrolledLastPageHost(spine, [
      { section: coverSection },
    ]),
    true,
    "a full-height last-page host must not block continuous fill while only the cover view exists"
  );
  assert.equal(
    shouldDeferInitialScrolledLastPageHost(spine, [
      { section: coverSection },
      { section: { index: 1, href: "EPUB/content.xhtml" } },
    ]),
    false,
    "the host may be attached as soon as the initial body view exists"
  );
  assert.equal(
    shouldDeferInitialScrolledLastPageHost(
      {
        get: (index: number) =>
          [coverSection, bodySection, { index: 2, href: "EPUB/chapter-2.xhtml" }][
            index
          ],
      },
      [{ section: { index: 2, href: "EPUB/chapter-2.xhtml" } }]
    ),
    false,
    "a later body section must keep the last-page host available after the initial body view is trimmed"
  );
  assert.equal(
    shouldDeferInitialScrolledLastPageHost(
      { get: () => ({ index: 0, href: "EPUB/content.xhtml" }) },
      []
    ),
    false,
    "body-first EPUBs do not need the cover-fill guard"
  );
  assert.equal(
    shouldDeferInitialScrolledLastPageHost(
      { get: (index: number) => (index === 0 ? coverSection : undefined) },
      [{ section: coverSection }]
    ),
    false,
    "a cover-only EPUB must not be permanently blocked by a missing body section"
  );
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

{
  const queuedTasks: Array<() => Promise<unknown> | unknown> = [];
  let queueRunning = false;
  const runNextTask = () => {
    if (queueRunning || queuedTasks.length === 0) return;
    queueRunning = true;
    const task = queuedTasks.shift();
    void Promise.resolve(task?.()).finally(() => {
      queueRunning = false;
      runNextTask();
    });
  };
  const enqueueViewTask = <T>(task: () => Promise<T> | T) =>
    new Promise<T>((resolve, reject) => {
      queuedTasks.push(() => Promise.resolve(task()).then(resolve, reject));
      runNextTask();
    });

  let displayCalls = 0;
  let resolveDisplay: (() => void) | null = null;
  let appendedView:
    | {
        displayed: boolean;
        display: () => Promise<void>;
        show: () => void;
      }
    | null = null;
  const serializedAttacher = createInitialScrolledBodyViewAttacher({
    findBodyView: () => appendedView,
    appendBodyView: () => {
      appendedView = {
        displayed: false,
        display: () => {
          displayCalls += 1;
          return new Promise<void>((resolve) => {
            resolveDisplay = () => {
              if (appendedView) appendedView.displayed = true;
              resolve();
            };
          });
        },
        show: () => undefined,
      };
      return appendedView;
    },
    request: undefined,
    enqueueViewTask,
  });

  serializedAttacher.attempt();
  await Promise.resolve();
  assert.equal(displayCalls, 1);

  void enqueueViewTask(async () => {
    if (appendedView && !appendedView.displayed) {
      await appendedView.display();
    }
  });
  await Promise.resolve();
  assert.equal(
    displayCalls,
    1,
    "manager work must not enter while the helper-owned display is pending"
  );

  resolveDisplay?.();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(displayCalls, 1, "manager update must observe the displayed view");
}

{
  let queuedTask: (() => Promise<unknown> | unknown) | null = null;
  let resolveQueuedTask: ((value: unknown) => void) | null = null;
  let managerDisplayCalls = 0;
  let appendCalls = 0;
  let managerView:
    | {
        displayed: boolean;
        display: () => Promise<void>;
      }
    | null = null;
  const recheckingAttacher = createInitialScrolledBodyViewAttacher({
    findBodyView: () => managerView,
    appendBodyView: () => {
      appendCalls += 1;
      return null;
    },
    request: undefined,
    enqueueViewTask: (task) => {
      queuedTask = task;
      return new Promise((resolve) => {
        resolveQueuedTask = resolve;
      });
    },
  });

  recheckingAttacher.attempt();
  managerView = {
    displayed: false,
    display: async () => {
      managerDisplayCalls += 1;
    },
  };
  resolveQueuedTask?.(await queuedTask?.());
  await Promise.resolve();

  assert.equal(appendCalls, 0, "queued attachment must recheck before append");
  assert.equal(
    managerDisplayCalls,
    0,
    "queued attachment must not display a manager-created view"
  );
}

{
  const callbacks: ScheduledCallback[] = [];
  let attempts = 0;
  const waitingCompletionCoordinator = createInitialScrolledBodyCoordinator({
    waitForBookReady: async () => undefined,
    attemptBodyAttachment: () => {
      attempts += 1;
      if (attempts === 1) {
        return { state: "started", completion: Promise.resolve("waiting") };
      }
      return "waiting";
    },
    schedule: (callback, delayMs) => {
      callbacks.push({ callback, delayMs, cancelled: false });
      return callbacks.length as ReturnType<typeof setTimeout>;
    },
  });

  waitingCompletionCoordinator.start();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(attempts, 2);
  assert.deepEqual(
    callbacks.map(({ delayMs }) => delayMs),
    [250],
    "a queued manager-owned view must fall back to the existing bounded retry"
  );
}

{
  const frames: Array<{ callback: () => void; cancelled: boolean }> = [];
  const barrierResolvers: Array<() => void> = [];
  const layoutResolvers: Array<() => void> = [];
  const restoredAnchors: unknown[] = [];
  let resolveRestore: (() => void) | null = null;
  let idleCalls = 0;
  const restorer = createScrolledResizeLocationRestorer({
    enqueueAfterRenditionWork: () =>
      new Promise<void>((resolve) => barrierResolvers.push(resolve)),
    waitForStableLayout: () =>
      new Promise<void>((resolve) => layoutResolvers.push(resolve)),
    restoreAnchor: (anchor) => {
      restoredAnchors.push(anchor);
      return new Promise<void>((resolve) => {
        resolveRestore = resolve;
      });
    },
    scheduleFrame: (callback) => {
      frames.push({ callback, cancelled: false });
      return frames.length;
    },
    cancelFrame: (handle) => {
      const frame = frames[handle - 1];
      if (frame) frame.cancelled = true;
    },
    onIdle: () => {
      idleCalls += 1;
    },
  });

  assert.equal(
    restorer.onResized({ kind: "cfi", cfi: "epubcfi(/6/4!/4/10:0)" }),
    true
  );
  assert.equal(restorer.isBusy(), true);
  await Promise.resolve();
  assert.equal(barrierResolvers.length, 1);

  restorer.onResized({ kind: "cfi", cfi: "epubcfi(/6/4!/4/20:0)" });
  await Promise.resolve();
  assert.equal(barrierResolvers.length, 2);

  barrierResolvers[0]?.();
  await flushAsyncWork();
  assert.equal(
    layoutResolvers.length,
    0,
    "an older queue barrier must not start font settlement"
  );

  barrierResolvers[1]?.();
  await flushAsyncWork();
  assert.equal(layoutResolvers.length, 1);
  assert.equal(frames.length, 0, "font settlement must precede the restore");
  layoutResolvers[0]?.();
  await flushAsyncWork();
  assert.equal(frames.length, 1);
  frames[0].callback();
  await Promise.resolve();
  assert.deepEqual(
    restoredAnchors,
    [{ kind: "cfi", cfi: "epubcfi(/6/4!/4/10:0)" }],
    "overlapping resizes must retain the first semantic anchor"
  );
  assert.equal(
    restorer.isBusy(),
    true,
    "the loading gate must remain busy until corrective display settles"
  );
  assert.equal(
    barrierResolvers.length,
    2,
    "corrective display completion must not start another restore cycle"
  );

  resolveRestore?.();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(restorer.isBusy(), false);
  assert.equal(idleCalls, 1);
}

{
  const frames: Array<{ callback: () => void; cancelled: boolean }> = [];
  const barrierResolvers: Array<() => void> = [];
  const restoreResolvers: Array<() => void> = [];
  const restoredAnchors: unknown[] = [];
  const restorer = createScrolledResizeLocationRestorer({
    enqueueAfterRenditionWork: () =>
      new Promise<void>((resolve) => barrierResolvers.push(resolve)),
    waitForStableLayout: async () => undefined,
    restoreAnchor: (anchor) => {
      restoredAnchors.push(anchor);
      return new Promise<void>((resolve) => restoreResolvers.push(resolve));
    },
    scheduleFrame: (callback) => {
      frames.push({ callback, cancelled: false });
      return frames.length;
    },
    cancelFrame: (handle) => {
      const frame = frames[handle - 1];
      if (frame) frame.cancelled = true;
    },
  });

  restorer.onResized({ kind: "cfi", cfi: "epubcfi(/6/4!/4/30:0)" });
  await Promise.resolve();
  barrierResolvers[0]?.();
  await flushAsyncWork();
  frames[0].callback();
  await Promise.resolve();
  assert.equal(restoredAnchors.length, 1);

  restorer.onResized({ kind: "cfi", cfi: "epubcfi(/6/4!/4/40:0)" });
  await Promise.resolve();
  assert.equal(
    frames.length,
    1,
    "a newer resize must wait behind its own rendition queue barrier"
  );
  assert.equal(barrierResolvers.length, 2);

  restoreResolvers[0]?.();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(restorer.isBusy(), true);

  barrierResolvers[1]?.();
  await flushAsyncWork();
  assert.equal(frames.length, 2);
  frames[1].callback();
  await Promise.resolve();
  assert.deepEqual(restoredAnchors[1], {
    kind: "cfi",
    cfi: "epubcfi(/6/4!/4/30:0)",
  });
  restoreResolvers[1]?.();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(restorer.isBusy(), false);
}

{
  const frames: Array<{ callback: () => void; cancelled: boolean }> = [];
  let resolveBarrier: (() => void) | null = null;
  let resolveLayout: (() => void) | null = null;
  let restoreCalls = 0;
  let idleCalls = 0;
  const restorer = createScrolledResizeLocationRestorer({
    enqueueAfterRenditionWork: () =>
      new Promise<void>((resolve) => {
        resolveBarrier = resolve;
      }),
    waitForStableLayout: () =>
      new Promise<void>((resolve) => {
        resolveLayout = resolve;
      }),
    restoreAnchor: () => {
      restoreCalls += 1;
    },
    scheduleFrame: (callback) => {
      frames.push({ callback, cancelled: false });
      return frames.length;
    },
    cancelFrame: (handle) => {
      const frame = frames[handle - 1];
      if (frame) frame.cancelled = true;
    },
    onIdle: () => {
      idleCalls += 1;
    },
  });

  restorer.onResized({ kind: "last-page", viewportTop: -120 });
  await Promise.resolve();
  resolveBarrier?.();
  await flushAsyncWork();
  restorer.cancel();
  resolveLayout?.();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(frames.length, 0);
  assert.equal(restoreCalls, 0);
  assert.equal(idleCalls, 0, "cancellation must not reveal stale viewer state");
  assert.equal(restorer.isBusy(), false);
}

{
  const frames: Array<{ callback: () => void; cancelled: boolean }> = [];
  const restoredAnchors: unknown[] = [];
  const restorer = createScrolledResizeLocationRestorer({
    enqueueAfterRenditionWork: async () => undefined,
    waitForStableLayout: async () => undefined,
    restoreAnchor: (anchor) => {
      restoredAnchors.push(anchor);
    },
    scheduleFrame: (callback) => {
      frames.push({ callback, cancelled: false });
      return frames.length;
    },
    cancelFrame: (handle) => {
      const frame = frames[handle - 1];
      if (frame) frame.cancelled = true;
    },
  });

  assert.equal(restorer.onResized(null), false);
  assert.equal(restorer.onResized({ kind: "cfi", cfi: "" }), false);
  assert.equal(restorer.isBusy(), false);

  restorer.onResized({ kind: "last-page", viewportTop: 180 });
  await flushAsyncWork();
  assert.equal(frames.length, 1);
  restorer.cancel();
  assert.equal(frames[0].cancelled, true);
  frames[0].callback();
  await Promise.resolve();
  assert.deepEqual(restoredAnchors, []);
}
