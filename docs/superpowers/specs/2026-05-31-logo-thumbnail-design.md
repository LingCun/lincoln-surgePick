# lincoln-surgePick 로고 · favicon · OG 썸네일 디자인

작성일: 2026-05-31

## 1. 목표

브랜드 마크가 없던 사이트에 일관된 시각 정체성을 부여한다. 산출물 세 가지:

1. **로고** (심볼 + 워드마크) — 헤더에 사용
2. **favicon** — 브라우저 탭 아이콘
3. **OG 썸네일** — 링크 공유(카톡/트위터/디스코드) 미리보기 이미지

모두 사이트의 다크 테마(`slate-950`)와 cyan→sky 시그니처 컬러를 따른다.

## 2. 확정된 디자인 (브레인스토밍 결과)

- **심볼: "퓨어 서지"(B2)** — 베이스라인에서 곧장 솟구치는 단일 급등선 + 우상단 화살촉. "surge(급등)"를 직관적으로 표현하고, 로고·favicon에 동일 형태를 써서 일관성을 확보한다.
- **OG 썸네일: 좌우 분할(OG2)** — 왼쪽 로고+태그라인, 오른쪽 예측선·신뢰밴드 차트 비주얼. 제품의 정체성(궤적 예측)을 한눈에 전달.
- **태그라인:** "시장 국면 매칭 기반 종목 예측 시뮬레이터"

## 3. 디자인 토큰

| 항목 | 값 |
|---|---|
| 배경 (다크) | `#020617` (slate-950) |
| 패널 배경 | `#0b1220` |
| 심볼 그라데이션 | `#22d3ee` (cyan-400) → `#0ea5e9` (sky-500), 좌하→우상 |
| 화살촉 / 강조점 | `#67e8f9` (cyan-300) |
| 워드마크 `lincoln-` | `#e2e8f0` (slate-200) |
| 워드마크 `surgePick` | 그라데이션 `#67e8f9` → `#0ea5e9` |
| 태그라인 텍스트 | `#94a3b8` (slate-400) |
| 폰트 | Pretendard / system-ui sans, weight 700~800, letter-spacing -0.02em |

## 4. 심볼 SVG (단일 소스)

viewBox `0 0 64 64`, stroke 기반. 모든 산출물이 이 path를 공유한다.

```
급등선:  M6 44 L26 44 L44 14      (stroke-width 4.5, round cap/join, 그라데이션)
화살촉:  M34 13 L45 13 L45 24     (stroke-width 4.5, round cap/join, #67e8f9)
```

- **헤더/투명 버전:** 배경 없이 심볼만 (그라데이션 stroke)
- **favicon 버전:** 다크 라운드 사각(`#020617`, radius 14) 위에 심볼. 탭 배경색이 밝든 어둡든 일관되게 보이도록 배경 포함. stroke-width는 작은 크기 가독성을 위해 굵게(약 6) 조정.

## 5. 산출물 파일

| 파일 | 내용 | 생성 방법 |
|---|---|---|
| `src/components/Logo.astro` | 인라인 SVG 심볼 + 워드마크. `size`, `withWordmark` props | 직접 작성 |
| `public/favicon.svg` | 다크 라운드 배경 + 심볼 (벡터, 모던 브라우저) | 직접 작성 |
| `public/apple-touch-icon.png` | 180×180 PNG (iOS 홈 화면) | favicon SVG → sharp 변환 |
| `public/og-default.png` | 1200×630 PNG (OG2 레이아웃) | OG SVG → sharp 변환 |
| `scripts/build-og.mjs` | 위 두 PNG를 SVG에서 생성하는 빌드 스크립트 | 직접 작성 |

- **PNG 변환:** `sharp@0.33.5`(설치 확인됨)로 SVG 버퍼를 래스터화. OG image와 apple-touch-icon은 PNG여야 한다(소셜 플랫폼은 SVG OG image를 렌더하지 않음).
- **빌드 통합:** 생성된 PNG를 **git에 커밋해 그대로 사용**한다. Vercel Linux 빌드 환경엔 한글 폰트(Malgun Gothic)가 없어 OG 텍스트가 깨지므로, `build` 체인에서 PNG를 재생성하지 **않는다**. 디자인 변경 시에만 로컬(Windows)에서 `npm run build:og`를 실행하고 결과 PNG를 커밋한다.

## 6. Base.astro 통합

### 헤더
현재 텍스트 링크(`<a>lincoln-surgePick</a>`)를 `<Logo>` 컴포넌트로 교체. 심볼 + 워드마크 가로 배치.

### `<head>` 메타 태그 추가
```
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta property="og:type" content="website" />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:image" content={new URL('/og-default.png', Astro.site)} />
<meta property="og:url" content={Astro.url} />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content={new URL('/og-default.png', Astro.site)} />
```
- `description`은 Base props에 기본값(태그라인)을 추가하고 페이지가 덮어쓸 수 있게 한다.
- `og:image`는 절대 URL이어야 하므로 `Astro.site`(`https://lincoln-surgepick.vercel.app`) 기준으로 생성.

## 7. OG2 레이아웃 스펙 (1200×630)

- 배경 `#020617`. 우측 `x≥640` 영역에 `#0b1220` 패널.
- **좌측:** 심볼(약 1.3× 확대) + 워드마크 54px(800) + 태그라인 2줄 25px(slate-400) — "시장 국면 매칭 기반 / 종목 예측 시뮬레이터".
- **우측:** 신뢰밴드(`#0ea5e9` opacity 0.15 fill) + 점선 예측 보조선 + 메인 급등선(그라데이션 7px) + 화살촉 + 끝점 dot(`#67e8f9`).

## 8. 범위 밖 (YAGNI)

- 라이트모드 로고 변형 — 사이트가 다크 전용이므로 불필요.
- 페이지별 맞춤 OG 이미지(동적 생성) — 현재는 공통 1장으로 충분. 추후 필요 시 별도 작업.
- `poc/index.html` 로고 — POC는 별개 산출물. 이번 범위에서 제외.
- `favicon.ico` — SVG favicon + PNG fallback(apple-touch-icon)으로 모던 브라우저 커버. 레거시 .ico는 생략.

## 9. 검증

- `npm run dev`로 헤더 로고·favicon 육안 확인 (다크 배경, 18px 탭에서 뭉개지지 않는지).
- `npm run build` 후 `public/og-default.png`, `public/apple-touch-icon.png` 생성 확인.
- OG 메타: 빌드 결과 HTML에 절대 URL `og:image`가 박히는지 확인. (배포 후 카톡/트위터 공유 또는 OG 디버거로 최종 확인.)
