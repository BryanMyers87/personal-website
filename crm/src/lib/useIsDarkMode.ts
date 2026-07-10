"use client";

import { useSyncExternalStore } from "react";

const query = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;

function subscribe(callback: () => void) {
  query?.addEventListener("change", callback);
  return () => query?.removeEventListener("change", callback);
}

function getSnapshot() {
  return query?.matches ?? false;
}

function getServerSnapshot() {
  return false;
}

export function useIsDarkMode(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
