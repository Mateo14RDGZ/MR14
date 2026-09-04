"use client";

import { useEffect } from "react";

const WELCOME_KEY_PREFIX = "welcome-animation-shown:";

export function ClearWelcomeSession() {
  useEffect(() => {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(WELCOME_KEY_PREFIX)) sessionStorage.removeItem(key);
    }
  }, []);

  return null;
}
