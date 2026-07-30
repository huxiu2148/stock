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
    broker: trade.broker,
    note: trade.note,
  };

  return {
    remainingPatch: { shares: remainingShares, fee_buy: remainingFeeBuy },
    soldTrade,
  };
}

export interface MergeSellLineInput {
  tradeId: string;
  /** 這筆要賣出的股數，可以小於該筆持有股數（部分賣出）。 */
  soldShares: number;
}

export interface MergeSellPlanItem {
  trade: StockTrade;
  soldShares: number;
  feeSellShare: number;
  taxShare: number;
  /** true = 這筆全部賣出（直接更新即可）；false = 部分賣出（需要拆成兩筆）。 */
  isFullSell: boolean;
}

/**
 * 合併賣出：多筆不同批次買進的持股，一次用同一個賣出價賣掉，
 * 每一筆可以只賣出部分股數（例如買20股+10股，只賣掉合計24股）。
 * 這次交易的手續費、交易稅依「各筆實際賣出股數」佔「總賣出股數」的比例分攤，
 * 最後一筆吃捨入誤差，確保分攤後加總跟原本輸入的總額一致。
 */
export function planMergeSell(
  trades: StockTrade[],
  lines: MergeSellLineInput[],
  totalFeeSell: number,
  totalTax: number
): MergeSellPlanItem[] {
  const byId = new Map(trades.map((t) => [t.id, t]));
  const activeLines = lines.filter((l) => l.soldShares > 0);
  const totalSoldShares = activeLines.reduce((sum, l) => sum + l.soldShares, 0);

  let allocatedFee = 0;
  let allocatedTax = 0;

  return activeLines.map((line, i) => {
    const trade = byId.get(line.tradeId)!;
    const isLast = i === activeLines.length - 1;
    const feeSellShare = isLast
      ? totalFeeSell - allocatedFee
      : Math.round(totalFeeSell * (line.soldShares / totalSoldShares));
    const taxShare = isLast
      ? totalTax - allocatedTax
      : Math.round(totalTax * (line.soldShares / totalSoldShares));
    allocatedFee += feeSellShare;
    allocatedTax += taxShare;

    return {
      trade,
      soldShares: line.soldShares,
      feeSellShare,
      taxShare,
      isFullSell: line.soldShares >= trade.shares,
    };
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
