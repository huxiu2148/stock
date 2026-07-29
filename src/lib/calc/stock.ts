import type { StockTrade } from "@/types/database";

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
