import type { CardRewardRule } from "@/types/database";

export const REWARD_CURRENCIES = ["TWD", "USD", "KRW", "JPY", "CNY"] as const;

export type ChannelCategory =
  | "網路購物"
  | "超商量販"
  | "百貨"
  | "餐飲"
  | "數位影音"
  | "主流影音訂閱"
  | "悠遊卡加值"
  | "加油"
  | "交通"
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
  ["網路購物", ["網購", "購物", "電商"]],
  ["超商量販", ["超商", "量販", "超市", "便利商店"]],
  ["百貨", ["百貨", "outlet", "商場"]],
  ["餐飲", ["餐飲", "美食", "外送", "餐廳"]],
  ["數位影音", ["數位", "遊戲", "影音", "串流"]],
  ["主流影音訂閱", ["訂閱", "主流影音"]],
  ["悠遊卡加值", ["加值"]],
  ["加油", ["加油", "油站", "充電"]],
  ["交通", ["交通", "停車", "計程車", "叫車", "捷運", "高鐵", "臺鐵", "台鐵"]],
  ["旅遊", ["旅遊", "旅行", "訂房", "機票", "航空", "飯店", "住宿"]],
  ["日韓消費", ["日韓", "日本", "韓國"]],
  ["海外消費", ["海外", "國外"]],
  ["行動支付", ["行動支付", "電子支付"]],
  ["一般消費", ["一般消費"]],
];

/**
 * 使用者輸入的「情境泛稱」→ 消費類別。跟 MERCHANT_KEYWORDS (具體品牌) 分開的原因：
 *
 * 打具體品牌 (例如「麥當勞」) 時，卡片的商家清單有沒有列到它就是答案，
 * 不能因為它屬於餐飲類就硬塞進某張卡的餐飲方案 (麥當勞其實被排除在台新好饗刷之外)。
 *
 * 但打泛稱 (例如「吃飯」) 時，本來就沒有specific商家可以排除，
 * 這時用類別比對才是使用者要的：「我要吃飯，哪張卡的餐飲方案最好？」
 */
const SCENARIO_KEYWORDS: [string, ChannelCategory[]][] = [
  ["網購", ["網路購物"]],
  ["網路購物", ["網路購物"]],
  ["電商", ["網路購物"]],
  ["線上購物", ["網路購物"]],
  ["買東西", ["網路購物", "超商量販", "百貨"]],
  ["超商", ["超商量販"]],
  ["便利商店", ["超商量販"]],
  ["超市", ["超商量販"]],
  ["量販", ["超商量販"]],
  ["百貨", ["百貨"]],
  ["outlet", ["百貨"]],
  ["商場", ["百貨"]],
  ["逛街", ["百貨"]],
  ["餐廳", ["餐飲"]],
  ["吃飯", ["餐飲"]],
  ["用餐", ["餐飲"]],
  ["美食", ["餐飲"]],
  ["聚餐", ["餐飲"]],
  ["外送", ["餐飲"]],
  ["手搖", ["餐飲"]],
  ["咖啡", ["餐飲"]],
  ["追劇", ["數位影音", "主流影音訂閱"]],
  ["影音", ["數位影音", "主流影音訂閱"]],
  ["串流", ["數位影音", "主流影音訂閱"]],
  ["訂閱", ["數位影音", "主流影音訂閱"]],
  ["遊戲", ["數位影音"]],
  ["課金", ["數位影音"]],
  ["加油", ["加油"]],
  ["油錢", ["加油"]],
  ["充電", ["加油"]],
  ["停車", ["交通"]],
  ["計程車", ["交通"]],
  ["叫車", ["交通"]],
  ["交通", ["交通"]],
  ["通勤", ["交通"]],
  ["高鐵", ["交通"]],
  ["火車", ["交通"]],
  ["旅遊", ["旅遊"]],
  ["旅行", ["旅遊"]],
  ["出國", ["旅遊", "海外消費"]],
  ["度假", ["旅遊"]],
  ["訂房", ["旅遊"]],
  ["飯店", ["旅遊"]],
  ["住宿", ["旅遊"]],
  ["機票", ["旅遊"]],
  ["航空", ["旅遊"]],
  ["悠遊卡", ["悠遊卡加值"]],
  ["一卡通", ["悠遊卡加值"]],
  ["行動支付", ["行動支付"]],
  ["電子支付", ["行動支付"]],
  ["海外", ["海外消費"]],
  ["國外", ["海外消費"]],
  ["境外", ["海外消費"]],
  ["overseas", ["海外消費"]],
  ["日本", ["日韓消費", "海外消費"]],
  ["韓國", ["日韓消費", "海外消費"]],
  ["日韓", ["日韓消費", "海外消費"]],
];

