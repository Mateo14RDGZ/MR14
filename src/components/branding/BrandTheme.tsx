"use client";

import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import type { brandTokens } from "@/lib/brand-color";

const BrandContext = createContext<CSSProperties | undefined>(undefined);

export function BrandTheme({ theme, children }: { theme: ReturnType<typeof brandTokens>; children: ReactNode }) {
  return <BrandContext.Provider value={theme as CSSProperties}>{children}</BrandContext.Provider>;
}

export function useBrandTheme() { return useContext(BrandContext); }
