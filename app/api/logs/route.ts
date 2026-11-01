// /api/logs
//   GET  … 記録の一覧（新しい順）
//   POST … 記録を1件追加
import { getDb } from "@/lib/db";
import { createLog, listLogs } from "@/lib/repository";
import { todayJst, validateLogInput } from "@/lib/validation";

export async function GET() {
  return Response.json({ logs: listLogs(getDb()) });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ errors: ["JSON の形が正しくありません。"] }, { status: 400 });
  }

  const result = validateLogInput(body, todayJst());
  if (!result.ok) {
    // 400 Bad Request：送られた値がおかしい（どこがだめかを返す）
    return Response.json({ errors: result.errors }, { status: 400 });
  }

  const log = createLog(getDb(), result.value);
  // 201 Created：新しく作れた
  return Response.json({ log }, { status: 201 });
}
