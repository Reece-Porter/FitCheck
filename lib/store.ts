"use client";

import { useSyncExternalStore, useCallback } from "react";
import { Item, Fit, CatalogEntry, Review } from "./types";

/* ---------------------------------------------------------------------------
   A tiny localStorage-backed store. Because the app is statically exported,
   every page prerenders on the server (where there is no localStorage), so we
   use useSyncExternalStore with a stable server snapshot and hydrate the real
   values on the client. All reads are cached so getSnapshot returns a stable
   reference until a write happens.
--------------------------------------------------------------------------- */

const PREFIX = "fitted:";
const cache = new Map<string, unknown>();
const listeners = new Set<() => void>();

/** Stable empty defaults so server + client snapshots don't tear. */
const EMPTY_ITEMS: Item[] = [];
const EMPTY_FITS: Fit[] = [];
const EMPTY_CATALOG: CatalogEntry[] = [];

function read<T>(key: string, fallback: T): T {
  if (cache.has(key)) return cache.get(key) as T;
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    const value = raw == null ? fallback : (JSON.parse(raw) as T);
    cache.set(key, value);
    return value;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  cache.set(key, value);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* storage full / unavailable — keep the in-memory copy */
    }
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function useKey<T>(key: string, fallback: T): T {
  return useSyncExternalStore(
    subscribe,
    () => read(key, fallback),
    () => fallback
  );
}

/* ------------------------------- utilities ------------------------------- */
export function uid(): string {
  return "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function recordInCatalog(item: Item): void {
  const catalog = read<CatalogEntry[]>("catalog", EMPTY_CATALOG);
  const next: CatalogEntry[] = [
    { brand: item.brand, category: item.category, price: item.price, name: item.name, at: Date.now() },
    ...catalog
  ].slice(0, 500);
  write("catalog", next);
}

/* -------------------------------- builder -------------------------------- */
export function useBuilder() {
  const items = useKey<Item[]>("builder", EMPTY_ITEMS);

  const add = useCallback((item: Item) => {
    write("builder", [...read<Item[]>("builder", EMPTY_ITEMS), item]);
    recordInCatalog(item);
  }, []);

  const remove = useCallback((id: string) => {
    write("builder", read<Item[]>("builder", EMPTY_ITEMS).filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => write("builder", []), []);

  const replace = useCallback((next: Item[]) => write("builder", next), []);

  return { items, add, remove, clear, replace };
}

/* --------------------------------- fits ---------------------------------- */
export function useFits() {
  const fits = useKey<Fit[]>("fits", EMPTY_FITS);

  const save = useCallback((name: string, items: Item[]): string => {
    const id = uid();
    const fit: Fit = { id, name: name || "Untitled fit", items: clone(items), at: Date.now() };
    write("fits", [fit, ...read<Fit[]>("fits", EMPTY_FITS)]);
    return id;
  }, []);

  const remove = useCallback((id: string) => {
    write("fits", read<Fit[]>("fits", EMPTY_FITS).filter((f) => f.id !== id));
  }, []);

  const setReview = useCallback((id: string, review: Review) => {
    write(
      "fits",
      read<Fit[]>("fits", EMPTY_FITS).map((f) => (f.id === id ? { ...f, review } : f))
    );
  }, []);

  return { fits, save, remove, setReview };
}

/* ------------------------------- wishlist -------------------------------- */
export function useWishlist() {
  const items = useKey<Item[]>("wishlist", EMPTY_ITEMS);

  const add = useCallback((item: Item): boolean => {
    const list = read<Item[]>("wishlist", EMPTY_ITEMS);
    const key = (item.image || "") + "|" + (item.name || "");
    if (list.some((w) => (w.image || "") + "|" + (w.name || "") === key)) return false;
    const copy = { ...clone(item), id: uid(), at: Date.now() };
    write("wishlist", [copy, ...list]);
    recordInCatalog(item);
    return true;
  }, []);

  const remove = useCallback((id: string) => {
    write("wishlist", read<Item[]>("wishlist", EMPTY_ITEMS).filter((i) => i.id !== id));
  }, []);

  return { items, add, remove };
}

/* -------------------------------- catalog -------------------------------- */
export function useCatalog(): CatalogEntry[] {
  return useKey<CatalogEntry[]>("catalog", EMPTY_CATALOG);
}

/* ---------------------------- review handoff ----------------------------- */
/* The Style Check page reviews a fit chosen elsewhere. We stash the target id
   (or "builder" for the live board) so it survives the client-side navigation. */
export function setReviewTarget(target: string): void {
  if (typeof window !== "undefined") window.sessionStorage.setItem(PREFIX + "reviewTarget", target);
}
export function getReviewTarget(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(PREFIX + "reviewTarget");
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}