/**
 * 依使用者輸入的文字，比對出其中「情境泛稱」對應的消費類別。
 * 這些類別可以套用到有具體商家清單的規則上 (具體品牌名則不行，見 SCENARIO_KEYWORDS 說明)。
 */
export function matchScenarioCategories(text: string): ChannelCategory[] {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return [];
  const matched = new Set<ChannelCategory>();
  for (const [keyword, categories] of SCENARIO_KEYWORDS) {
    if (normalized.includes(keyword.toLowerCase())) {
      categories.forEach((c) => matched.add(c));
    }
  }
  return [...matched];
}

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
  ["新光三越", ["百貨"]],
  ["遠東百貨", ["百貨"]],
  ["遠東sogo", ["百貨"]],
  ["微風", ["百貨"]],
  ["台北101", ["百貨"]],
  ["誠品生活", ["百貨"]],
  ["京站", ["百貨"]],
  ["漢神", ["百貨"]],
  ["夢時代", ["百貨"]],
  ["大遠百", ["百貨"]],
  ["中友百貨", ["百貨"]],
  ["outlet", ["百貨"]],
  // 加油/充電
  ["中油", ["加油"]],
  ["台塑石油", ["加油"]],
  ["台亞", ["加油"]],
  ["全國加油", ["加油"]],
  ["速邁樂", ["加油"]],
  ["u-power", ["加油"]],
  ["evoasis", ["加油"]],
  ["evalue", ["加油"]],
  // 交通
  ["高鐵", ["交通"]],
  ["臺鐵", ["交通"]],
  ["台鐵", ["交通"]],
  ["捷運", ["交通"]],
  ["台灣大車隊", ["交通"]],
  ["yoxi", ["交通"]],
  ["55688", ["交通"]],
  ["uber", ["交通"]],
  ["bolt", ["交通"]],
  ["linego", ["交通"]],
  ["車麻吉", ["交通"]],
  ["uspace", ["交通"]],
  ["utagg", ["交通"]],
  ["irent", ["交通"]],
  ["和運租車", ["交通"]],
  ["格上租車", ["交通"]],
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
  // 日本交通卡：儲值是透過 App/線上完成，不是「人在日本面對面刷卡」，
  // 標成海外消費會讓卡片的海外實體加碼誤判成適用，所以只標交通。
  ["suica", ["交通"]],
  ["pasmo", ["交通"]],
  ["icoca", ["交通"]],
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

/** 已收錄的情境泛稱清單，用於輸入框的自動完成建議。 */
export const SCENARIO_KEYWORD_LIST: string[] = SCENARIO_KEYWORDS.map(([k]) => k);

export interface SpendingTextAnalysis {
  /** 全部類別 (具體品牌 + 情境泛稱 + 手動指定)。 */
  categories: ChannelCategory[];
  /** 其中可以套用到「有具體商家清單」規則上的類別。 */
  scenarioCategories: ChannelCategory[];
  /** 實際比對到的關鍵字原文，用於畫面顯示。 */
  matchedKeywords: string[];
  /** 是否認得這是某個具體品牌 (而不是泛稱)。 */
  isSpecificMerchant: boolean;
}

