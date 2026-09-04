import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Única representación visual de la marca de un cliente.
 * El archivo puede tener cualquier relación de aspecto, pero en la interfaz
 * siempre se presenta como un avatar circular, centrado y sin deformación.
 */
export function ClientLogo({
  src,
  alt = "",
  size,
  className,
  priority = false,
}: {
  src: string;
  alt?: string;
  size: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      unoptimized
      priority={priority}
      className={cn("aspect-square shrink-0 rounded-full object-cover", className)}
    />
  );
}
