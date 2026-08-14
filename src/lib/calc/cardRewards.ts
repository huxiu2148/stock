import type { CardRewardRule } from "@/types/database";

export const REWARD_CURRENCIES = ["TWD", "USD", "KRW", "JPY", "CNY"] as const;

export type ChannelCategory =
  | "網路購物"
  | "超商量販"
  | "餐飲"
  | "數位影音"
  | "主流影音訂閱"
  | "悠遊卡加值"
  | "旅遊"
  | "日韓消費"
  | "海外消費"
  | "行動支付"
  | "一般消費";

/**
 * 規則的通路文字裡只要包含這些關鍵字，就視為涵蓋該類別；一個通路可以同時涵蓋多個類別。
 *
 * 「數位影音」跟「主流影音訂閱」故意分開：前者是廣義的數位/遊戲/追星平台
 * (Weverse、KKBOX、Steam...)，後者專指 Netflix/Disney+/Spotify 這種主流國際訂閱服務。
 * 有些卡片 (例如富邦J卡) 只認主流訂閱平台、不含 Weverse 這類粉絲平台，
 * 分開後規則的通路文字才能精準只觸發它實際涵蓋的範圍，避免誤判。
 */
const CATEGORY_KEYWORDS: [ChannelCategory, string[]][] = [
  ["網路購物", ["網購", "購物"]],
  ["超商量販", ["超商", "量販", "超市"]],
  ["餐飲", ["餐飲", "美食", "外送"]],
  ["數位影音", ["數位", "遊戲", "影音", "串流"]],
  ["主流影音訂閱", ["訂閱", "主流影音"]],
  ["悠遊卡加值", ["加值"]],
  ["旅遊", ["旅遊", "旅行", "訂房", "機票"]],
  ["日韓消費", ["日韓", "日本", "韓國"]],
  ["海外消費", ["海外", "國外"]],
  ["行動支付", ["行動支付", "電子支付"]],
  ["一般消費", ["一般消費"]],
];

/** 可手動指定的消費類別清單 (不含「一般消費」，因為那一律都會當作保底自動套用)。 */
export const CHANNEL_CATEGORIES: ChannelCategory[] = CATEGORY_KEYWORDS.map(
  ([c]) => c
).filter((c) => c !== "一般消費");

/** 依規則的通路文字，判斷它涵蓋哪些消費類別。 */
export function categorizeChannel(channelLabel: string): ChannelCategory[] {
  return CATEGORY_KEYWORDS.filter(([, keywords]) =>
    keywords.some((k) => channelLabel.includes(k))
  ).map(([category]) => category);
}

/**
 * 常見商店/品牌關鍵字 → 消費類別，用來從商店名稱自動判斷通路。非窮舉，可持續擴充。
 *
 * 注意：「日韓消費」「海外消費」代表的是人在當地面對面刷卡消費，
 * 不是「品牌/平台是日韓或海外公司」。很多卡片的海外/日韓加碼條款明文
 * 只認實體面對面交易、排除網路購物 (例如富邦J卡)，所以像 weverse、
 * amazon 這類網路平台即使公司在海外，也只標「網路購物」，不能標成
 * 「日韓消費」或「海外消費」，避免誤導使用者以為網購也算加碼。
 */
