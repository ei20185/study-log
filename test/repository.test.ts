// 本物の DB ファイルは使わず、メモリ上の一時的な DB でテストする
import { test } from "node:test";
import assert from "node:assert/strict";
import { createLog, deleteLog, getStats, listLogs, listSubjects, openDb } from "../lib/repository.ts";

function freshDb() {
  return openDb(":memory:");
}

test("追加した記録が一覧に新しい順で出る", () => {
  const db = freshDb();
  createLog(db, { studiedOn: "2026-10-30", subject: "英語", minutes: 30, memo: "" });
  const added = createLog(db, { studiedOn: "2026-11-01", subject: "DB", minutes: 60, memo: "JOIN" });
  assert.equal(added.subject, "DB");
  assert.ok(added.id > 0);

  const logs = listLogs(db);
  assert.deepEqual(logs.map((l) => l.studiedOn), ["2026-11-01", "2026-10-30"]);
});

test("削除：あれば true、なければ false", () => {
  const db = freshDb();
  const log = createLog(db, { studiedOn: "2026-11-01", subject: "DB", minutes: 10, memo: "" });
  assert.equal(deleteLog(db, log.id), true);
  assert.equal(deleteLog(db, log.id), false);
  assert.equal(listLogs(db).length, 0);
});

test("DB の制約でもおかしな値をはじく（入力チェックをすり抜けても守る）", () => {
  const db = freshDb();
  assert.throws(() => createLog(db, { studiedOn: "2026-11-01", subject: "DB", minutes: 0, memo: "" }));
  assert.throws(() => createLog(db, { studiedOn: "2026-11-01", subject: "", minutes: 10, memo: "" }));
});

test("SQL インジェクションのような文字も、ただの文字として保存される", () => {
  const db = freshDb();
  createLog(db, { studiedOn: "2026-11-01", subject: "'); DROP TABLE study_logs; --", minutes: 5, memo: "" });
  assert.equal(listLogs(db)[0].subject, "'); DROP TABLE study_logs; --");
});

test("7日間の集計：範囲外は入らず、勉強していない日は 0", () => {
  const db = freshDb();
  createLog(db, { studiedOn: "2026-11-01", subject: "DB", minutes: 60, memo: "" });
  createLog(db, { studiedOn: "2026-11-01", subject: "英語", minutes: 20, memo: "" });
  createLog(db, { studiedOn: "2026-10-28", subject: "DB", minutes: 30, memo: "" });
  createLog(db, { studiedOn: "2026-10-25", subject: "DB", minutes: 999, memo: "" }); // 7日より前

  const s = getStats(db, "2026-11-01", "2026-10-26");
  assert.equal(s.today, 80);
  assert.equal(s.last7Days, 110);
  assert.equal(s.byDay.length, 7);
  assert.equal(s.byDay.find((d) => d.date === "2026-10-27")?.minutes, 0);
  assert.deepEqual(s.bySubject, [
    { subject: "DB", minutes: 90 },
    { subject: "英語", minutes: 20 },
  ]);
});

test("科目の候補はよく使う順", () => {
  const db = freshDb();
  for (const subject of ["英語", "DB", "DB"]) {
    createLog(db, { studiedOn: "2026-11-01", subject, minutes: 10, memo: "" });
  }
  assert.deepEqual(listSubjects(db), ["DB", "英語"]);
});
