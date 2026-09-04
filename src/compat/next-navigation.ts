/**
 * Navigation shims so ported pages keep their original call sites.
 */
import {
  useRouter as useTanstackRouter,
  useLocation,
  useParams as useTanstackParams,
} from "@tanstack/react-router";
import { useMemo } from "react";

type PushOptions = { scroll?: boolean };

export function useRouter() {
  const router = useTanstackRouter();
  return useMemo(
    () => ({
      push: (href: string, _opts?: PushOptions) => {
        if (/^https?:\/\//i.test(href)) {
          window.location.href = href;
          return;
        }
        void router.navigate({ href });
      },
      replace: (href: string, _opts?: PushOptions) => {
        if (/^https?:\/\//i.test(href)) {
          window.location.replace(href);
          return;
        }
        void router.navigate({ href, replace: true });
      },
      back: () => router.history.back(),
      forward: () => router.history.forward(),
      refresh: () => void router.invalidate(),
      prefetch: () => {},
    }),
    [router],
  );
}

export function useSearchParams(): URLSearchParams {
  const location = useLocation();
  return useMemo(() => new URLSearchParams(location.searchStr ?? ""), [location.searchStr]);
}

export function usePathname(): string {
  const location = useLocation();
  return location.pathname;
}

export function useParams<T = Record<string, string>>(): T {
  const params = useTanstackParams({ strict: false });
  return (params ?? {}) as T;
}

export function redirect(href: string): never {
  if (typeof window !== "undefined") window.location.href = href;
  throw new Error(`redirect: ${href}`);
}

export function notFound(): never {
  throw new Error("Not found");
}
