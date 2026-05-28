export const SELL_REASON_KR: Record<string, string> = {
  catastrophe: '손절 (-10%)',
  trailing: '후행 손절',
  'trailing-tight': '후행 손절 (강)',
  'bear-flip': '약세장 청산',
  'time-stop': '보유기간 만료',
  'dist-chunk': '분할 매도',
  'dca-start': '분할 매수 (1차)',
  'dca-chunk': '분할 매수 (추가)',
};

export function reasonKr(reason: string | undefined | null): string {
  if (!reason) return '';
  return SELL_REASON_KR[reason] ?? reason;
}
