// 入力チェック（DB にも通信にも触らない純粋な関数だけ。テストしやすくするため分けている）

export const SUBJECT_MAX = 30;
export const MEMO_MAX = 500;
export const MINUTES_MAX = 24 * 60;

export interface LogInput {
  studiedOn: string; // "YYYY-MM-DD"
  subject: string;
  minutes: number;
  memo: string;
}

export type ValidationResult =
  | { ok: true; value: LogInput }
  | { ok: false; errors: string[] };

/** "YYYY-MM-DD" の形で、しかも本当にある日付か（2月30日などをはじく） */
export function isValidDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/**
 * 画面から届いた値をチェックし、正しければ整えた値を返す。
 * 画面側でもチェックはしているが、API は直接呼ばれることもあるので、サーバーで必ず確かめる。
 */
export function validateLogInput(body: unknown, today: string): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, errors: ["JSON のオブジェクトで送ってください。"] };
  }
  const b = body as Record<string, unknown>;
  const errors: string[] = [];

  const studiedOn = typeof b.studiedOn === "string" ? b.studiedOn : "";
  if (!isValidDate(studiedOn)) errors.push("日付は YYYY-MM-DD の形で入れてください。");
  else if (studiedOn > today) errors.push("未来の日付は記録できません。");

  const subject = typeof b.subject === "string" ? b.subject.trim() : "";
  if (subject.length < 1 || subject.length > SUBJECT_MAX) {
    errors.push(`科目は1〜${SUBJECT_MAX}文字にしてください。`);
  }

  const minutes = typeof b.minutes === "number" ? b.minutes : Number.NaN;
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > MINUTES_MAX) {
    errors.push(`時間は1〜${MINUTES_MAX}分の整数にしてください。`);
  }

  const memo = b.memo === undefined ? "" : typeof b.memo === "string" ? b.memo.trim() : null;
  if (memo === null || memo.length > MEMO_MAX) {
    errors.push(`メモは${MEMO_MAX}文字以内の文字にしてください。`);
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: { studiedOn, subject, minutes, memo: memo as string } };
}

/** URL の [id] 部分を正の整数にする。だめなら null */
export function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

// ---- 日付（日本時間で数える） ----
const JST_DATE = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" });

/** 日本時間の今日 "YYYY-MM-DD" */
export function todayJst(now: Date = new Date()): string {
  return JST_DATE.format(now);
}

/** "YYYY-MM-DD" の days 日前（マイナスなら後） */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
