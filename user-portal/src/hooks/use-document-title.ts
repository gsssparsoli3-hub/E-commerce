"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/stores/settings";

/**
 * Keep document.title in sync with the current view (SPA hash router).
 * Uses the admin-configured SEO title as the base; restores it when the
 * view unmounts without a replacement.
 */
export function useDocumentTitle(title?: string | null) {
  const base = useSettingsStore(
    (s) => s.settings?.seoTitle?.trim() || `${s.settings?.siteName ?? "Store"} — Online Shopping`
  );

  useEffect(() => {
    document.title = title ? `${title} — ${base.split(" — ")[0]}` : base;
    return () => {
      document.title = base;
    };
  }, [title, base]);
}
