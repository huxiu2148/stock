import type { StockTrade, StockTradeInput } from "@/types/database";

/**
 * 排序：有賣出日的（已賣出）優先排在前面，同一組再依買進日新到舊排序。
 */
export function sortStockTrades(trades: StockTrade[]): StockTrade[] {
  return [...trades].sort((a, b) => {
    const aClosed = a.sell_date != null;
    const bClosed = b.sell_date != null;
    if (aClosed !== bClosed) return aClosed ? -1 : 1;
    return b.buy_date.localeCompare(a.buy_date);
  });
}

export interface StockTradeCalc {
  isClosed: boolean;
  costNative: number;
  proceedsNative: number | null;
  gainNative: number | null;
  costTwd: number;
  proceedsTwd: number | null;
  gainTwd: number | null;
  returnPct: number | null;
}

/** 台股 / 台幣結算美股：以下欄位就是 TWD，不需匯率。美金結算美股：需匯率換算成台幣。 */
export function computeStockTrade(trade: StockTrade): StockTradeCalc {
  const isClosed = trade.actual_sell_price != null && !!trade.sell_date;

  const costNative = trade.buy_price * trade.shares + trade.fee_buy;
  const proceedsNative = isClosed
    ? trade.actual_sell_price! * trade.shares - trade.fee_sell - trade.tax
    : null;
  const gainNative =
    proceedsNative != null ? proceedsNative - costNative : null;

  const needsFx = trade.currency === "USD";
  const buyRate = needsFx ? trade.exchange_rate_buy ?? 1 : 1;
  const sellRate = needsFx
    ? trade.exchange_rate_sell ?? trade.exchange_rate_buy ?? 1
    : 1;

  const costTwd = costNative * buyRate;
  const proceedsTwd = proceedsNative != null ? proceedsNative * sellRate : null;
  const gainTwd = proceedsTwd != null ? proceedsTwd - costTwd : null;
  const returnPct = costTwd ? (gainTwd ?? 0) / costTwd : null;

  return {
    isClosed,
    costNative,
    proceedsNative,
    gainNative,
    costTwd,
    proceedsTwd,
    gainTwd,
    returnPct: isClosed ? returnPct : null,
  };
}

export interface PartialSellInput {
  shares: number;
  sell_date: string;
  actual_sell_price: number;
  fee_sell: number;
  tax: number;
}

export interface PartialSellSplit {
  /** 更新到原本那筆紀錄的內容：股數變少，買進手續費按比例扣掉已賣出的部分。 */
  remainingPatch: Partial<StockTradeInput>;
  /** 用來新增一筆「已賣出」紀錄的完整內容。 */
  soldTrade: StockTradeInput;
}

/**
 * 分批賣出：把一筆持股拆成「已賣出」與「剩餘持有」兩筆。
 * 買進手續費按賣出股數佔總股數的比例分攤，避免整筆手續費被算兩次或算漏。
 */
export function splitPartialSell(
  trade: StockTrade,
  sold: PartialSellInput
): PartialSellSplit {
  const soldShares = Math.min(sold.shares, trade.shares);
  const remainingShares = trade.shares - soldShares;
  const soldFeeBuy = Math.round(trade.fee_buy * (soldShares / trade.shares));
  const remainingFeeBuy = trade.fee_buy - soldFeeBuy;

  const soldTrade: StockTradeInput = {
    market: trade.market,
    currency: trade.currency,
    symbol: trade.symbol,
    name: trade.name,
    buy_date: trade.buy_date,
    sell_date: sold.sell_date,
    buy_price: trade.buy_price,
    target_sell_price: trade.target_sell_price,
    actual_sell_price: sold.actual_sell_price,
    shares: soldShares,
    fee_buy: soldFeeBuy,
    fee_sell: sold.fee_sell,
    tax: sold.tax,
    exchange_rate_buy: trade.exchange_rate_buy,
    exchange_rate_sell: trade.exchange_rate_sell,
    note: trade.note,
  };

  return {
    remainingPatch: { shares: remainingShares, fee_buy: remainingFeeBuy },
    soldTrade,
  };
}

export interface MergeSellAllocation {
  tradeId: string;
  fee_sell: number;
  tax: number;
}

/**
 * 合併賣出：多筆不同批次買進的持股，一次用同一個賣出價賣掉。
 * 這次交易的手續費、交易稅按各筆股數佔總股數的比例分攤到每一筆，
 * 最後一筆吃捨入誤差，確保分攤後加總跟原本輸入的總額一致。
 */
export function splitMergedSellFees(
  trades: Pick<StockTrade, "id" | "shares">[],
  totalFeeSell: number,
  totalTax: number
): MergeSellAllocation[] {
  const totalShares = trades.reduce((sum, t) => sum + t.shares, 0);
  if (totalShares <= 0) {
    return trades.map((t) => ({ tradeId: t.id, fee_sell: 0, tax: 0 }));
  }

  let allocatedFee = 0;
  let allocatedTax = 0;

  return trades.map((t, i) => {
    const isLast = i === trades.length - 1;
    const fee = isLast
      ? totalFeeSell - allocatedFee
      : Math.round(totalFeeSell * (t.shares / totalShares));
    const tax = isLast
      ? totalTax - allocatedTax
      : Math.round(totalTax * (t.shares / totalShares));
    allocatedFee += fee;
    allocatedTax += tax;
    return { tradeId: t.id, fee_sell: fee, tax };
  });
}

export interface StockPortfolioSummary {
  realizedGainTwd: number;
  openPositions: number;
  closedPositions: number;
  investedTwdOpen: number;
}

export function summarizeStockTrades(trades: StockTrade[]): StockPortfolioSummary {
  return trades.reduce<StockPortfolioSummary>(
    (acc, trade) => {
      const calc = computeStockTrade(trade);
      if (calc.isClosed) {
        return {
          ...acc,
          realizedGainTwd: acc.realizedGainTwd + (calc.gainTwd ?? 0),
          closedPositions: acc.closedPositions + 1,
        };
      }
      return {
        ...acc,
        openPositions: acc.openPositions + 1,
        investedTwdOpen: acc.investedTwdOpen + calc.costTwd,
      };
    },
    {
      realizedGainTwd: 0,
      openPositions: 0,
      closedPositions: 0,
      investedTwdOpen: 0,
    }
  );
}
