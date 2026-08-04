const ALLOWED_CURRENCIES = ["USD", "KRW", "JPY", "CNY"];

/** 免費、不需金鑰的匯率查詢服務，回傳以 from 為基準的各幣別匯率。 */
const EXCHANGE_RATE_API = "https://open.er-api.com/v6/latest";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");

  if (!from || !ALLOWED_CURRENCIES.includes(from)) {
    return Response.json({ error: "不支援的幣別" }, { status: 400 });
  }

  try {
    const res = await fetch(`${EXCHANGE_RATE_API}/${from}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`匯率查詢失敗 (${res.status})`);
    const data = await res.json();
    const rate = data?.rates?.TWD;
    if (typeof rate !== "number") throw new Error("查無台幣匯率");
    return Response.json({ rate });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "匯率查詢失敗" },
      { status: 502 }
    );
  }
}
