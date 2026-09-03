export interface StudyRecord {
  id: string;
  subject: string;
  minutes: number;
  createdAt: string;
}

const STORAGE_KEY = "study-log:records";

function isStudyRecord(value: unknown): value is StudyRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.subject === "string" &&
    typeof record.minutes === "number" &&
    typeof record.createdAt === "string"
  );
}

export function loadRecords(): StudyRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isStudyRecord);
  } catch {
    // 保存データが壊れていても、アプリは空の状態で動かす
    return [];
  }
}

export function saveRecords(records: readonly StudyRecord[]): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // 保存領域がいっぱいでも画面は壊さない
  }
}

export function createRecord(subject: string, minutes: number): StudyRecord {
  return {
    id: crypto.randomUUID(),
    subject,
    minutes,
    createdAt: new Date().toISOString(),
  };
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
  });
}
