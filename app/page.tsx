"use client";

// 画面は「API を呼んで、返ってきたものを表示する」だけ。計算や保存はサーバー（app/api）でする。
import { useCallback, useEffect, useState } from "react";

interface StudyLog {
  id: number;
  studiedOn: string;
  subject: string;
  minutes: number;
  memo: string;
}

interface Stats {
  today: number;
  last7Days: number;
  byDay: { date: string; minutes: number }[];
  bySubject: { subject: string; minutes: number }[];
}

interface LoadedData {
  logs: StudyLog[];
  stats: Stats;
  subjects: string[];
}

/** 一覧と集計を API から取ってくる（2つを同時に呼ぶ） */
async function fetchAll(): Promise<LoadedData> {
  const [logsRes, statsRes] = await Promise.all([fetch("/api/logs"), fetch("/api/stats")]);
  if (!logsRes.ok || !statsRes.ok) throw new Error("読み込み失敗");
  const { logs } = await logsRes.json();
  const { stats, subjects } = await statsRes.json();
  return { logs, stats, subjects };
}

const WEEKDAYS =["日", "月", "火", "水", "木", "金", "土"];

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}分`;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}

function dayLabel(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}(${WEEKDAYS[d.getUTCDay()]})`;
}

function todayLocal(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
}

export default function Home() {
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loadError, setLoadError] = useState("");

  const [studiedOn, setStudiedOn] = useState(todayLocal);
  const [subject, setSubject] = useState("");
  const [minutes, setMinutes] = useState("30");
  const [memo, setMemo] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // 受け取ったデータを画面に反映する
  const apply = useCallback((d: LoadedData) => {
    setLogs(d.logs);
    setStats(d.stats);
    setSubjects(d.subjects);
    setLoadError("");
  }, []);
  const fail = useCallback(() => {
    setLoadError("データを読み込めませんでした。サーバーが動いているか確認してください。");
  }, []);
  const reload = useCallback(() => fetchAll().then(apply, fail), [apply, fail]);

  // 最初に1回読み込む
  useEffect(() => {
    fetchAll().then(apply, fail);
  }, [apply, fail]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors([]);
    try {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studiedOn, subject, minutes: Number(minutes), memo }),
      });
      if (!res.ok) {
        setErrors((await res.json()).errors ?? ["保存できませんでした。"]);
        return;
      }
      setMemo("");
      await reload();
    } catch {
      setErrors(["保存できませんでした。"]);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(log: StudyLog) {
    if (!confirm(`「${log.subject}（${formatMinutes(log.minutes)}）」を削除しますか？`)) return;
    const res = await fetch(`/api/logs/${log.id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 404) {
      alert("削除できませんでした。");
      return;
    }
    await reload();
  }

  const maxDay = Math.max(60, ...(stats?.byDay.map((d) => d.minutes) ?? [0]));
  const maxSubject = Math.max(1, ...(stats?.bySubject.map((s) => s.minutes) ?? [0]));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">学習記録</h1>
        <p className="text-sm text-zinc-500">毎日の勉強を記録して、あとから見返す</p>
      </header>

      {loadError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{loadError}</p>}

      {/* 合計 */}
      <section className="grid grid-cols-2 gap-3">
        <div className="card">
          <p className="text-xs text-zinc-500">今日</p>
          <p className="text-2xl font-bold">{formatMinutes(stats?.today ?? 0)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-zinc-500">最近7日間</p>
          <p className="text-2xl font-bold">{formatMinutes(stats?.last7Days ?? 0)}</p>
        </div>
      </section>

      {/* 7日間のグラフと科目ごと */}
      {stats && (
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="card">
            <h2 className="mb-3 text-sm font-semibold">日ごと</h2>
            <div className="flex h-32 items-end gap-2">
              {stats.byDay.map((d) => (
                <div key={d.date} className="flex h-full flex-1 flex-col items-center gap-1">
                  {/* 棒の高さは「この日の分 ÷ いちばん多い日の分」 */}
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t bg-indigo-500"
                      style={{ height: `${(d.minutes / maxDay) * 100}%`, minHeight: d.minutes ? 2 : 0 }}
                      title={`${dayLabel(d.date)} ${formatMinutes(d.minutes)}`}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500">{dayLabel(d.date).replace(/\(.\)/, "")}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h2 className="mb-3 text-sm font-semibold">科目ごと（7日間）</h2>
            {stats.bySubject.length === 0 && <p className="text-sm text-zinc-500">まだ記録がありません</p>}
            <ul className="space-y-2">
              {stats.bySubject.map((s) => (
                <li key={s.subject} className="text-sm">
                  <div className="flex justify-between">
                    <span>{s.subject}</span>
                    <span className="text-zinc-500">{formatMinutes(s.minutes)}</span>
                  </div>
                  <div className="mt-1 h-2 rounded bg-zinc-100 dark:bg-zinc-800">
                    <div className="h-2 rounded bg-indigo-500" style={{ width: `${(s.minutes / maxSubject) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 入力フォーム */}
      <form onSubmit={handleSubmit} className="card space-y-3">
        <h2 className="text-sm font-semibold">記録する</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="field">
            <span>日付</span>
            <input type="date" value={studiedOn} max={todayLocal()} onChange={(e) => setStudiedOn(e.target.value)} required />
          </label>
          <label className="field">
            <span>科目</span>
            <input
              list="subjects"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="例：データベース"
              maxLength={30}
              required
            />
            <datalist id="subjects">
              {subjects.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
          <label className="field">
            <span>時間（分）</span>
            <input type="number" min={1} max={1440} value={minutes} onChange={(e) => setMinutes(e.target.value)} required />
          </label>
        </div>
        <label className="field">
          <span>メモ（任意）</span>
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={2} maxLength={500} placeholder="何をやったか、わかったこと" />
        </label>
        {errors.length > 0 && (
          <ul className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "保存中…" : "記録する"}
        </button>
      </form>

      {/* 一覧 */}
      <section className="card">
        <h2 className="mb-3 text-sm font-semibold">これまでの記録</h2>
        {logs.length === 0 && <p className="text-sm text-zinc-500">まだ記録がありません</p>}
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {logs.map((log) => (
            <li key={log.id} className="flex items-start gap-3 py-3 text-sm">
              <span className="w-20 shrink-0 text-zinc-500">{dayLabel(log.studiedOn)}</span>
              <div className="min-w-0 flex-1">
                <p>
                  <span className="font-semibold">{log.subject}</span>
                  <span className="ml-2 text-zinc-500">{formatMinutes(log.minutes)}</span>
                </p>
                {log.memo && <p className="mt-1 whitespace-pre-wrap break-words text-zinc-600 dark:text-zinc-400">{log.memo}</p>}
              </div>
              <button onClick={() => handleDelete(log)} className="shrink-0 text-xs text-zinc-400 hover:text-red-600">
                削除
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
