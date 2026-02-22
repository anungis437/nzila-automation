"use client";

import { useEffect, useRef } from "react";

export function ExpiredCreditsChecker() {
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) {
      return;
    }

    hasRunRef.current = true;
    const controller = new AbortController();

    const checkCredits = async () => {
      try {
        await fetch("/api/billing/credits/check-expired", {
          method: "POST",
          signal: controller.signal,
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
}
      }
    };

    checkCredits();

    return () => {
      controller.abort();
    };
  }, []);

  return null;
}
