export interface ScheduleEvent {
  date: string;
  time?: string;
  market: 'KR' | 'US';
  category: 'fed' | 'bok' | 'macro' | 'earnings' | 'other';
  title: string;
  importance: 'high' | 'mid' | 'low';
  ticker?: string;
}

export interface IndexedEvent {
  id: string;
  event: ScheduleEvent;
}

export function sortEvents<T extends { date: string; time?: string }>(events: T[]): T[] {
  return [...events].sort((a, b) =>
    a.date === b.date
      ? (a.time ?? '').localeCompare(b.time ?? '')
      : a.date.localeCompare(b.date)
  );
}

export function indexEvents(events: ScheduleEvent[]): IndexedEvent[] {
  const sorted = sortEvents(events);
  const counter = new Map<string, number>();
  return sorted.map((e) => {
    const c = counter.get(e.date) ?? 0;
    counter.set(e.date, c + 1);
    return { id: `${e.market.toLowerCase()}-${e.date}-${c}`, event: e };
  });
}

export function eventDateTimeUtc(e: { date: string; time?: string }): Date {
  const time = e.time ?? '00:00';
  return new Date(`${e.date}T${time}:00+09:00`);
}

export function isEventOver(e: { date: string; time?: string }, now: number = Date.now()): boolean {
  const time = e.time ?? '23:59';
  const dt = new Date(`${e.date}T${time}:00+09:00`);
  return !isNaN(dt.getTime()) && dt.getTime() < now;
}

export const CATEGORY_EMOJI: Record<string, string> = {
  fed: '🏛️',
  bok: '🏦',
  macro: '📊',
  earnings: '💼',
  other: '📌',
};

export const CATEGORY_LABEL: Record<string, string> = {
  fed: 'Fed',
  bok: 'BOK',
  macro: '거시',
  earnings: '실적',
  other: '기타',
};

export const CATEGORY_DESC: Record<string, string> = {
  fed: 'Federal Reserve(미 연준) 통화정책 회의. 정책금리·자산매입·점도표(전망) 변경 여부가 글로벌 위험자산 가격을 좌우합니다. 결과 발표 30분 뒤 의장 기자회견에서 추가 시그널 확인.',
  bok: '한국은행 금융통화위원회. 기준금리 결정과 총재 기자간담회. 원화 자산·은행주·부동산 섹터에 즉각 영향. 발표 직후 환율·국채 금리 반응을 봅니다.',
  macro: '거시경제 지표 발표. 시장 컴센서스 대비 서프라이즈가 주가·환율·금리에 즉각 반영됩니다. 동일 지표라도 발표 시점의 시장 기대치에 따라 같은 수치가 다르게 해석될 수 있어요.',
  earnings: '기업 분기 실적 발표. EPS·매출 컴센서스 충족 여부보다 가이던스(향후 전망)와 컴퍼런스콜 톤이 더 중요. 실적 직전/직후 옥션 IV 급변에 유의.',
  other: '기타 이벤트. 카테고리에 속하지 않는 시장 영향 일정.',
};
