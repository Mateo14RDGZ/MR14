"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos de inactividad
const EVENTS = ["mousemove", "keydown", "click", "touchstart", "scroll"];

export function InactivityGuard() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function lock() {
      await supabase.auth.signOut();
      window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname);
    }

    function reset() {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(lock, TIMEOUT_MS);
    }

    EVENTS.forEach((evt) => window.addEventListener(evt, reset, { passive: true }));
    reset();

    return () => {
      EVENTS.forEach((evt) => window.removeEventListener(evt, reset));
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return null;
}
