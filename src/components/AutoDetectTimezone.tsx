"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/hooks/useApi";

export function AutoDetectTimezone() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) return;

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      apiFetch("/settings/timezone", {
        method: "PUT",
        body: JSON.stringify({ timezone: tz }),
      }).catch(() => {}); // Silent fail
    }
  }, [session]);

  return null;
}