const MERCHANT_KEYWORDS: [string, ChannelCategory[]][] = [
  ["pchome", ["網路購物"]],
  ["momo", ["網路購物"]],
  ["蝦皮", ["網路購物"]],
  ["shopee", ["網路購物"]],
  ["淘寶", ["網路購物"]],
  ["taobao", ["網路購物"]],
  ["酷澎", ["網路購物"]],
  ["coupang", ["網路購物"]],
  ["yahoo購物", ["網路購物"]],
  ["博客來", ["網路購物"]],
  ["friday購物", ["網路購物"]],
  ["amazon", ["網路購物"]],
  ["ebay", ["網路購物"]],
  ["7-11", ["超商量販"]],
  ["7-eleven", ["超商量販"]],
  ["全家", ["超商量販"]],
  ["familymart", ["超商量販"]],
  ["萊爾富", ["超商量販"]],
  ["ok mart", ["超商量販"]],
  ["全聯", ["超商量販"]],
  ["pxmart", ["超商量販"]],
  ["家樂福", ["超商量販"]],
  ["carrefour", ["超商量販"]],
  ["大潤發", ["超商量販"]],
  ["costco", ["超商量販"]],
  ["好市多", ["超商量販"]],
  ["starbucks", ["餐飲"]],
  ["星巴克", ["餐飲"]],
  ["夜市", ["餐飲"]],
  ["foodpanda", ["餐飲"]],
  ["ubereats", ["餐飲"]],
  ["uber eats", ["餐飲"]],
  ["麥當勞", ["餐飲"]],
  ["mcdonald", ["餐飲"]],
  ["肯德基", ["餐飲"]],
  ["kfc", ["餐飲"]],
  ["netflix", ["數位影音", "主流影音訂閱"]],
  ["disney", ["數位影音", "主流影音訂閱"]],
  ["weverse", ["數位影音", "網路購物"]],
  ["wowpass", ["日韓消費", "海外消費", "旅遊"]],
  ["悠遊卡", ["悠遊卡加值"]],
  ["加值", ["悠遊卡加值"]],
  ["spotify", ["數位影音", "主流影音訂閱"]],
  ["youtube", ["數位影音", "主流影音訂閱"]],
  ["apple music", ["數位影音", "主流影音訂閱"]],
  ["hbo", ["數位影音", "主流影音訂閱"]],
  ["kkbox", ["數位影音"]],
  ["catchplay", ["數位影音"]],
  ["line tv", ["數位影音"]],
  ["kktv", ["數位影音"]],
  ["steam", ["數位影音"]],
  ["playstation", ["數位影音"]],
  ["nintendo", ["數位影音"]],
  ["blizzard", ["數位影音"]],
  ["garena", ["數位影音"]],
  ["agoda", ["旅遊"]],
  ["booking", ["旅遊"]],
  ["klook", ["旅遊"]],
  ["kkday", ["旅遊"]],
  ["trip.com", ["旅遊"]],
  ["expedia", ["旅遊"]],
  ["airbnb", ["旅遊"]],
  ["trivago", ["旅遊"]],
  ["asiayo", ["旅遊"]],
  ["rakuten", ["網路購物"]],
  ["mercari", ["網路購物"]],
  ["iherb", ["網路購物"]],
  ["selfridges", ["網路購物"]],
  ["gmarket", ["網路購物"]],
  ["olive young", ["網路購物"]],
  ["shein", ["網路購物"]],
  ["farfetch", ["網路購物"]],
  ["大國藥妝", ["網路購物"]],
  ["sugi藥妝", ["網路購物"]],
  ["ikea", ["網路購物"]],
  ["特力屋", ["網路購物"]],
  ["hola", ["網路購物"]],
  ["uniqlo", ["網路購物"]],
  ["zara", ["網路購物"]],
  ["lululemon", ["網路購物"]],
  ["新光三越", ["網路購物"]],
  ["遠東百貨", ["網路購物"]],
  ["漢神", ["網路購物"]],
  ["outlet", ["網路購物"]],
  ["長榮", ["旅遊"]],
  ["華航", ["旅遊"]],
  ["eva air", ["旅遊"]],
  ["china airlines", ["旅遊"]],
  ["日本", ["日韓消費", "海外消費"]],
  ["japan", ["日韓消費", "海外消費"]],
  ["東京", ["日韓消費", "海外消費"]],
  ["大阪", ["日韓消費", "海外消費"]],
  // 唐吉訶德、SOGO 台灣都有分店，跟日本原店同名，容易誤判成海外消費，
  // 這裡改標成台灣常見的消費類別；真的人在日本刷這兩間店，用「日本唐吉訶德」
  // 「日本sogo」等含國名的完整說法，或手動指定類別，比較準確。
  ["唐吉訶德", ["超商量販"]],
  ["sogo", ["網路購物"]],
  ["suica", ["日韓消費", "海外消費"]],
  ["pasmo", ["日韓消費", "海外消費"]],
  ["韓國", ["日韓消費", "海外消費"]],
  ["korea", ["日韓消費", "海外消費"]],
  ["首爾", ["日韓消費", "海外消費"]],
  ["美國", ["海外消費"]],
  ["usa", ["海外消費"]],
  ["line pay", ["行動支付"]],
  ["街口", ["行動支付"]],
  ["jkopay", ["行動支付"]],
  ["apple pay", ["行動支付"]],
  ["google pay", ["行動支付"]],
  ["台灣pay", ["行動支付"]],
  ["taiwan pay", ["行動支付"]],
  ["全支付", ["行動支付"]],
];

