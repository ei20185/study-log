// データベースの読み書き（SQL はこのファイルだけに書く）
//   どの DB を使うかは引数でもらうので、テストではメモリ上の DB を渡せる。
import { DatabaseSync } from "node:sqlite";
import type { LogInput } from "./validation.ts";

export interface StudyLog {
  id: number;
  studiedOn: string;
  subject: string;
  minutes: number;
  memo: string;
  createdAt: string;
}

export interface Stats {
  today: number;                                     // 今日の合計（分）
  last7Days: number;                                 // 今日を含む7日間の合計（分）
  byDay: { date: string; minutes: number }[];        // 7日分。勉強していない日も 0 で入れる
  bySubject: { subject: string; minutes: number }[]; // 7日間の科目ごとの合計（多い順）
}

export function openDb(file: string): DatabaseSync {
  const db = new DatabaseSync(file);
  db.exec(`
    CREATE TABLE IF NOT EXISTS study_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      studied_on TEXT    NOT NULL,                -- 勉強した日 YYYY-MM-DD
      subject    TEXT    NOT NULL CHECK (length(subject) BETWEEN 1 AND 30),
      minutes    INTEGER NOT NULL CHECK (minutes BETWEEN 1 AND 1440),
      memo       TEXT    NOT NULL DEFAULT '',
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- 「この期間の記録」を日付で探すことが多いので、日付に索引を付ける
    CREATE INDEX IF NOT EXISTS idx_study_logs_studied_on ON study_logs(studied_on);
  `);
  return db;
}

// DB の列名（snake_case）→ JavaScript の名前（camelCase）
const SELECT_COLUMNS = `
  id, studied_on AS studiedOn, subject, minutes, memo, created_at AS createdAt
`;

function toLog(row: Record<string, unknown>): StudyLog {
  return {
    id: Number(row.id),
    studiedOn: String(row.studiedOn),
    subject: String(row.subject),
    minutes: Number(row.minutes),
    memo: String(row.memo),
    createdAt: String(row.createdAt),
  };
}

export function createLog(db: DatabaseSync, input: LogInput): StudyLog {
  // ? に値を入れる書き方（プレースホルダー）。文字をそのまま SQL につなげないので SQL インジェクションを防げる
  const row = db
    .prepare(
      `INSERT INTO study_logs (studied_on, subject, minutes, memo)
       VALUES (?, ?, ?, ?)
       RETURNING ${SELECT_COLUMNS}`
    )
    .get(input.studiedOn, input.subject, input.minutes, input.memo);
  return toLog(row as Record<string, unknown>);
}

/** 新しい順に最大 limit 件 */
export function listLogs(db: DatabaseSync, limit = 50): StudyLog[] {
  return db
    .prepare(
      `SELECT ${SELECT_COLUMNS} FROM study_logs
       ORDER BY studied_on DESC, id DESC
       LIMIT ?`
    )
    .all(limit)
    .map((r) => toLog(r as Record<string, unknown>));
}

/** 消せたら true、その id がなければ false */
export function deleteLog(db: DatabaseSync, id: number): boolean {
  const info = db.prepare("DELETE FROM study_logs WHERE id = ?").run(id);
  return Number(info.changes) > 0;
}

/** 入力の候補に出す、これまでに使った科目（よく使う順） */
export function listSubjects(db: DatabaseSync, limit = 20): string[] {
  return db
    .prepare(
      `SELECT subject FROM study_logs
       GROUP BY subject
       ORDER BY COUNT(*) DESC, MAX(id) DESC
       LIMIT ?`
    )
    .all(limit)
    .map((r) => String((r as Record<string, unknown>).subject));
}

/** today を含む7日間の集計。from = today の6日前 */
export function getStats(db: DatabaseSync, today: string, from: string): Stats {
  // 合計は SQL の SUM で出す（記録を全部 JavaScript に持ってきて足すより速く、数字もずれない）
  const dayRows = db
    .prepare(
      `SELECT studied_on AS date, SUM(minutes) AS minutes
       FROM study_logs
       WHERE studied_on BETWEEN ? AND ?
       GROUP BY studied_on`
    )
    .all(from, today) as { date: string; minutes: number }[];

  const subjectRows = db
    .prepare(
      `SELECT subject, SUM(minutes) AS minutes
       FROM study_logs
       WHERE studied_on BETWEEN ? AND ?
       GROUP BY subject
       ORDER BY minutes DESC, subject ASC`
    )
    .all(from, today) as { subject: string; minutes: number }[];

  // 勉強していない日も 0 として並べる（グラフに穴が空かないように）
  const byDate = new Map(dayRows.map((r) => [r.date, Number(r.minutes)]));
  const byDay: Stats["byDay"] = [];
  for (let d = from; d <= today; d = nextDay(d)) {
    byDay.push({ date: d, minutes: byDate.get(d) ?? 0 });
  }

  return {
    today: byDate.get(today) ?? 0,
    last7Days: byDay.reduce((sum, d) => sum + d.minutes, 0),
    byDay,
    bySubject: subjectRows.map((r) => ({ subject: r.subject, minutes: Number(r.minutes) })),
  };
}

function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
