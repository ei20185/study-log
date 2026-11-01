// アプリ全体で1つだけ DB を開く
//   開発中はファイルを保存するたびにコードが読み直されるので、
//   globalThis に置いて「すでに開いていれば使い回す」ようにしている（開きっぱなしの接続が増えないように）。
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { openDb } from "./repository.ts";

const DB_FILE = process.env.STUDY_LOG_DB ?? path.join(process.cwd(), "data", "study-log.db");

const g = globalThis as typeof globalThis & { __studyLogDb?: DatabaseSync };

export function getDb(): DatabaseSync {
  if (!g.__studyLogDb) {
    mkdirSync(path.dirname(DB_FILE), { recursive: true });
    g.__studyLogDb = openDb(DB_FILE);
  }
  return g.__studyLogDb;
}
