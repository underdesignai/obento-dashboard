// The app is served under basePath "/admin" (see next.config.ts), but many
// client components call fetch("/api/...") with an absolute path. Next.js
// only auto-prefixes framework-managed URLs (Link, Image, _next assets) with
// basePath, not manual fetch() calls, so those requests would otherwise miss
// the app entirely. This patches window.fetch once, globally, instead of
// editing every call site.
const BASE_PATH = "/admin";

if (typeof window !== "undefined") {
  const w = window as typeof window & { __basePathFetchPatched?: boolean };
  if (!w.__basePathFetchPatched) {
    w.__basePathFetchPatched = true;
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      if (
        typeof input === "string" &&
        input.startsWith("/") &&
        !input.startsWith(BASE_PATH + "/") &&
        input !== BASE_PATH
      ) {
        input = BASE_PATH + input;
      }
      return originalFetch(input, init);
    };
  }
}
