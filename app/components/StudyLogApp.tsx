"use client";

import { useSyncExternalStore } from "react";

import { createRecord } from "@/app/lib/records";
import { getServerSnapshot, getSnapshot, subscribe, updateRecords } from "@/app/lib/record-store";
import { RecordForm } from "@/app/components/RecordForm";
import { RecordList } from "@/app/components/RecordList";

export function StudyLogApp() {
  const records = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function handleAdd(subject: string, minutes: number) {
    updateRecords((current) => [createRecord(subject, minutes), ...current]);
  }

  function handleDelete(id: string) {
    updateRecords((current) => current.filter((record) => record.id !== id));
  }

  return (
    <div className="flex flex-col gap-8">
      <RecordForm onAdd={handleAdd} />

      <section>
        <h2 className="mb-3 text-sm font-semibold text-neutral-700">記録</h2>
        <RecordList records={records} onDelete={handleDelete} />
      </section>
    </div>
  );
}
