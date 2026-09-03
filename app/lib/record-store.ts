import { loadRecords, saveRecords, type StudyRecord } from "@/app/lib/records";

const EMPTY: readonly StudyRecord[] = [];

let cache: readonly StudyRecord[] = EMPTY;
let isInitialized = false;
const listeners = new Set<() => void>();

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): readonly StudyRecord[] {
  if (!isInitialized) {
    cache = loadRecords();
    isInitialized = true;
  }
  return cache;
}

/** サーバー側では localStorage を読めないので、常に空を返す */
export function getServerSnapshot(): readonly StudyRecord[] {
  return EMPTY;
}

export function updateRecords(
  updater: (current: readonly StudyRecord[]) => readonly StudyRecord[],
): void {
  const next = updater(getSnapshot());
  cache = next;
  saveRecords(next);
  listeners.forEach((listener) => listener());
}
