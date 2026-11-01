import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, isValidDate, parseId, todayJst, validateLogInput } from "../lib/validation.ts";

const TODAY = "2026-11-01";
const good = { studiedOn: "2026-11-01", subject: "データベース", minutes: 45, memo: "正規化" };

test("正しい入力は通り、前後の空白は取られる", () => {
  const r = validateLogInput({ ...good, subject: "  データベース  " }, TODAY);
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.value.subject, "データベース");
});

test("メモは省略できる", () => {
  const noMemo = { studiedOn: good.studiedOn, subject: good.subject, minutes: good.minutes };
  const r = validateLogInput(noMemo, TODAY);
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.value.memo, "");
});

test("おかしな値はまとめてエラーにする", () => {
  const r = validateLogInput({ studiedOn: "2026-02-30", subject: "", minutes: 0, memo: 1 }, TODAY);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.errors.length, 4);
});

test("未来の日付・小数の分・長すぎる科目ははじく", () => {
  assert.equal(validateLogInput({ ...good, studiedOn: "2026-11-02" }, TODAY).ok, false);
  assert.equal(validateLogInput({ ...good, minutes: 1.5 }, TODAY).ok, false);
  assert.equal(validateLogInput({ ...good, minutes: "30" }, TODAY).ok, false); // 文字の "30" は受け付けない
  assert.equal(validateLogInput({ ...good, subject: "あ".repeat(31) }, TODAY).ok, false);
});

test("オブジェクトでないものははじく", () => {
  assert.equal(validateLogInput(null, TODAY).ok, false);
  assert.equal(validateLogInput("abc", TODAY).ok, false);
});

test("日付のチェック", () => {
  assert.equal(isValidDate("2028-02-29"), true); // うるう年
  assert.equal(isValidDate("2026-02-29"), false);
  assert.equal(isValidDate("2026/11/01"), false);
});

test("id の変換", () => {
  assert.equal(parseId("12"), 12);
  assert.equal(parseId("0"), null);
  assert.equal(parseId("-1"), null);
  assert.equal(parseId("1.5"), null);
  assert.equal(parseId("abc"), null);
});

test("日本時間で今日を数える（UTC だと前日の時間帯）", () => {
  // UTC 10/31 15:30 = 日本時間 11/1 0:30
  assert.equal(todayJst(new Date("2026-10-31T15:30:00Z")), "2026-11-01");
  assert.equal(addDays("2026-11-01", -6), "2026-10-26");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});
