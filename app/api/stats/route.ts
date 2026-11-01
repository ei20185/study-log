// /api/stats
//   GET … 今日・7日間の合計、日ごと・科目ごとの合計と、入力候補の科目
import { getDb } from "@/lib/db";
import { getStats, listSubjects } from "@/lib/repository";
import { addDays, todayJst } from "@/lib/validation";

export async function GET() {
  const db = getDb();
  const today = todayJst();
  const stats = getStats(db, today, addDays(today, -6));
  return Response.json({ stats, subjects: listSubjects(db) });
}
