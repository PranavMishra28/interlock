"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), 2_000);
    return () => clearInterval(timer);
  }, [router]);
  return null;
}
