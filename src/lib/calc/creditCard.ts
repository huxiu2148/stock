import type { CreditCard, CreditCardStatement } from "@/types/database";

/** 換算成台幣的帳單金額；美金卡用當月輸入的約略匯率換算。 */
export function statementTwdAmount(
  card: CreditCard,
  statement: CreditCardStatement | undefined
): number {
  if (!statement) return 0;
  if (card.currency === "USD") {
    return statement.amount * (statement.exchange_rate ?? 0);
  }
  return statement.amount;
}

/** 某個月份、所有卡片帳單換算成台幣後的加總。 */
export function sumMonthTwd(
  cards: CreditCard[],
  statements: CreditCardStatement[],
  yearMonth: string
): number {
  const byCard = new Map(cards.map((c) => [c.id, c]));
  return statements
    .filter((s) => s.year_month === yearMonth)
    .reduce((sum, s) => {
      const card = byCard.get(s.card_id);
      return card ? sum + statementTwdAmount(card, s) : sum;
    }, 0);
}