/**
 * 解析使用者輸入的消費文字，決定要用「具體商家」還是「情境泛稱」的比對方式。
 *
 * 關鍵在於兩者不能混用：打得出具體品牌時 (例如「中華航空」)，代表使用者很清楚要刷哪一間，
 * 這時該嚴格照各家的商家清單判斷；如果同時放行泛稱比對，「中華航空」裡的「航空」二字
 * 會讓它誤判成適用所有標了旅遊類的方案 (連清單裡根本沒有中華航空的訂房平台方案都會中)。
 * 反過來打泛稱時 (例如「訂房」)，本來就沒有specific商家可以查，用類別比對才問得到答案。
 */
export function analyzeSpendingText(
  text: string,
  manualCategory?: ChannelCategory | null
): SpendingTextAnalysis {
  const merchantCategories = matchMerchantCategories(text);
  const isSpecificMerchant = merchantCategories.length > 0;
  // 認得是具體品牌時就不再套用泛稱，避免品牌名裡剛好含有泛稱字眼造成誤判。
  const fromScenario = isSpecificMerchant ? [] : matchScenarioCategories(text);
  const scenarioCategories = [
    ...new Set([...fromScenario, ...(manualCategory ? [manualCategory] : [])]),
  ];
  return {
    categories: [...new Set([...merchantCategories, ...scenarioCategories])],
    scenarioCategories,
    matchedKeywords: isSpecificMerchant
      ? matchedMerchantKeywords(text)
      : matchedScenarioKeywords(text),
    isSpecificMerchant,
  };
}

/** 找出輸入文字裡實際比對到的情境泛稱原文，用於畫面顯示。 */
function matchedScenarioKeywords(text: string): string[] {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return [];
  return SCENARIO_KEYWORDS.filter(([keyword]) =>
    normalized.includes(keyword.toLowerCase())
  ).map(([keyword]) => keyword);
}

