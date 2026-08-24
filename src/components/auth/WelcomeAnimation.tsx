"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Logo } from "@/components/ui/Logo";
import { Plus } from "lucide-react";

const HOLD_MS = 1300;
const EXIT_MS = 220;

export function WelcomeAnimation({ logo, name, dest }: { logo: string; name: string; dest: string }) {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    router.prefetch(dest);
    const exitTimer = setTimeout(() => setExiting(true), HOLD_MS);
    const navTimer = setTimeout(() => router.replace(dest), HOLD_MS + EXIT_MS);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(navTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dest]);

  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-4 transition-opacity duration-200"
      style={{ opacity: exiting ? 0 : 1 }}
    >
      <div className="flex animate-scale-in items-center gap-5">
        <Image
          src={logo}
          alt=""
          width={72}
          height={72}
          unoptimized
          className="h-[72px] w-[72px] shrink-0 rounded-full border border-border object-cover"
        />
        <Plus size={18} className="shrink-0 text-muted-2" />
        <Logo mark size="xl" />
      </div>
      <p className="animate-fade-in text-center text-sm text-muted">{name ? `Hola, ${name}` : "Bienvenido"}</p>
    </div>
  );
}
