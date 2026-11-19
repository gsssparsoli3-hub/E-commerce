"use client";

import { create } from "zustand";

/**
 * Hash-based router so the whole experience lives on "/" while still
 * supporting deep links (#/shop, #/product/slug, #/admin/products...).
 */

function readPath(): string {
  if (typeof window === "undefined") return "/";
  const hash = window.location.hash.replace(/^#/, "");
  return hash === "" ? "/" : hash;
}

type RouterState = {
  path: string;
  navigate: (to: string, replace?: boolean) => void;
  back: () => void;
};

export const useRouterStore = create<RouterState>((set) => ({
  path: "/",
  navigate: (to, replace) => {
    if (typeof window === "undefined") return;
    if (to.startsWith("http")) {
      window.open(to, "_blank");
      return;
    }
    if (replace) {
      window.history.replaceState(null, "", `#${to}`);
      set({ path: to });
    } else if (`#${to}` !== window.location.hash) {
      window.location.hash = to;
    }
  },
  back: () => window.history.back(),
}));

if (typeof window !== "undefined") {
  // Initialise on load (client components hydrate after this event in most cases)
  useRouterStore.setState({ path: readPath() });
  window.addEventListener("hashchange", () => {
    useRouterStore.setState({ path: readPath() });
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  });
}

export function useRoute() {
  const path = useRouterStore((s) => s.path);
  const [pathname, search = ""] = path.split("?");
  const segments = pathname.split("/").filter(Boolean);
  const query = new URLSearchParams(search);
  return { pathname, segments, query, search };
}
