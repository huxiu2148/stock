/**
 * Supabase/PostgREST 丟出的錯誤是一般物件（有 message 屬性），
 * 不是 JS 的 Error 實例，所以不能只判斷 instanceof Error，
 * 否則實際錯誤訊息會被吃掉、只顯示通用的失敗文字。
 */
export function errorMessage(err: unknown, fallback = "發生錯誤"): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}
