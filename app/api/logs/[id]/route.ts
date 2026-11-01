// /api/logs/[id]
//   DELETE … 記録を1件削除
import { getDb } from "@/lib/db";
import { deleteLog } from "@/lib/repository";
import { parseId } from "@/lib/validation";

export async function DELETE(_request: Request, ctx: RouteContext<"/api/logs/[id]">) {
  const { id: rawId } = await ctx.params;
  const id = parseId(rawId);
  if (id === null) {
    return Response.json({ errors: ["id は正の整数にしてください。"] }, { status: 400 });
  }

  if (!deleteLog(getDb(), id)) {
    // 404 Not Found：その id の記録はない
    return Response.json({ errors: ["その記録は見つかりません。"] }, { status: 404 });
  }
  // 204 No Content：消せた（返す中身はない）
  return new Response(null, { status: 204 });
}
