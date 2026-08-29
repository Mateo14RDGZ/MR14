"use client";

import { Command } from "cmdk";
import { useEffect, useState, useCallback, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, FolderKanban, Globe, GitBranch, FileText, LifeBuoy, UserPlus, Wallet, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  type: "client" | "project" | "domain" | "repository" | "document" | "ticket";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

const ICONS = {
  client: Users,
  project: FolderKanban,
  domain: Globe,
  repository: GitBranch,
  document: FileText,
  ticket: LifeBuoy,
};

const GROUP_LABELS: Record<SearchResult["type"], string> = {
  client: "Clientes",
  project: "Proyectos",
  domain: "Dominios",
  repository: "Repositorios",
  document: "Documentos",
  ticket: "Tickets",
};

const GROUP_ORDER: SearchResult["type"][] = ["client", "project", "ticket", "domain", "document", "repository"];

const QUICK_ACTIONS = [
  { icon: UserPlus, label: "Nuevo cliente", href: "/clients/new" },
  { icon: FolderKanban, label: "Elegir cliente para crear proyecto", href: "/clients" },
  { icon: Wallet, label: "Elegir cliente para registrar pago", href: "/clients" },
  { icon: LifeBuoy, label: "Nuevo ticket", href: "/support?new=ticket" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
    requestAnimationFrame(() => previousFocusRef.current?.focus());
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) closePalette();
        else {
          previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          setOpen(true);
        }
      }
      if (e.key === "Escape" && open) closePalette();
    }
    function onOpenEvent(event: Event) {
      const trigger = (event as CustomEvent<{ trigger?: HTMLElement }>).detail?.trigger;
      previousFocusRef.current = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
      setOpen(true);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mr14:open-search", onOpenEvent);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mr14:open-search", onOpenEvent);
    };
  }, [closePalette, open]);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 250);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  if (!open) return null;

  const grouped = GROUP_ORDER.map((type) => ({
    type,
    items: results.filter((r) => r.type === type),
  })).filter((g) => g.items.length > 0);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  function trapFocus(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      ) ?? []
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-[2px] pt-24 px-4 animate-fade-in"
      onClick={closePalette}
    >
      <Command
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Búsqueda global"
        shouldFilter={false}
        className="w-full max-w-lg overflow-hidden rounded-lg border border-border bg-surface shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={trapFocus}
      >
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search size={16} className="text-muted-2" />
          <Command.Input
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="Buscar clientes, proyectos, tickets, dominios, documentos..."
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-2"
          />
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-2 sm:block">
            ESC
          </kbd>
        </div>
        <Command.List className="max-h-80 overflow-y-auto p-2">
          {!query && (
            <Command.Group
              heading="Acciones"
              className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-2"
            >
              {QUICK_ACTIONS.map((a) => (
                <Command.Item
                  key={a.label}
                  onSelect={() => go(a.href)}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm data-[selected=true]:bg-surface-2"
                >
                  <Plus size={14} className="text-muted-2" />
                  <a.icon size={16} className="text-muted" />
                  <span className="text-foreground">{a.label}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {loading && <div className="px-3 py-6 text-center text-xs text-muted-2">Buscando…</div>}
          {!loading && query && results.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-muted-2">Sin resultados.</div>
          )}

          {!loading &&
            grouped.map((g) => {
              const Icon = ICONS[g.type];
              return (
                <Command.Group
                  key={g.type}
                  heading={GROUP_LABELS[g.type]}
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-2"
                >
                  {g.items.map((r) => (
                    <Command.Item
                      key={`${r.type}-${r.id}`}
                      onSelect={() => go(r.href)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm data-[selected=true]:bg-surface-2"
                    >
                      <Icon size={16} className="text-muted" />
                      <div className="min-w-0">
                        <p className="truncate text-foreground">{r.title}</p>
                        {r.subtitle && <p className="truncate text-xs text-muted-2">{r.subtitle}</p>}
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              );
            })}
        </Command.List>
      </Command>
    </div>
  );
}

export function CommandPaletteTrigger({ className }: { className?: string }) {
  return (
    <button
      type="button"
      aria-label="Abrir búsqueda global"
      onClick={(event) =>
        document.dispatchEvent(new CustomEvent("mr14:open-search", { detail: { trigger: event.currentTarget } }))
      }
      className={cn(
        "flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 text-sm text-muted-2 transition-colors active:scale-[0.99] hover:border-border-strong",
        className
      )}
    >
      <Search size={15} className="shrink-0" />
      <span className="truncate">Buscar…</span>
      {/* El shortcut solo tiene sentido con teclado físico: se oculta en mobile/touch. */}
      <kbd className="ml-auto hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] lg:block">⌘K</kbd>
    </button>
  );
}