/** 依輸入的商店/通路文字，比對出符合的消費類別 (可能同時符合多個，例如「日本 amazon」)。 */
export function matchMerchantCategories(text: string): ChannelCategory[] {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return [];
  const matched = new Set<ChannelCategory>();
  for (const [keyword, categories] of MERCHANT_KEYWORDS) {
    if (normalized.includes(keyword.toLowerCase())) {
      categories.forEach((c) => matched.add(c));
    }
  }
  return [...matched];
}

/** 找出輸入文字裡實際比對到的關鍵字原文，用於畫面顯示「符合：xxx」。 */
export function matchedMerchantKeywords(text: string): string[] {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return [];
  return MERCHANT_KEYWORDS.filter(([keyword]) =>
    normalized.includes(keyword.toLowerCase())
  ).map(([keyword]) => keyword);
}

/** 已收錄的商店關鍵字清單，用於輸入框的自動完成建議。 */
export const MERCHANT_KEYWORD_LIST: string[] = MERCHANT_KEYWORDS.map(([k]) => k);

/** 把規則的 merchants 欄位 (用 / 、換行等分隔) 拆成個別商家名稱陣列。 */
export function parseMerchantList(merchants: string | null): string[] {
  if (!merchants) return [];
  return merchants
    .split(/[/、,，\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 這次輸入的商店文字，是否對到規則的具體商家清單裡的任一個名稱 (雙向包含比對)。 */
function matchesRuleMerchants(rule: CardRewardRule, searchText: string): boolean {
  const normalized = searchText.trim().toLowerCase();
  if (!normalized) return false;
  return parseMerchantList(rule.merchants).some((m) => {
    const nm = m.toLowerCase();
    return normalized.includes(nm) || nm.includes(normalized);
  });
}

/** 規則是否還在有效期間內 (valid_from/valid_until 皆為選填，留空代表沒有限制)。 */
export function isRuleActive(rule: CardRewardRule, todayIso: string): boolean {
  if (rule.valid_from && todayIso < rule.valid_from) return false;
  if (rule.valid_until && todayIso > rule.valid_until) return false;
  return true;
}

export interface RewardCalcInput {
  amount: number;
  currency: string;
  /** currency 為 TWD 時忽略；其他幣別用來換算成台幣估算回饋。 */
  exchangeRate: number;
  /** 這次消費的商店/情境原始輸入文字，用來跟規則的具體商家清單比對。 */
  merchantText: string;
  /** 這次消費符合的消費類別；只有規則沒有填具體商家清單時才會拿來當退回比對用。 */
  categories: ChannelCategory[];
}

export interface CardRewardResult {
  cardName: string;
  rule: CardRewardRule | null;
  amountTwd: number;
  reward: number;
}

export function groupRulesByCard(
  rules: CardRewardRule[]
): Map<string, CardRewardRule[]> {
  const map = new Map<string, CardRewardRule[]>();
  for (const r of rules) {
    const list = map.get(r.card_name) ?? [];
    list.push(r);
    map.set(r.card_name, list);
  }
  return map;
}

/**
 * 一筆規則是否適用這次消費：有填具體商家清單的話，只用商家清單比對 (更精準)；
 * 沒有填的話才退回用 channel 文字概略比對消費類別。
 */
function ruleMatchesSpending(
  rule: CardRewardRule,
  merchantText: string,
  categories: ChannelCategory[]
): boolean {
  const ruleCategories = categorizeChannel(rule.channel);
  if (ruleCategories.includes("一般消費")) return true;
  const merchants = parseMerchantList(rule.merchants);
  if (merchants.length > 0) return matchesRuleMerchants(rule, merchantText);
  return ruleCategories.some((c) => categories.includes(c));
}

/**
 * 這種每天可自由切換方案的卡 (國泰CUBE、台新Richart)，實際使用時本來就會挑跟這次
 * 消費最匹配的方案再刷，所以自動選出最匹配的方案當預設值最貼近實際情況；
 * 完全比對不到時，退回選第一個方案 (由呼叫端手動覆寫即可)。
 */
export function pickBestPlanChannel(
  planOptions: CardRewardRule[],
  merchantText: string,
  categories: ChannelCategory[]
): string {
  const matched = planOptions.filter((r) =>
    ruleMatchesSpending(r, merchantText, categories)
  );
  const pool = matched.length > 0 ? matched : planOptions;
  return pool.reduce((best, r) => (r.rate > best.rate ? r : best), pool[0]).channel;
}

/**
 * 有些卡片 (例如國泰CUBE、台新Richart) 同時間只能啟用一個權益方案，
 * 這些規則會共用同一個 plan_group；回傳這張卡有哪些互斥方案可以選 (排除已過期的)。
 */
export function getPlanOptions(
  rules: CardRewardRule[],
  todayIso: string = new Date().toISOString().slice(0, 10)
): CardRewardRule[] {
  return rules.filter((r) => r.plan_group && isRuleActive(r, todayIso));
}

/**
 * 挑出某張卡最適用的規則：先濾掉過期/還沒開始的規則、以及「屬於互斥方案分組、
 * 但不是目前啟用的那個」，再篩出符合這次消費的規則 (有具體商家清單的規則只用
 * 商家清單比對，沒有的話才退回用 channel 文字概略比對消費類別)，
 * 幣別完全對應優先，其次是不限幣別的規則；有多筆時取回饋比例最高者。
 */
function pickBestRule(
  rules: CardRewardRule[],
  merchantText: string,
  categories: ChannelCategory[],
  currency: string,
  activePlanChannel: string | null,
  todayIso: string
): CardRewardRule | null {
  const eligible = rules.filter(
    (r) =>
      (!r.plan_group || r.channel === activePlanChannel) && isRuleActive(r, todayIso)
  );
  const applicable = eligible.filter((r) =>
    ruleMatchesSpending(r, merchantText, categories)
  );
  const currencyMatched = applicable.filter((r) => r.currency_scope === currency);
  const pool = currencyMatched.length > 0
    ? currencyMatched
    : applicable.filter((r) => !r.currency_scope);
  if (pool.length === 0) return null;
  return pool.reduce((best, r) => (r.rate > best.rate ? r : best), pool[0]);
}

/** 依規則的回饋比例跟單筆上限，算出某個台幣金額能拿到的回饋。 */
export function calcRuleReward(rule: CardRewardRule, amountTwd: number): number {
  return Math.min(amountTwd * (rule.rate / 100), rule.max_reward ?? Infinity);
}

/**
 * 依回饋金額由高到低排序每張卡的試算結果；沒有對應規則的卡片排在最後。
 * activePlanByCard: 卡片名稱 -> 目前啟用的方案 (規則的 channel)，只有互斥方案卡片需要提供。
 */
export function rankCardRewards(
  rulesByCard: Map<string, CardRewardRule[]>,
  input: RewardCalcInput,
  activePlanByCard: Record<string, string> = {}
): CardRewardResult[] {
  const amountTwd =
    input.currency === "TWD" ? input.amount : input.amount * input.exchangeRate;
  const todayIso = new Date().toISOString().slice(0, 10);

  const results: CardRewardResult[] = [];
  for (const [cardName, rules] of rulesByCard) {
    const rule = pickBestRule(
      rules,
      input.merchantText,
      input.categories,
      input.currency,
      activePlanByCard[cardName] ?? null,
      todayIso
    );
    const reward = rule ? calcRuleReward(rule, amountTwd) : 0;
    results.push({ cardName, rule, amountTwd, reward });
  }

  return results.sort((a, b) => {
    if (!a.rule && b.rule) return 1;
    if (a.rule && !b.rule) return -1;
    if (b.reward !== a.reward) return b.reward - a.reward;
    // 沒輸入金額時 reward 全部是 0，改用回饋比例排序。
    return (b.rule?.rate ?? 0) - (a.rule?.rate ?? 0);
  });
}
