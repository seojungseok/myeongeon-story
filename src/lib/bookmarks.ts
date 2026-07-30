"use client";

/**
 * localStorage-based bookmarks. No DB, no server. Stores an array of story ids.
 * A small pub/sub keeps multiple components (button + list) in sync.
 */
const KEY = "myeongeon:bookmarks";
const listeners = new Set<() => void>();

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* storage full / disabled — ignore */
  }
  listeners.forEach((fn) => fn());
}

export function getBookmarks(): string[] {
  return read();
}

export function isBookmarked(id: string): boolean {
  return read().includes(id);
}

export function toggleBookmark(id: string): boolean {
  const ids = read();
  const i = ids.indexOf(id);
  if (i === -1) {
    ids.push(id);
    write(ids);
    return true;
  }
  ids.splice(i, 1);
  write(ids);
  return false;
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  // Sync across browser tabs.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) fn();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}
