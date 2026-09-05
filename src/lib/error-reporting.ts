// Client-side error reporting hook for the React error boundary in __root.tsx.
// Currently just logs to the console. If you want hosted error tracking later,
// swap the body of this function for e.g. Sentry.captureException(error, { extra: context }).
export function reportAppError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  console.error("[app error]", error, {
    route: window.location.pathname,
    ...context,
  });
}
