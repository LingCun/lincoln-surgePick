# surgePick

모바일 우선 한국·미국 주식 스크리너.

- **오늘의 급등픽** — KR 1 + US 1. 단기/중기/장기 자동 분류. 패턴: 완만 우상향 + 거래량 증가 + 하단 매집.
- **지금 시장 어때?** — 공포지수(VIX) + 4시장(코스피·코스닥·S&P500·NASDAQ) 60일 지수 차트 + MA50/MA200 + 종합 권장 비중 + 인기·투자가치 테마 carousel.

## 로컬 실행

```bash
npm install
npm run scan         # Yahoo에서 데이터 페치 → src/data/*.json (~5-10분)
npm run dev          # http://localhost:4321
```

## Scripts

- `npm run scan:regime` — `src/data/regime.json` (4시장 + VIX, ~30초)
- `npm run scan:picks` — `src/data/picks.json` (KR/US 각 1개, ~3-5분)
- `npm run scan:themes` — `src/data/themes.json` (KR/US 인기·가치 테마, ~5-10분)
- `npm run scan` — 모두 순차 실행
- `npm run test` — Vitest 단위 테스트
- `npm run build` — 프로덕션 정적 빌드

## 배포

Vercel 정적. `main` 브랜치 push 시 자동 재빌드.

데이터 갱신: 로컬에서 `npm run scan` → JSON 커밋 → push.

## 면책

본 사이트의 정보는 투자 판단의 참고용이며 매수/매도 추천이 아닙니다. 모든 투자의 책임은 본인에게 있습니다.

데이터 출처: Yahoo Finance.
