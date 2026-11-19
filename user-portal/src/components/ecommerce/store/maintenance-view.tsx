"use client";

import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export function MaintenanceView() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <ShieldAlert className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight">We&apos;ll be right back!</h1>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        Our store is undergoing scheduled maintenance. We&apos;re working hard to make your
        shopping experience even better. Please check back shortly.
      </p>
      <Button variant="outline" onClick={() => window.location.reload()}>
        Retry
      </Button>
    </div>
  );
}