/** 把規則的 merchants 欄位 (用 / 、換行等分隔) 拆成個別商家名稱陣列。 */
export function parseMerchantList(merchants: string | null): string[] {
  if (!merchants) return [];
  return merchants
    .split(/[/、,，\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * 這次輸入的商店文字，對到規則的具體商家清單裡最長的那個名稱有幾個字 (0 = 沒對到)。
 *
 * 回傳長度而不是 true/false，是為了在多個規則都對得到時分出「誰比較精準」：
 * 例如打「Uber Eats」，台新天天刷清單裡的「Uber」跟好饗刷清單裡的「Uber Eats」都會
 * 被字串包含比到，但後者明顯才是使用者的意思，用比對長度就能選對。
 */
function merchantMatchScore(rule: CardRewardRule, searchText: string): number {
  const normalized = searchText.trim().toLowerCase();
  if (!normalized) return 0;
  let best = 0;
  for (const m of parseMerchantList(rule.merchants)) {
    const nm = m.toLowerCase();
    if (normalized.includes(nm) || nm.includes(normalized)) {
      best = Math.max(best, Math.min(nm.length, normalized.length));
    }
  }
  return best;
}

/**
 * 一筆規則實際涵蓋哪些消費類別：除了通路名稱的文字，也把商家清單裡每個商家的類別算進來。
 *
 * 因為銀行取的方案名稱常常跟實際涵蓋範圍對不上 (例如台新「天天刷」在系統裡叫「超商量販」，
 * 但清單裡其實還有中油、臺鐵、台灣大車隊、藥妝店)，只看名稱會讓「加油」「通勤」這種
 * 情境永遠比不到它。從清單反推類別才能反映這條規則真正能用在哪。
 */
function ruleCoveredCategories(rule: CardRewardRule): ChannelCategory[] {
  const fromChannel = categorizeChannel(rule.channel);
  const merchants = parseMerchantList(rule.merchants);
  if (merchants.length === 0) return fromChannel;
  const all = new Set<ChannelCategory>(fromChannel);
  for (const m of merchants) {
    for (const c of matchMerchantCategories(m)) all.add(c);
  }
  return [...all];
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
  /** 這次消費符合的全部消費類別 (具體品牌 + 情境泛稱 + 手動指定)。 */
  categories: ChannelCategory[];
  /**
   * 其中屬於「情境泛稱/手動指定」的類別。這些可以套用到有具體商家清單的規則上，
   * 具體品牌推導出來的類別則不行 (原因見 SCENARIO_KEYWORDS 說明)。留空則等同 categories。
   */
  scenarioCategories?: ChannelCategory[];
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
 * 一筆規則是否適用這次消費，以及對得多精準 (分數越高越精準，0 = 不適用)。
 *
 * 有填具體商家清單的規則，商家名比對優先 (最精準)；比不到時，只接受「情境泛稱」的類別比對，
 * 不接受具體品牌推導出來的類別 —— 因為打具體品牌時，清單沒列到它通常就代表真的不適用
 * (例如麥當勞明文被排除在台新好饗刷之外，不能因為它是餐飲就硬算)。
 * 沒填清單的規則沒有這個顧慮，用全部類別比對。
 */
function ruleMatchScore(
  rule: CardRewardRule,
  merchantText: string,
  categories: ChannelCategory[],
  scenarioCategories: ChannelCategory[]
): number {
  const covered = ruleCoveredCategories(rule);
  if (covered.includes("一般消費")) return 1;

  const hasMerchantList = parseMerchantList(rule.merchants).length > 0;
  if (hasMerchantList) {
    const score = merchantMatchScore(rule, merchantText);
    // 對到具體商家名：加權讓它一定排在純類別比對前面。
    if (score > 0) return 1000 + score;
    return covered.some((c) => scenarioCategories.includes(c)) ? 10 : 0;
  }
  return covered.some((c) => categories.includes(c)) ? 10 : 0;
}

/** 一筆規則是否適用這次消費 (給畫面上「這個通路對不對得上」的提示用)。 */
export function ruleMatchesSpending(
  rule: CardRewardRule,
  merchantText: string,
  categories: ChannelCategory[],
  scenarioCategories: ChannelCategory[] = categories
): boolean {
  return ruleMatchScore(rule, merchantText, categories, scenarioCategories) > 0;
}

/**
 * 這種每天可自由切換方案的卡 (國泰CUBE、台新Richart)，實際使用時本來就會挑跟這次
 * 消費最匹配的方案再刷，所以自動選出最匹配的方案當預設值最貼近實際情況；
 * 完全比對不到時，退回選第一個方案 (由呼叫端手動覆寫即可)。
 */
export function pickBestPlanChannel(
  planOptions: CardRewardRule[],
  merchantText: string,
  categories: ChannelCategory[],
  scenarioCategories: ChannelCategory[] = categories
): string {
  const scored = planOptions
    .map((r) => ({
      rule: r,
      score: ruleMatchScore(r, merchantText, categories, scenarioCategories),
    }))
    .filter((x) => x.score > 0);
  if (scored.length === 0) return planOptions[0].channel;
  return pickHighestRate(scored).rule.channel;
}

/**
 * 從適用的規則裡挑最划算的：回饋比例最高者優先 (那才是實際能拿到的錢)，
 * 比例一樣時才看誰對得比較精準 (例如「Uber Eats」同時對到清單裡的「Uber」跟「Uber Eats」，選後者)。
 */
function pickHighestRate<T extends { rule: CardRewardRule; score: number }>(
  scored: T[]
): T {
  return scored.reduce((best, x) => {
    if (x.rule.rate !== best.rule.rate) return x.rule.rate > best.rule.rate ? x : best;
    return x.score > best.score ? x : best;
  }, scored[0]);
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
  scenarioCategories: ChannelCategory[],
  currency: string,
  activePlanChannel: string | null,
  todayIso: string
): CardRewardRule | null {
  const eligible = rules.filter(
    (r) =>
      (!r.plan_group || r.channel === activePlanChannel) && isRuleActive(r, todayIso)
  );
  const applicable = eligible
    .map((r) => ({
      rule: r,
      score: ruleMatchScore(r, merchantText, categories, scenarioCategories),
    }))
    .filter((x) => x.score > 0);
  const currencyMatched = applicable.filter((x) => x.rule.currency_scope === currency);
  const pool =
    currencyMatched.length > 0
      ? currencyMatched
      : applicable.filter((x) => !x.rule.currency_scope);
  if (pool.length === 0) return null;
  return pickHighestRate(pool).rule;
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
      input.scenarioCategories ?? input.categories,
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
