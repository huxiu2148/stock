import type { CardRewardRule } from "@/types/database";

export const REWARD_CURRENCIES = ["TWD", "USD", "KRW", "JPY", "CNY"] as const;

export interface RewardCalcInput {
  amount: number;
  currency: string;
  /** currency 為 TWD 時忽略；其他幣別用來換算成台幣估算回饋。 */
  exchangeRate: number;
  channel: string;
}

export interface CardRewardResult {
  cardName: string;
  rule: CardRewardRule | null;
  amountTwd: number;
  reward: number;
}

/** 依通路、幣別挑出最適用的規則：幣別完全對應優先，其次是不限幣別的規則；有多筆時取回饋比例最高者。 */
function pickBestRule(
  rules: CardRewardRule[],
  channel: string,
  currency: string
): CardRewardRule | null {
  const sameChannel = rules.filter((r) => r.channel === channel);
  const currencyMatched = sameChannel.filter((r) => r.currency_scope === currency);
  const pool = currencyMatched.length > 0
    ? currencyMatched
    : sameChannel.filter((r) => !r.currency_scope);
  if (pool.length === 0) return null;
  return pool.reduce((best, r) => (r.rate > best.rate ? r : best), pool[0]);
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

/** 依回饋金額由高到低排序每張卡的試算結果；沒有對應規則的卡片排在最後。 */
export function rankCardRewards(
  rulesByCard: Map<string, CardRewardRule[]>,
  input: RewardCalcInput
): CardRewardResult[] {
  const amountTwd =
    input.currency === "TWD" ? input.amount : input.amount * input.exchangeRate;

  const results: CardRewardResult[] = [];
  for (const [cardName, rules] of rulesByCard) {
    const rule = pickBestRule(rules, input.channel, input.currency);
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
