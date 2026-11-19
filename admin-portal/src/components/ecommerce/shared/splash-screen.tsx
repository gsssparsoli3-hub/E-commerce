"use client";

import { Loader2 } from "lucide-react";

export function SplashScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <img src="/brand/logo.png" alt="" className="h-16 w-16 rounded-2xl object-contain" />
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm font-medium">Loading your store…</span>
      </div>
    </div>
  );
}
