/**
 * Pure state-management helpers for the CWC portfolio simulator.
 * State shape:
 *   {
 *     kr: { cash:number, positions:Position[], blacklist:{ ticker:expiryDate } },
 *     us: { cash, positions, blacklist },
 *     maxSlots: number,
 *   }
 * Position:
 *   { ticker, market, name, shares, costBasis, avgCost, peak,
 *     firstBuyDate, lastBuyDate, dcaPlan|null, distPlan|null }
 */

export function initState({ krInitial, usInitial, maxSlots = 5 }) {
  return {
    kr: { cash: krInitial, positions: [], blacklist: {} },
    us: { cash: usInitial, positions: [], blacklist: {} },
    maxSlots,
  };
}

function clonePool(pool) {
  return {
    cash: pool.cash,
    positions: pool.positions.map((p) => ({ ...p })),
    blacklist: { ...pool.blacklist },
  };
}

function cloneState(state) {
  return { kr: clonePool(state.kr), us: clonePool(state.us), maxSlots: state.maxSlots };
}

function poolOf(state, market) {
  return market === 'KR' ? state.kr : state.us;
}

export function buyShares(state, { market, ticker, name, shares, price, date }) {
  const next = cloneState(state);
  const pool = poolOf(next, market);
  pool.cash -= shares * price;
  let pos = pool.positions.find((p) => p.ticker === ticker);
  if (!pos) {
    pos = {
      ticker, market, name,
      shares: 0, costBasis: 0, avgCost: 0, peak: price,
      firstBuyDate: date, lastBuyDate: date,
      dcaPlan: null, distPlan: null,
    };
    pool.positions.push(pos);
  }
  pos.shares += shares;
  pos.costBasis += shares * price;
  pos.avgCost = pos.costBasis / pos.shares;
  pos.peak = Math.max(pos.peak, price);
  pos.lastBuyDate = date;
  return next;
}

export function sellShares(state, { market, ticker, shares, price }) {
  const next = cloneState(state);
  const pool = poolOf(next, market);
  const pos = pool.positions.find((p) => p.ticker === ticker);
  if (!pos) return state;
  const sellShares_ = Math.min(shares, pos.shares);
  pool.cash += sellShares_ * price;
  pos.shares -= sellShares_;
  pos.costBasis -= sellShares_ * pos.avgCost;  // approximation: realize at avg
  if (pos.shares <= 0) {
    pool.positions = pool.positions.filter((p) => p.ticker !== ticker);
  }
  return next;
}

/**
 * priceMap: { ticker: lastClose } — must cover every open position; missing tickers use avgCost.
 * fx.usdKrw: USD→KRW rate for totalKrwEquiv.
 */
export function computeEquity(state, priceMap, fx = { usdKrw: 1300 }) {
  const krPosValue = state.kr.positions.reduce(
    (acc, p) => acc + (priceMap[p.ticker] ?? p.avgCost) * p.shares,
    0,
  );
  const usPosValue = state.us.positions.reduce(
    (acc, p) => acc + (priceMap[p.ticker] ?? p.avgCost) * p.shares,
    0,
  );
  return {
    kr: { cash: state.kr.cash, posValue: krPosValue },
    us: { cash: state.us.cash, posValue: usPosValue },
    totalKrwEquiv:
      state.kr.cash + krPosValue + (state.us.cash + usPosValue) * fx.usdKrw,
  };
}

export function freeSlots(state, market) {
  const pool = poolOf(state, market);
  return Math.max(0, state.maxSlots - pool.positions.length);
}

export function updatePeak(state, market, ticker, price) {
  const next = cloneState(state);
  const pool = poolOf(next, market);
  const pos = pool.positions.find((p) => p.ticker === ticker);
  if (pos) pos.peak = Math.max(pos.peak, price);
  return next;
}

export function setPlan(state, market, ticker, planKey, planValue) {
  const next = cloneState(state);
  const pool = poolOf(next, market);
  const pos = pool.positions.find((p) => p.ticker === ticker);
  if (pos) pos[planKey] = planValue;
  return next;
}

export function blacklistTicker(state, market, ticker, expiryDate) {
  const next = cloneState(state);
  const pool = poolOf(next, market);
  pool.blacklist[ticker] = expiryDate;
  return next;
}

export function isBlacklisted(state, market, ticker, currentDate) {
  const pool = poolOf(state, market);
  const expiry = pool.blacklist[ticker];
  if (!expiry) return false;
  if (expiry < currentDate) {
    delete pool.blacklist[ticker];
    return false;
  }
  return true;
}
