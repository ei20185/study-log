"use client";

import { useState } from "react";

interface RecordFormProps {
  onAdd: (subject: string, minutes: number) => void;
}

export function RecordForm({ onAdd }: RecordFormProps) {
  const [subject, setSubject] = useState("");
  const [minutes, setMinutes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedSubject = subject.trim();
    const parsedMinutes = Number(minutes);

    if (trimmedSubject === "") {
      setError("科目を入力してください。");
      return;
    }

    if (!Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
      setError("勉強時間は1以上の数字で入力してください。");
      return;
    }

    onAdd(trimmedSubject, Math.round(parsedMinutes));
    setSubject("");
    setMinutes("");
    setError(null);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="科目（例: SPI 非言語）"
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-900"
        />
        <input
          type="number"
          value={minutes}
          onChange={(event) => setMinutes(event.target.value)}
          placeholder="分"
          min={1}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-900 sm:w-24"
        />
        <button
          type="submit"
          className="rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-neutral-700"
        >
          追加
        </button>
      </div>

      {error !== null && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
