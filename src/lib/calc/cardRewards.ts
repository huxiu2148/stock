import type { CardRewardRule } from "@/types/database";

export const REWARD_CURRENCIES = ["TWD", "USD", "KRW", "JPY", "CNY"] as const;

export type ChannelCategory =
  | "網路購物"
  | "超商量販"
  | "餐飲"
  | "數位影音"
  | "旅遊"
  | "日韓消費"
  | "海外消費"
  | "行動支付"
  | "一般消費";

/** 規則的通路文字裡只要包含這些關鍵字，就視為涵蓋該類別；一個通路可以同時涵蓋多個類別。 */
const CATEGORY_KEYWORDS: [ChannelCategory, string[]][] = [
  ["網路購物", ["網購", "購物"]],
  ["超商量販", ["超商", "量販", "超市"]],
  ["餐飲", ["餐飲", "美食"]],
  ["數位影音", ["數位", "遊戲", "影音", "串流", "訂閱"]],
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
  ["foodpanda", ["餐飲"]],
  ["ubereats", ["餐飲"]],
  ["uber eats", ["餐飲"]],
  ["麥當勞", ["餐飲"]],
  ["mcdonald", ["餐飲"]],
  ["肯德基", ["餐飲"]],
  ["kfc", ["餐飲"]],
  ["netflix", ["數位影音"]],
  ["disney", ["數位影音"]],
  ["weverse", ["數位影音", "網路購物"]],
  ["wowpass", ["日韓消費", "海外消費", "旅遊"]],
  ["spotify", ["數位影音"]],
  ["youtube", ["數位影音"]],
  ["apple music", ["數位影音"]],
  ["hbo", ["數位影音"]],
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
  ["大國藥妝", ["網路購物"]],
  ["sugi藥妝", ["網路購物"]],
  ["長榮", ["旅遊"]],
  ["華航", ["旅遊"]],
  ["eva air", ["旅遊"]],
  ["china airlines", ["旅遊"]],
  ["日本", ["日韓消費", "海外消費"]],
  ["japan", ["日韓消費", "海外消費"]],
  ["東京", ["日韓消費", "海外消費"]],
  ["大阪", ["日韓消費", "海外消費"]],
  ["唐吉訶德", ["日韓消費", "海外消費"]],
  ["sogo", ["日韓消費", "海外消費"]],
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

export interface RewardCalcInput {
  amount: number;
  currency: string;
  /** currency 為 TWD 時忽略；其他幣別用來換算成台幣估算回饋。 */
  exchangeRate: number;
  /** 這次消費符合的消費類別 (通常是自動判斷商店名稱得出，也可以手動指定)。 */
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
 * 有些卡片 (例如國泰CUBE、台新Richart) 同時間只能啟用一個權益方案，
 * 這些規則會共用同一個 plan_group；回傳這張卡有哪些互斥方案可以選。
 */
export function getPlanOptions(rules: CardRewardRule[]): CardRewardRule[] {
  return rules.filter((r) => r.plan_group);
}

/**
 * 挑出某張卡最適用的規則：先排除掉「屬於互斥方案分組、但不是目前啟用的那個」，
 * 再篩出「通路涵蓋這次消費類別」或「一般消費」的規則，
 * 幣別完全對應優先，其次是不限幣別的規則；有多筆時取回饋比例最高者
 * (這樣消費類別有對應到加碼規則時，加碼規則自然會贏過一般消費的基礎比例)。
 */
function pickBestRule(
  rules: CardRewardRule[],
  categories: ChannelCategory[],
  currency: string,
  activePlanChannel: string | null
): CardRewardRule | null {
  const eligible = rules.filter(
    (r) => !r.plan_group || r.channel === activePlanChannel
  );
  const applicable = eligible.filter((r) => {
    const ruleCategories = categorizeChannel(r.channel);
    return (
      ruleCategories.includes("一般消費") ||
      ruleCategories.some((c) => categories.includes(c))
    );
  });
  const currencyMatched = applicable.filter((r) => r.currency_scope === currency);
  const pool = currencyMatched.length > 0
    ? currencyMatched
    : applicable.filter((r) => !r.currency_scope);
  if (pool.length === 0) return null;
  return pool.reduce((best, r) => (r.rate > best.rate ? r : best), pool[0]);
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

  const results: CardRewardResult[] = [];
  for (const [cardName, rules] of rulesByCard) {
    const rule = pickBestRule(
      rules,
      input.categories,
      input.currency,
      activePlanByCard[cardName] ?? null
    );
    const reward = rule
      ? Math.min(amountTwd * (rule.rate / 100), rule.max_reward ?? Infinity)
      : 0;
    results.push({ cardName, rule, amountTwd, reward });
  }

  return results.sort((a, b) => {
    if (!a.rule && b.rule) return 1;
    if (a.rule && !b.rule) return -1;
    return b.reward - a.reward;
  });
}
