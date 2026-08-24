"use client";

import { Command } from "cmdk";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, FolderKanban, Globe, GitBranch, FileText } from "lucide-react";

interface SearchResult {
  type: "client" | "project" | "domain" | "repository" | "document";
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
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onOpenEvent() {
      setOpen(true);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mr14:open-search", onOpenEvent);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mr14:open-search", onOpenEvent);
    };
  }, []);

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-24 px-4 animate-fade-in"
      onClick={() => setOpen(false)}
    >
      <Command
        shouldFilter={false}
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search size={16} className="text-muted-2" />
          <Command.Input
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="Buscar clientes, proyectos, dominios, repos, documentos..."
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-2"
          />
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-2 sm:block">
            ESC
          </kbd>
        </div>
        <Command.List className="max-h-80 overflow-y-auto p-2">
          {loading && <div className="px-3 py-6 text-center text-xs text-muted-2">Buscando…</div>}
          {!loading && query && results.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-muted-2">Sin resultados.</div>
          )}
          {!loading &&
            results.map((r) => {
              const Icon = ICONS[r.type];
              return (
                <Command.Item
                  key={`${r.type}-${r.id}`}
                  onSelect={() => {
                    setOpen(false);
                    setQuery("");
                    router.push(r.href);
                  }}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm data-[selected=true]:bg-surface-2"
                >
                  <Icon size={16} className="text-muted" />
                  <div className="min-w-0">
                    <p className="truncate text-foreground">{r.title}</p>
                    {r.subtitle && <p className="truncate text-xs text-muted-2">{r.subtitle}</p>}
                  </div>
                </Command.Item>
              );
            })}
        </Command.List>
      </Command>
    </div>
  );
}

export function CommandPaletteTrigger() {
  return (
    <button
      onClick={() => document.dispatchEvent(new Event("mr14:open-search"))}
      className="flex h-9 w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-muted-2 transition-colors hover:border-muted-2"
    >
      <Search size={15} />
      Buscar…
      <kbd className="ml-auto rounded border border-border px-1.5 py-0.5 text-[10px]">⌘K</kbd>
    </button>
  );
}
