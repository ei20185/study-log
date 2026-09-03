import { formatDate, type StudyRecord } from "@/app/lib/records";

interface RecordListProps {
  records: readonly StudyRecord[];
  onDelete: (id: string) => void;
}

export function RecordList({ records, onDelete }: RecordListProps) {
  if (records.length === 0) {
    return <p className="text-sm text-neutral-500">まだ記録がありません。</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-neutral-200">
      {records.map((record) => (
        <li key={record.id} className="flex items-center gap-4 py-3">
          <span className="w-12 shrink-0 text-xs text-neutral-500">
            {formatDate(record.createdAt)}
          </span>
          <span className="flex-1 text-sm text-neutral-900">{record.subject}</span>
          <span className="text-sm tabular-nums text-neutral-600">{record.minutes}分</span>
          <button
            type="button"
            onClick={() => onDelete(record.id)}
            aria-label={`${record.subject}の記録を削除`}
            className="rounded px-2 py-1 text-xs text-neutral-400 transition hover:bg-neutral-100 hover:text-red-600"
          >
            削除
          </button>
        </li>
      ))}
    </ul>
  );
}
